import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCiHAgYPEjc9khbP0IhEOB1Qfqjojxsds",
  authDomain: "voltflow-b7b87.firebaseapp.com",
  projectId: "voltflow-b7b87",
  storageBucket: "voltflow-b7b87.firebasestorage.app",
  messagingSenderId: "36853299178",
  appId: "1:36853299178:web:806c3d8cf08a6feb286493"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
