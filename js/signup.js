// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สมัครสำเร็จแล้วสร้างไฟล์ใน users/<uid> { name, email, role: "employee" }
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่ม = document.getElementById("ปุ่มสมัคร");

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function แปลข้อผิดพลาด(e) {
  var รหัส = e && e.code;
  if (รหัส === "auth/email-already-in-use") return "อีเมลนี้ถูกใช้สมัครไปแล้ว";
  if (รหัส === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
  if (รหัส === "auth/weak-password") return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
  return "สมัครสมาชิกไม่สำเร็จ ลองใหม่อีกครั้ง";
}

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();
  var name = document.getElementById("name").value.trim();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;

  if (!name || !email || !password) {
    เตือน("กรอกให้ครบทุกช่องก่อนสมัคร");
    return;
  }
  if (password.length < 6) {
    เตือน("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }
  กล่องเตือน.classList.add("hidden");
  ปุ่ม.disabled = true;
  try {
    var ผล = await createUserWithEmailAndPassword(auth, email, password);
    // บทบาทเริ่มต้นเป็น employee เสมอ
    await setDoc(doc(db, "users", ผล.user.uid), { name: name, email: email, role: "employee" });
    location.href = "leave-requests.html";
  } catch (err) {
    console.error(err);
    เตือน(แปลข้อผิดพลาด(err));
    ปุ่ม.disabled = false;
  }
});
