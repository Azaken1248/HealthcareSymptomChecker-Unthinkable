import { matchedData, validationResult } from 'express-validator';
import { getStructuredLLMResponse } from '../services/llm.service.js';
import admin from '../../config/firebaseAdmin.js';
import { emergencyKeywords } from '../../config/emergencyKeywords.js';


const db = admin.firestore();

export async function getSymptomAnalysis(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { symptoms } = matchedData(req, { locations: ['body'] });

    if (!req.user?.uid) {
      return res.status(401).json({ message: 'Unauthorized: user profile missing.' });
    }

    const uid = req.user.uid;
    const normalizedSymptoms = symptoms.trim().replace(/\s+/g, ' ');
    const lowercasedSymptoms = normalizedSymptoms.toLowerCase();

    const isCritical = emergencyKeywords.some((keyword) => lowercasedSymptoms.includes(keyword));

    const analysis = await getStructuredLLMResponse(normalizedSymptoms);

    if (analysis.error) {
      return res.status(502).json({ message: analysis.error });
    }

    const response = {
      ...analysis,
    };

    if (isCritical) {
      response.criticalWarning =
        'A symptom you mentioned can be associated with serious medical conditions. Please prioritize consulting a healthcare professional immediately to rule out any emergencies.';
    }

    res.status(200).json(response);

    void db.collection('queryHistory').doc(uid).collection('queries').add({
      symptoms: normalizedSymptoms,
      response,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }).catch((error) => console.error('Firestore save failed:', error));

  } catch (error) {
    console.error('Error in symptom controller:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}

export async function getQueryHistory(req, res) {
  try {
    const uid = req.user.uid;

    const historyRef = db.collection('queryHistory').doc(uid).collection('queries');
    const snapshot = await historyRef.orderBy('timestamp', 'desc').limit(50).get();

    if (snapshot.empty) {
      return res.status(200).json([]); 
    }

    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json(history);

  } catch (error) {
    console.error('Error fetching query history:', error);
    return res.status(500).json({ message: 'Failed to fetch query history.' });
  }
}