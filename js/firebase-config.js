// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC9nlwMZGvQT4CE51q6uAakRS3kHM8cx40",
  authDomain: "agility-estoque.firebaseapp.com",
  projectId: "agility-estoque",
  storageBucket: "agility-estoque.firebasestorage.app",
  messagingSenderId: "103922053840",
  appId: "1:103922053840:web:b12c9d8cb3ae22cc6fe4d5",
  measurementId: "G-4XGGWEWNH4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);