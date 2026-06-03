import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/index.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const pendingRequests = [];
let activeRequests = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDurationToMs(durationValue) {
  if (typeof durationValue === 'number' && Number.isFinite(durationValue) && durationValue > 0) {
    return durationValue * 1000;
  }

  if (typeof durationValue !== 'string') {
    return null;
  }

  const normalizedValue = durationValue.trim();

  if (/^\d+$/.test(normalizedValue)) {
    return Number.parseInt(normalizedValue, 10) * 1000;
  }

  const match = normalizedValue.match(/^(\d+)(?:\.(\d+))?s$/i);

  if (!match) {
    return null;
  }

  const wholeSeconds = Number.parseInt(match[1], 10);
  const fractionalMilliseconds = match[2]
    ? Number.parseInt(match[2].padEnd(3, '0').slice(0, 3), 10)
    : 0;

  return wholeSeconds * 1000 + fractionalMilliseconds;
}

function getErrorStatus(error) {
  return error?.status ?? error?.statusCode ?? error?.response?.status ?? null;
}

function isRateLimitError(error) {
  const status = getErrorStatus(error);
  const code = String(error?.code ?? '');
  const statusText = String(error?.statusText ?? error?.message ?? '');

  return (
    status === 429 ||
    code === 'RESOURCE_EXHAUSTED' ||
    code === '429' ||
    /Too Many Requests/i.test(statusText)
  );
}

function getRetryDelayMs(error) {
  const retryInfo = Array.isArray(error?.errorDetails)
    ? error.errorDetails.find(
        (detail) =>
          detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' &&
          typeof detail.retryDelay !== 'undefined',
      )
    : null;

  const retryAfterValue = error?.retryAfter ?? error?.response?.headers?.['retry-after'];

  return (
    parseDurationToMs(retryInfo?.retryDelay) ??
    parseDurationToMs(retryAfterValue) ??
    null
  );
}

async function withConcurrencyLimit(task) {
  if (activeRequests >= config.llmMaxConcurrency) {
    await new Promise((resolve) => pendingRequests.push(resolve));
  }

  activeRequests += 1;

  try {
    return await task();
  } finally {
    activeRequests -= 1;

    const next = pendingRequests.shift();
    if (next) {
      next();
    }
  }
}

function extractJsonPayload(responseText) {
  const trimmedText = responseText.trim();
  const fencedMatch = trimmedText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmedText.indexOf('{');
  const lastBrace = trimmedText.lastIndexOf('}');

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmedText.slice(firstBrace, lastBrace + 1);
  }

  return trimmedText;
}

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAnalysisResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const possibleConditions = Array.isArray(payload.possibleConditions) ? payload.possibleConditions : [];
  const differentiatingSymptoms = Array.isArray(payload.differentiatingSymptoms)
    ? payload.differentiatingSymptoms
    : [];
  const nextSteps = Array.isArray(payload.nextSteps) ? payload.nextSteps : [];

  return (
    isString(payload.summary) &&
    isString(payload.disclaimer) &&
    possibleConditions.every(
      (condition) =>
        condition &&
        isString(condition.name) &&
        isString(condition.reasoning) &&
        ['High', 'Medium', 'Low'].includes(condition.confidence),
    ) &&
    differentiatingSymptoms.every(
      (item) =>
        item &&
        isString(item.condition) &&
        Array.isArray(item.symptomsToCheck) &&
        item.symptomsToCheck.every(isString),
    ) &&
    nextSteps.every(isString)
  );
}

const responseSchema = {
  type: 'OBJECT',
  properties: {
    summary: {
      type: 'STRING',
      description: 'A single, concise sentence summarizing the most likely scenario based on the symptoms.',
    },
    disclaimer: { type: 'STRING' },
    possibleConditions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          reasoning: { type: 'STRING' },
          confidence: {
            type: 'STRING',
            description: "The estimated confidence level. Must be one of: 'High', 'Medium', or 'Low'.",
          },
        },
        required: ['name', 'reasoning', 'confidence'],
      },
    },
    differentiatingSymptoms: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          condition: { type: 'STRING' },
          symptomsToCheck: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
        },
        required: ['condition', 'symptomsToCheck'],
      },
    },
    nextSteps: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
  },
  required: ['summary', 'disclaimer', 'possibleConditions', 'differentiatingSymptoms', 'nextSteps'],
};

async function runGeminiAnalysis(symptomText) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const prompt = `
    You are an advanced AI medical assistant for informational purposes. Your goal is to perform a differential diagnosis.

    1.  Analyze the user's symptoms and provide a concise, one-sentence summary of the most likely situation.
    2.  Identify 2-3 of the most likely possible conditions.
    3.  For each condition, provide a brief reasoning.
    4.  **CRITICAL:** For each condition, you MUST assign a confidence level ('High', 'Medium', or 'Low') based on how well the user's symptoms match the typical presentation of the condition.
    5.  **CRITICAL:** For each condition, provide a list of short, descriptive 'symptomsToCheck' phrases (e.g., "sensitivity to light"). **DO NOT phrase them as questions.**
    6.  Provide safe, actionable next steps.
    7.  Adhere strictly to the provided JSON schema for your entire response.

    User Symptoms: ${JSON.stringify(symptomText)}
    `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  const parsedResponse = JSON.parse(extractJsonPayload(responseText));

  if (!isAnalysisResponse(parsedResponse)) {
    throw new Error('Model response did not match the expected schema.');
  }

  return parsedResponse;
}

export async function getStructuredLLMResponse(symptomText) {
  return withConcurrencyLimit(async () => {
    let lastError = null;

    for (let attempt = 0; attempt <= config.llmMaxRetries; attempt += 1) {
      try {
        return await runGeminiAnalysis(symptomText);
      } catch (error) {
        lastError = error;

        if (!isRateLimitError(error) || attempt === config.llmMaxRetries) {
          break;
        }

        const retryDelayMs = Math.min(getRetryDelayMs(error) ?? 1000 * (attempt + 1), 5000);
        console.warn(
          `Gemini rate limited request. Retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${config.llmMaxRetries + 1}).`,
        );
        await sleep(retryDelayMs);
      }
    }

    console.error('Error communicating with Generative AI:', lastError);

    if (isRateLimitError(lastError)) {
      const retryAfterSeconds = Math.max(
        5,
        Math.ceil((getRetryDelayMs(lastError) ?? 5000) / 1000),
      );

      return {
        error: 'The AI service is temporarily rate-limited. Please try again in a minute.',
        statusCode: 503,
        retryAfterSeconds,
      };
    }

    return {
      error: 'Failed to get a valid analysis from the AI model. The model may be temporarily unavailable or could not adhere to the required response structure.',
      statusCode: 502,
    };
  });
}