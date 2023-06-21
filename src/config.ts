// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDguTNA3aTreDQwB1BBWKzAIdwC7NSgmBs",
  authDomain: "infra-dao.firebaseapp.com",
  projectId: "infra-dao",
  storageBucket: "infra-dao.appspot.com",
  messagingSenderId: "206890326670",
  appId: "1:206890326670:web:709212d91ddd90e89a07df",
  measurementId: "G-8E2GKZHTM3",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
