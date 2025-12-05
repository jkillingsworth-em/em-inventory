// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD8adlfz_gkroKlbYOnkbiqUrtVwblQLY",
  authDomain: "digitgit-93d87.firebaseapp.com",
  projectId: "digitgit-93d87",
  storageBucket: "digitgit-93d87.firebasestorage.app",
  messagingSenderId: "110628533146",
  appId: "1:110628533146:web:1ebbebec50567423340023",
  measurementId: "G-MEQ7HH5BRE"
};

// Initialize Firebase safely, preventing re-initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Get a Firestore instance
const db = getFirestore(app);

export { db };
