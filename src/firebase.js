import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCLNuXgq9RShPvY1PbfuEuk98wpe-9rjiU",
  authDomain: "door-renaissance.firebaseapp.com",
  projectId: "door-renaissance",
  storageBucket: "door-renaissance.firebasestorage.app",
  messagingSenderId: "759319465329",
  appId: "1:759319465329:web:606710c19e328dfb1ffad0",
  measurementId: "G-H04N6BKS8W",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const authReady = new Promise((resolve) => {
  const stop = onAuthStateChanged(auth, () => {
    stop();
    resolve(true);
  });
});

if (import.meta.env.DEV && typeof window !== "undefined") {
  window._signIn = async (email, pass) => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    console.log("[_signIn OK]", res.user.uid, res.user.email);
    return res.user;
  };
}
