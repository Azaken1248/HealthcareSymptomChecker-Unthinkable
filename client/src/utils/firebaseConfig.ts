import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID,
};



const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const getAuthToken = async () => {
  await auth.authStateReady();
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  console.warn("User is not authenticated yet.");
  return null;
};

signInAnonymously(auth).catch((error: any) => {
  console.error("Anonymous sign-in failed:", error);
});