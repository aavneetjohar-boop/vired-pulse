import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCloEk4A8Yq5TwGZQNsrB7Y0Hc-DCUUFPs",
  authDomain: "vired-pulse.firebaseapp.com",
  projectId: "vired-pulse",
  storageBucket: "vired-pulse.firebasestorage.app",
  messagingSenderId: "139422394890",
  appId: "1:139422394890:web:5a41ec6bd2f3da51e88df3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);