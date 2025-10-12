import admin from '../config/firebaseAdmin.js';

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).send('Unauthorized: No token provided.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; 
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).send('Unauthorized: Invalid token.');
  }
}

export default verifyToken;