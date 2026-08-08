// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA3fQuNJfdSojKw1l6D0lQC0vTjOgIf9XM",
    authDomain: "belly-basket-4cfa6.firebaseapp.com",
    projectId: "belly-basket-4cfa6",
    storageBucket: "belly-basket-4cfa6.firebasestorage.app",
    messagingSenderId: "69325192675",
    appId: "1:69325192675:web:3b1b49fb0c6f421021b4d6",
    measurementId: "G-PJ0TDQ63Z3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
