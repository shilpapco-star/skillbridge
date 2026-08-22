import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZQ4Z_92YwYADH6Y5kM3ZZ-BNLwh-7q_U",
  authDomain: "skillbridge-37f62.firebaseapp.com",
  projectId: "skillbridge-37f62",
  storageBucket: "skillbridge-37f62.firebasestorage.app",
  messagingSenderId: "772858048347",
  appId: "1:772858048347:web:a22aaf7e648b770713f47e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);