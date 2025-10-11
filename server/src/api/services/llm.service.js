import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/index.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);


const responseSchema = {
  type: "OBJECT",
  properties: {
    disclaimer: { type: "STRING" },
    possibleConditions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          reasoning: { type: "STRING" },
        },
        required: ["name", "reasoning"],
      },
    },
    nextSteps: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: ["disclaimer", "possibleConditions", "nextSteps"],
};

export async function getStructuredLLMResponse(symptomText) {
  try {

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro', 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const prompt = `
    You are a helpful AI medical assistant for informational purposes only.
    Analyze the user's symptoms and provide a list of possible conditions and next steps.
    Adhere strictly to the provided JSON schema for your response.
    The disclaimer must be the standard medical warning.
    
    User Symptoms: "${symptomText}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);

  } catch (error) {
    console.error('Error communicating with Generative AI:', error);

    return { 
        error: "Failed to get a valid analysis from the AI model. The model may be temporarily unavailable or could not adhere to the required response structure." 
    };
  }
}