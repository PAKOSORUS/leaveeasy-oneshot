// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ผู้ใช้ปัจจุบันพร้อมบทบาท } from "./auth-role.js";

var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");

// ล็อกอินอยู่แล้ว ไม่ต้องกรอกอีก
ผู้ใช้ปัจจุบันพร้อมบทบาท().then(function (ข้อมูล) {
  if (ข้อมูล.user) location.href = "leave-requests.html";
});

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}

function แปลข้อผิดพลาด(e) {
  var รหัส = e && e.code;
  if (รหัส === "auth/invalid-credential" || รหัส === "auth/wrong-password" || รหัส === "auth/user-not-found")
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (รหัส === "auth/invalid-email") return "รูปแบบอีเมลไม่ถูกต้อง";
  if (รหัส === "auth/too-many-requests") return "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
  return "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง";
}

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;
  if (!email || !password) {
    เตือน("กรอกอีเมลและรหัสผ่านให้ครบก่อน");
    return;
  }
  กล่องเตือน.classList.add("hidden");
  ปุ่ม.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "leave-requests.html";
  } catch (err) {
    console.error(err);
    เตือน(แปลข้อผิดพลาด(err));
    ปุ่ม.disabled = false;
  }
});
