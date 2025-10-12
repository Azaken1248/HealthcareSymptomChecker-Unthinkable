import { validationResult } from 'express-validator';
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
    const { symptoms } = req.body;

    const uid = req.user.uid; 
    const lowercasedSymptoms = symptoms.toLowerCase();
    
    let isCritical = emergencyKeywords.some(keyword => lowercasedSymptoms.includes(keyword));

    const analysis = await getStructuredLLMResponse(symptoms);

    if (analysis.error) {
      return res.status(500).json({ message: analysis.error });
    }

    if (isCritical) {
      analysis.criticalWarning = "A symptom you mentioned can be associated with serious medical conditions. Please prioritize consulting a healthcare professional immediately to rule out any emergencies.";
    }

    res.status(200).json(analysis);

    db.collection('queryHistory').doc(uid).collection('queries').add({
      symptoms: symptoms,
      response: analysis, 
      timestamp: new Date()
    }).catch(err => console.error("Firestore save failed:", err)); 

  } catch (error) {
    console.error('Error in symptom controller:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}

export async function getQueryHistory(req, res) {
  try {
    const uid = req.user.uid;

    const historyRef = db.collection('queryHistory').doc(uid).collection('queries');
    const snapshot = await historyRef.orderBy('timestamp', 'desc').get();

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