// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าการเชื่อมต่อ Firebase/Firestore
// โหลดเป็น ES module (<script type="module">) เท่านั้น
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUNQ2ASk6wKoZFuOUztBclHlGXVZryzBg",
  authDomain: "leaveeasy-phakhin-nantakarn.firebaseapp.com",
  projectId: "leaveeasy-phakhin-nantakarn",
  storageBucket: "leaveeasy-phakhin-nantakarn.firebasestorage.app",
  messagingSenderId: "902298909435",
  appId: "1:902298909435:web:8666baba2db25dda60ce5e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
