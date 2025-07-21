// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIL_eMDwOzlnewUapJGqA8qIL4cqg64Nw",
  authDomain: "debatetogether.firebaseapp.com",
  projectId: "debatetogether",
  storageBucket: "debatetogether.firebasestorage.app",
  messagingSenderId: "543370299424",
  appId: "1:543370299424:web:3dc2b601de93a65c515445",
  measurementId: "G-PJRYMWERJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analyticsPromise = analyticsSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);






