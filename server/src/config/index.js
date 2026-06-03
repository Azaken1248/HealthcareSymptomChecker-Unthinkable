import dotenv from 'dotenv';

dotenv.config();

function parsePort(value, fallback) {
  const parsedPort = Number.parseInt(value ?? '', 10);

  return Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : fallback;
}

function parsePositiveInteger(value, fallback) {
  const parsedValue = Number.parseInt(value ?? '', 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function parseOrigins(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (value === '*') {
    return value;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const corsOriginValue = process.env.CORS_ORIGIN?.trim();
const corsOrigins = parseOrigins(corsOriginValue, isProduction ? [] : ['http://localhost:5173']);

if (isProduction && (corsOrigins === '*' || (Array.isArray(corsOrigins) && corsOrigins.length === 0))) {
  throw new Error('CORS_ORIGIN must be set in production.');
}

const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY is required.');
}

const config = {
  port: parsePort(process.env.PORT, 8000),
  llmMaxConcurrency: parsePositiveInteger(process.env.LLM_MAX_CONCURRENCY, 1),
  llmMaxRetries: parsePositiveInteger(process.env.LLM_MAX_RETRIES, 2),
  nodeEnv,
  corsOrigins,
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT?.trim() ?? '1mb',
  geminiApiKey,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim(),
  firebaseServiceAccountPath:
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ??
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH?.trim(),
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
};

export default config;