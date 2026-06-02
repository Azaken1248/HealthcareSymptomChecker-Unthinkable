
# Backend API Documentation

The backend API is responsible for handling symptom analysis requests, managing user query history, and communicating with the Google Generative AI model.

**Base URL**: `https://healthapi.azaken.com/`

---

## Authentication

All API endpoints are protected and require authentication using a **Firebase ID Token**. The client application signs in a user anonymously using the Firebase SDK and then retrieves an ID token. This token must be included in the `Authorization` header of every request as a Bearer token.

* **Header Format**: `Authorization: Bearer <FIREBASE_ID_TOKEN>`
* **Mechanism**: The server uses the Firebase Admin SDK to verify the integrity and authenticity of the ID token on every protected request.

---

## Rate Limiting

The API has a rate limiter to prevent abuse. The current limit is **100 requests per 15 minutes** from a single IP address. If you exceed this limit, you will receive a `429 Too Many Requests` error response.

---

## Endpoints

### 1. Symptom Analysis

* **Endpoint**: `POST /api/check-symptoms`
* **Description**: Analyzes a string of symptoms and returns a differential diagnosis.

#### cURL Command:

```bash
curl -X POST https://healthapi.azaken.com//api/check-symptoms -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" -d '{
  "symptoms": "I have a high fever, persistent cough, and a severe headache that has lasted for two days."
}'
```

**Request Body:**
- `symptoms` *(string, required)*: A text description of the user's symptoms. Must be between 10 and 750 characters.

**Sample Response (200 OK):**
```json
{
  "summary": "The combination of high fever, persistent cough, and severe headache suggests a possible respiratory infection.",
  "disclaimer": "This is not a medical diagnosis. This information is for educational purposes only. Please consult with a healthcare professional for any health concerns.",
  "possibleConditions": [
    {
      "name": "Influenza (Flu)",
      "reasoning": "The classic symptoms of high fever, cough, and headache are hallmark signs of influenza.",
      "confidence": "High"
    },
    {
      "name": "COVID-19",
      "reasoning": "Fever, cough, and headache are common symptoms of COVID-19. It's important to consider this possibility, especially during a pandemic.",
      "confidence": "Medium"
    }
  ],
  "differentiatingSymptoms": [
    {
      "condition": "Influenza (Flu)",
      "symptomsToCheck": ["body aches", "fatigue", "sore throat"]
    },
    {
      "condition": "COVID-19",
      "symptomsToCheck": ["loss of taste or smell", "shortness of breath", "fatigue"]
    }
  ],
  "nextSteps": [
    "Rest and drink plenty of fluids.",
    "Consider taking over-the-counter pain relievers to manage fever and headache.",
    "If your symptoms worsen or you have difficulty breathing, seek medical attention immediately."
  ],
  "criticalWarning": "A symptom you mentioned can be associated with serious medical conditions. Please prioritize consulting a healthcare professional immediately to rule out any emergencies."
}
```

---

### 2. Query History

* **Endpoint**: `GET /api/history`
* **Description**: Retrieves the authenticated user's past symptom analysis queries, ordered by the most recent first.

#### cURL Command:

```bash
curl -X GET https://healthapi.azaken.com//api/history -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>"
```

**Sample Response (200 OK):**
```json
[
  {
    "id": "someUniqueId123",
    "symptoms": "I have a high fever, persistent cough, and a severe headache.",
    "response": {
      "summary": "The combination of symptoms suggests a possible respiratory infection.",
      "disclaimer": "This is not a medical diagnosis...",
      "possibleConditions": [
        {
          "name": "Influenza (Flu)",
          "reasoning": "Classic symptoms...",
          "confidence": "High"
        }
      ],
      "differentiatingSymptoms": [],
      "nextSteps": ["Rest and drink plenty of fluids..."]
    },
    "timestamp": {
      "_seconds": 1678886400,
      "_nanoseconds": 0
    }
  }
]
```
