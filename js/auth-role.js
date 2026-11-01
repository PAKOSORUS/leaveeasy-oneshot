// ─────────────────────────────────────────────────────────────
// js/auth-role.js — บอกว่าตอนนี้ใครล็อกอินอยู่ และมีบทบาทอะไร
// ใช้: const { user, role } = await ผู้ใช้ปัจจุบันพร้อมบทบาท();
//   user = ผู้ใช้จาก Firebase Auth (null ถ้ายังไม่ล็อกอิน)
//   role = "employee" | "manager" | "hr" (อ่านจากโฟลเดอร์ users)
//   name = ชื่อที่แสดงบนหน้าจอ (จาก users.name)
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let ผลที่จำไว้ = null;

export function ผู้ใช้ปัจจุบันพร้อมบทบาท() {
  if (ผลที่จำไว้) return ผลที่จำไว้;
  ผลที่จำไว้ = new Promise(function (ตกลง) {
    const เลิกฟัง = onAuthStateChanged(auth, async function (user) {
      เลิกฟัง();
      if (!user) {
        ตกลง({ user: null, role: null, name: "" });
        return;
      }
      let role = "employee";
      let name = user.email || "";
      try {
        const ไฟล์ = await getDoc(doc(db, "users", user.uid));
        if (ไฟล์.exists()) {
          const ข้อมูล = ไฟล์.data();
          if (["employee", "manager", "hr"].indexOf(ข้อมูล.role) >= 0) role = ข้อมูล.role;
          if (ข้อมูล.name) name = ข้อมูล.name;
        }
      } catch (e) {
        console.error("อ่านบทบาทผู้ใช้ไม่สำเร็จ", e);
      }
      ตกลง({ user: user, role: role, name: name });
    });
  });
  return ผลที่จำไว้;
}

// ผู้อนุมัติและฝ่ายบุคคล เห็นใบลาทุกใบ และเปลี่ยนสถานะได้
export function เป็นผู้พิจารณา(role) {
  return role === "manager" || role === "hr";
}
