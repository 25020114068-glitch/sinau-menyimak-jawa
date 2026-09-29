import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { 
  getAuth 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { 
  getFirestore 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdUWhHqsButROWOeHMEQFivAUujv1g95s",
  authDomain: "sinau-menyimak-jawa.firebaseapp.com",
  projectId: "sinau-menyimak-jawa",
  storageBucket: "sinau-menyimak-jawa.firebasestorage.app",
  messagingSenderId: "876399478313",
  appId: "1:876399478313:web:af5f3dfad9b870f496fe38"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseConfigData = firebaseConfig;