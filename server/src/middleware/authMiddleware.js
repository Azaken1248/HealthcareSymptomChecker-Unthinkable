import admin from '../config/firebaseAdmin.js';

async function verifyToken(req, res, next) {
  const authHeader = req.get('authorization');
  const tokenMatch = authHeader?.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch) {
    return res.status(401).json({ message: 'Unauthorized: Bearer token required.' });
  }

  const idToken = tokenMatch[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;

    return next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  }
}

export default verifyToken;