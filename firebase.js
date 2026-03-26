// src/firebase.js
// ⚠️  REMPLACEZ les valeurs ci-dessous par celles de votre projet Firebase
// (voir le guide LISEZMOI.md pour les instructions)

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD_dMhdvCHgZq56NtgvH-5-Xg42vJF0NY4",
  authDomain: "maison-normandie-f0f3b.firebaseapp.com",
  databaseURL: "https://maison-normandie-f0f3b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "maison-normandie-f0f3b",
  storageBucket: "maison-normandie-f0f3b.firebasestorage.app",
  messagingSenderId: "670607212042",
  appId: "1:670607212042:web:b5b4293135e96b842da9f3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
