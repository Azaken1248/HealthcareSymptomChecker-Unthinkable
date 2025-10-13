# AI Symptom Checker

An AI-powered symptom checker that provides a differential diagnosis based on user-inputted symptoms. It suggests possible conditions, recommends next steps, and provides a disclaimer for educational purposes only.

### [Demo Video](https://www.dropbox.com/scl/fi/da81ekich6kl88m5halt5/HealthCareApp-Unthinkable-Rohit-Sinha-22BCE5007.mp4?rlkey=0bkg0trloljjalxea6bwblxux&st=xj9zpyg5&dl=0) | [Live Site](https://health.azaken.com/) | [API Documentation](./DOCUMENTATION.md)

<img width="1266" height="703" alt="{699DEF4A-572A-4926-BA23-B87E63764BF1}" src="https://github.com/user-attachments/assets/ee657b1b-2f84-45ce-99b9-b58dfa72fd7a" />

---

## Objective

The primary objective of this application is to take a user's symptoms as input and provide a list of probable medical conditions, along with recommended next steps. It is important to note that this tool is for educational purposes only and is not a substitute for professional medical advice.

## Features

* **Symptom Analysis**: Users can enter their symptoms into a text box for analysis by an AI model.
* **AI-Powered Diagnosis**: Utilizes Google's Gemini Pro model to provide a differential diagnosis based on the provided symptoms.
* **Probable Conditions**: Displays a list of possible conditions with confidence levels (High, Medium, Low) and reasoning for each suggestion.
* **Differentiating Symptoms**: Suggests additional symptoms to check for each condition to help refine the diagnosis and analysis.
* **Recommended Next Steps**: Provides a list of actionable and safe next steps for the user.
* **Critical Warning System**: Automatically flags potentially serious symptoms based on a predefined list of keywords and advises immediate medical attention.
* **Query History**: Authenticated users can view a history of their past symptom checks, sorted by the most recent.
* **Downloadable Reports**: Users have the ability to download individual symptom reports or a cumulative history of all their reports in PDF format.

## Tech Stack

### Frontend

* **React**: A JavaScript library for building user interfaces.
* **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
* **Vite**: A modern frontend build tool for an enhanced development experience.
* **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
* **Axios**: A promise-based HTTP client for making requests to the backend API.
* **Firebase Authentication**: Used for anonymous user sign-in to securely manage user-specific data like query history.
* **jsPDF**: A client-side JavaScript library to generate PDF documents.

### Backend

* **Node.js**: A JavaScript runtime environment for executing server-side code.
* **Express.js**: A minimalist web framework for building the backend API.
* **Google Generative AI (Gemini)**: The large language model used for the core reasoning and suggestion generation engine.
* **Firebase Admin & Firestore**: Used for server-side user authentication and for storing user query history in a NoSQL database.

## Directory Structure
```
HEALTHCARE SYMPTOM CHECKER (UNTHINKABLE)
 ┣ client
 ┃  ┣ public
 ┃  ┃  ┗ icon.svg
 ┃  ┣ src
 ┃  ┃  ┣ assets
 ┃  ┃  ┃  ┗ react.svg
 ┃  ┃  ┣ components
 ┃  ┃  ┃  ┣ AnalysisResult.tsx
 ┃  ┃  ┃  ┣ ChatWindow.tsx
 ┃  ┃  ┃  ┣ ConfidenceBadge.tsx
 ┃  ┃  ┃  ┣ ErrorAlert.tsx
 ┃  ┃  ┃  ┣ Header.tsx
 ┃  ┃  ┃  ┣ HistoryList.tsx
 ┃  ┃  ┃  ┣ Spinner.tsx
 ┃  ┃  ┃  ┗ SymptomForm.tsx
 ┃  ┃  ┣ utils
 ┃  ┃  ┃  ┣ firebaseConfig.ts
 ┃  ┃  ┃  ┗ pdf.ts
 ┃  ┃  ┣ App.css
 ┃  ┃  ┣ App.tsx
 ┃  ┃  ┣ index.css
 ┃  ┃  ┣ main.tsx
 ┃  ┃  ┗ types.ts
 ┃  ┣ .env.local
 ┃  ┣ .gitignore
 ┃  ┣ eslint.config.js
 ┃  ┣ index.html
 ┃  ┣ package-lock.json
 ┃  ┣ package.json
 ┃  ┣ README.md
 ┃  ┣ tsconfig.app.json
 ┃  ┣ tsconfig.json
 ┃  ┣ tsconfig.node.json
 ┃  ┗ vite.config.ts
 ┣ server
 ┃  ┣ src
 ┃  ┃  ┣ api
 ┃  ┃  ┃  ┣ controllers
 ┃  ┃  ┃  ┃  ┗ symptom.controller.js
 ┃  ┃  ┃  ┣ routes
 ┃  ┃  ┃  ┃  ┗ symptom.routes.js
 ┃  ┃  ┃  ┗ services
 ┃  ┃  ┃     ┗ llm.service.js
 ┃  ┃  ┣ config
 ┃  ┃  ┃  ┣ emergencyKeywords.js
 ┃  ┃  ┃  ┣ firebaseAdmin.js
 ┃  ┃  ┃  ┗ index.js
 ┃  ┃  ┣ middleware
 ┃  ┃  ┃  ┣ authMiddleware.js
 ┃  ┃  ┃  ┗ rateLimiter.js
 ┃  ┃  ┣ .env
 ┃  ┃  ┣ app.js
 ┃  ┃  ┗ server.js
 ┃  ┣ .gitignore
 ┃  ┣ package-lock.json
 ┃  ┣ package.json
 ┃  ┗ serviceAccountKey.json
 ┗ Healthcare Symptom Checker_ 11.pdf
```
