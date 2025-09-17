import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDn5hD_wl60Up-fsKWTuthoPgpMOVkNN3w",
  authDomain: "neowallet-238ac.firebaseapp.com",
  projectId: "neowallet-238ac",
  storageBucket: "neowallet-238ac.firebasestorage.app",
  messagingSenderId: "539369422505",
  appId: "1:539369422505:web:66d6c09637692041aa33b8",
  measurementId: "G-3K69V6CL75"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);