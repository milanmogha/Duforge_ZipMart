// src/firebase-config.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Replace with your actual Firebase configuration
// Consider using environment variables for security: process.env.REACT_APP_API_KEY
const firebaseConfig = {
  apiKey: "AIzaSyC1BPZhS4fDwiFO25wrAcPxjKNJ-Vu-gRU",
  authDomain: "bellybasket-6242b.firebaseapp.com",
  projectId: "bellybasket-6242b",
  storageBucket: "bellybasket-6242b.firebasestorage.app",
  messagingSenderId: "867286701381",
  appId: "1:867286701381:web:4464d40b2b9b333815da2c",
  measurementId: "G-FHFSN5JXNC"
};

// Basic check for required config fields
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error(
    "Firebase config is missing required fields (apiKey, authDomain, projectId). Please check your configuration."
  );
}

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth = getAuth(app);

console.log("Firebase initialized and Auth service exported."); // Add log for confirmation