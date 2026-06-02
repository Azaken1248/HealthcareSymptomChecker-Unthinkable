import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './index.js';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

function parseServiceAccountJson(rawJson) {
  try {
    return JSON.parse(rawJson);
  } catch (error) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_JSON value: ${error.message}`);
  }
}

function readServiceAccountFromPath(serviceAccountPath) {
  if (!serviceAccountPath) {
    return null;
  }

  const resolvedPath = path.resolve(serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function resolveServiceAccount() {
  if (config.firebaseServiceAccountJson) {
    return parseServiceAccountJson(config.firebaseServiceAccountJson);
  }

  const candidatePaths = [
    config.firebaseServiceAccountPath,
    path.resolve(moduleDirectory, '../../serviceAccountKey.json'),
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    path.resolve(process.cwd(), 'server', 'serviceAccountKey.json'),
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    const serviceAccount = readServiceAccountFromPath(candidatePath);

    if (serviceAccount) {
      return serviceAccount;
    }
  }

  return null;
}

const serviceAccount = resolveServiceAccount();

try {
  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
  });
} catch (error) {
  throw new Error(
    'Failed to initialize Firebase Admin SDK. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, or GOOGLE_APPLICATION_CREDENTIALS.',
  );
}

export default admin;