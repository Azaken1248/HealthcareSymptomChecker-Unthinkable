import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/index.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);


const responseSchema = {
  type: "OBJECT",
  properties: {
    summary: { 
        type: "STRING",
        description: "A single, concise sentence summarizing the most likely scenario based on the symptoms."
    },
    disclaimer: { type: "STRING" },
    possibleConditions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          reasoning: { type: "STRING" },
          confidence: { 
            type: "STRING",
            description: "The estimated confidence level. Must be one of: 'High', 'Medium', or 'Low'."
          },
        },
        required: ["name", "reasoning", "confidence"],
      },
    },
    differentiatingSymptoms: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          condition: { type: "STRING" },
          symptomsToCheck: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
        required: ["condition", "symptomsToCheck"],
      },
    },
    nextSteps: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
  },
  required: ["summary", "disclaimer", "possibleConditions", "differentiatingSymptoms", "nextSteps"],
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
    You are an advanced AI medical assistant for informational purposes. Your goal is to perform a differential diagnosis.

    1.  Analyze the user's symptoms and provide a concise, one-sentence summary of the most likely situation.
    2.  Identify 2-3 of the most likely possible conditions.
    3.  For each condition, provide a brief reasoning.
    4.  **CRITICAL:** For each condition, you MUST assign a confidence level ('High', 'Medium', or 'Low') based on how well the user's symptoms match the typical presentation of the condition.
    5.  **CRITICAL:** For each condition, provide a list of short, descriptive 'symptomsToCheck' phrases (e.g., "sensitivity to light"). **DO NOT phrase them as questions.**
    6.  Provide safe, actionable next steps.
    7.  Adhere strictly to the provided JSON schema for your entire response.
    
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