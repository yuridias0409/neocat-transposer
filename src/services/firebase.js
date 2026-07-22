import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaA4bhPlXwpmc5sNxDmzQ93UyYoMPgVx0",
  authDomain: "neocat-transponder.firebaseapp.com",
  projectId: "neocat-transponder",
  storageBucket: "neocat-transponder.firebasestorage.app",
  messagingSenderId: "470270771039",
  appId: "1:470270771039:web:2b863fcf15532f8191c0ea"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
