// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCZJEJlevQr475TjkU5SjbSYk_S5bSkaiU",
  authDomain: "earnapp-f8d27.firebaseapp.com",
  projectId: "earnapp-f8d27",
  storageBucket: "earnapp-f8d27.firebasestorage.app",
  messagingSenderId: "151886381795",
  appId: "1:151886381795:web:d76b5280b7c8cd30767bd6",
  measurementId: "G-JL234NHV11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
