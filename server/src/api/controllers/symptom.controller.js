import { validationResult } from 'express-validator';
import { getStructuredLLMResponse } from '../services/llm.service.js';

export async function getSymptomAnalysis(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { symptoms } = req.body;
    const analysis = await getStructuredLLMResponse(symptoms);

    if (analysis.error) {
        return res.status(500).json({ message: analysis.error });
    }

    return res.status(200).json(analysis);

  } catch (error) {
    console.error('Error in symptom controller:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}