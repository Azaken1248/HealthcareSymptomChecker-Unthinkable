import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const verifyIdToken = vi.fn();
  const getStructuredLLMResponse = vi.fn();
  const firestoreAdd = vi.fn();
  const historyGet = vi.fn();
  const historyLimit = vi.fn(() => ({
    get: historyGet,
  }));
  const historyOrderBy = vi.fn(() => ({
    limit: historyLimit,
  }));

  const queriesCollection = {
    add: firestoreAdd,
    orderBy: historyOrderBy,
  };

  const firestoreDb = {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => queriesCollection),
      })),
    })),
  };

  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{}';
  delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

  return {
    verifyIdToken,
    getStructuredLLMResponse,
    firestoreAdd,
    historyGet,
    historyLimit,
    historyOrderBy,
    firestoreDb,
  };
});

vi.mock('firebase-admin', () => {
  const firestore = Object.assign(
    vi.fn(() => mockState.firestoreDb),
    {
      FieldValue: {
        serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' })),
      },
    },
  );

  return {
    default: {
      apps: [],
      credential: {
        cert: vi.fn((value) => ({ type: 'cert', value })),
        applicationDefault: vi.fn(() => ({ type: 'applicationDefault' })),
      },
      initializeApp: vi.fn(),
      auth: vi.fn(() => ({ verifyIdToken: mockState.verifyIdToken })),
      firestore,
    },
  };
});

vi.mock('../src/api/services/llm.service.js', () => ({
  getStructuredLLMResponse: mockState.getStructuredLLMResponse,
}));

const { default: app } = await import('../src/app.js');

function buildAnalysisResponse(overrides = {}) {
  return {
    summary: 'Most likely a mild upper respiratory infection.',
    disclaimer: 'This is not a medical diagnosis.',
    possibleConditions: [
      {
        name: 'Common cold',
        reasoning: 'Typical symptom pattern matches.',
        confidence: 'Medium',
      },
    ],
    differentiatingSymptoms: [
      {
        condition: 'Common cold',
        symptomsToCheck: ['runny nose', 'mild sore throat'],
      },
    ],
    nextSteps: ['Rest', 'Hydrate', 'Monitor symptoms'],
    ...overrides,
  };
}

beforeEach(() => {
  mockState.verifyIdToken.mockResolvedValue({ uid: 'user-123' });
  mockState.getStructuredLLMResponse.mockResolvedValue(buildAnalysisResponse());
  mockState.firestoreAdd.mockResolvedValue(undefined);
  mockState.historyGet.mockResolvedValue({ empty: true, docs: [] });
  mockState.historyLimit.mockClear();
  mockState.historyOrderBy.mockClear();
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('server endpoints', () => {
  it('returns a healthy status from GET /healthz', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('adds the configured CORS header for allowed origins', async () => {
    const response = await request(app)
      .get('/healthz')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('rejects symptom checks without a bearer token', async () => {
    const response = await request(app)
      .post('/api/check-symptoms')
      .send({ symptoms: 'fever and cough' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized: Bearer token required.' });
  });

  it('rejects symptom checks with a malformed authorization header', async () => {
    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Basic test-token')
      .send({ symptoms: 'fever and cough' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized: Bearer token required.' });
  });

  it('rejects requests when the token does not map to a user profile', async () => {
    mockState.verifyIdToken.mockResolvedValueOnce({});

    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Bearer test-token')
      .send({ symptoms: 'fever and cough' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized: user profile missing.' });
  });

  it('validates symptom length before reaching the controller', async () => {
    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Bearer test-token')
      .send({ symptoms: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'Symptoms must be between 10 and 750 characters long.',
        }),
      ]),
    );
    expect(mockState.getStructuredLLMResponse).not.toHaveBeenCalled();
  });

  it('rejects non-string symptom input', async () => {
    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Bearer test-token')
      .send({ symptoms: 12345 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'Symptoms must be provided as text.',
        }),
      ]),
    );
  });

  it('returns an analysis response and stores the query history entry', async () => {
    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Bearer test-token')
      .send({ symptoms: '  Severe   shortness   of   breath   with exertion  ' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      summary: 'Most likely a mild upper respiratory infection.',
      criticalWarning:
        'A symptom you mentioned can be associated with serious medical conditions. Please prioritize consulting a healthcare professional immediately to rule out any emergencies.',
    });
    expect(mockState.getStructuredLLMResponse).toHaveBeenCalledWith(
      'Severe shortness of breath with exertion',
    );
    expect(mockState.firestoreAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        symptoms: 'Severe shortness of breath with exertion',
        response: expect.objectContaining({
          criticalWarning:
            'A symptom you mentioned can be associated with serious medical conditions. Please prioritize consulting a healthcare professional immediately to rule out any emergencies.',
        }),
      }),
    );
  });

  it('returns a benign analysis without a critical warning for non-emergency symptoms', async () => {
    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Bearer test-token')
      .send({ symptoms: '  Mild runny nose   and sneezing  ' });

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('criticalWarning');
    expect(mockState.getStructuredLLMResponse).toHaveBeenCalledWith('Mild runny nose and sneezing');
    expect(mockState.firestoreAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        symptoms: 'Mild runny nose and sneezing',
        response: expect.not.objectContaining({ criticalWarning: expect.anything() }),
      }),
    );
  });

  it('handles multiple symptom analyses concurrently without cross-talk', async () => {
    const responseMap = new Map([
      ['mild cough and sneezing', buildAnalysisResponse({ summary: 'Summary for mild cough and sneezing' })],
      [
        'severe shortness of breath and chest tightness',
        buildAnalysisResponse({ summary: 'Summary for severe shortness of breath and chest tightness' }),
      ],
      [
        'headache and nausea for two days',
        buildAnalysisResponse({ summary: 'Summary for headache and nausea for two days' }),
      ],
    ]);

    mockState.getStructuredLLMResponse.mockImplementation(async (symptoms) => {
      await delay(symptoms.includes('severe') ? 10 : 5);
      return responseMap.get(symptoms);
    });

    const [firstResponse, secondResponse, thirdResponse] = await Promise.all([
      request(app)
        .post('/api/check-symptoms')
        .set('Authorization', 'Bearer test-token')
        .send({ symptoms: 'mild cough and sneezing' }),
      request(app)
        .post('/api/check-symptoms')
        .set('Authorization', 'Bearer test-token')
        .send({ symptoms: 'severe shortness of breath and chest tightness' }),
      request(app)
        .post('/api/check-symptoms')
        .set('Authorization', 'Bearer test-token')
        .send({ symptoms: 'headache and nausea for two days' }),
    ]);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.summary).toBe('Summary for mild cough and sneezing');
    expect(firstResponse.body).not.toHaveProperty('criticalWarning');

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.summary).toBe('Summary for severe shortness of breath and chest tightness');
    expect(secondResponse.body).toHaveProperty('criticalWarning');

    expect(thirdResponse.status).toBe(200);
    expect(thirdResponse.body.summary).toBe('Summary for headache and nausea for two days');

    expect(mockState.getStructuredLLMResponse).toHaveBeenCalledTimes(3);
    expect(mockState.firestoreAdd).toHaveBeenCalledTimes(3);
    expect(mockState.firestoreAdd.mock.calls.map(([payload]) => payload.symptoms).sort()).toEqual([
      'headache and nausea for two days',
      'mild cough and sneezing',
      'severe shortness of breath and chest tightness',
    ]);
  });

  it('returns a 502 when the model layer reports an error', async () => {
    mockState.getStructuredLLMResponse.mockResolvedValue({
      error: 'Failed to get a valid analysis from the AI model.',
    });

    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Bearer test-token')
      .send({ symptoms: 'persistent headache and nausea' });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      message: 'Failed to get a valid analysis from the AI model.',
    });
    expect(mockState.firestoreAdd).not.toHaveBeenCalled();
  });

  it('returns a 500 when the controller unexpectedly throws', async () => {
    mockState.getStructuredLLMResponse.mockRejectedValueOnce(new Error('model crashed'));

    const response = await request(app)
      .post('/api/check-symptoms')
      .set('Authorization', 'Bearer test-token')
      .send({ symptoms: 'persistent headache and nausea' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'An internal server error occurred.' });
    expect(mockState.firestoreAdd).not.toHaveBeenCalled();
  });

  it('returns saved query history for the authenticated user', async () => {
    mockState.historyGet.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'query-1',
          data: () => ({
            symptoms: 'headache and fever',
            response: { summary: 'Likely viral illness' },
            timestamp: { seconds: 1710000000 },
          }),
        },
      ],
    });

    const response = await request(app)
      .get('/api/history')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(mockState.historyOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
    expect(mockState.historyLimit).toHaveBeenCalledWith(50);
    expect(response.body).toEqual([
      {
        id: 'query-1',
        symptoms: 'headache and fever',
        response: { summary: 'Likely viral illness' },
        timestamp: { seconds: 1710000000 },
      },
    ]);
  });

  it('returns an empty array when no query history exists', async () => {
    mockState.historyGet.mockResolvedValue({ empty: true, docs: [] });

    const response = await request(app)
      .get('/api/history')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('returns a 500 when query history loading fails', async () => {
    mockState.historyGet.mockRejectedValueOnce(new Error('firestore unavailable'));

    const response = await request(app)
      .get('/api/history')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Failed to fetch query history.' });
  });

  it('returns a 404 for unknown routes', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Route not found.' });
  });
});