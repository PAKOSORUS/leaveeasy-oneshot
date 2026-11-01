// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่างหัวข้อ 7 ลง Firestore
// ใช้ setDoc รหัสไฟล์คงที่ ข้อมูลอ่านจาก js/data.js (window.LEAVE_DATA)
// จึงตรงกับข้อมูลปลอมบนหน้าจอเสมอ · กดซ้ำได้ ไม่เกิดไฟล์ซ้ำ
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

var บันทึก = document.getElementById("บันทึก");
var ปุ่ม = document.getElementById("ปุ่มSeed");

function เขียนบันทึก(ข้อความ) {
  บันทึก.textContent += ข้อความ + "\n";
}

ปุ่ม.addEventListener("click", async function () {
  var ข้อมูล = window.LEAVE_DATA;
  ปุ่ม.disabled = true;
  บันทึก.textContent = "";
  try {
    for (var u of ข้อมูล.users) {
      await setDoc(doc(db, "users", u.id), { name: u.name, email: u.email, role: u.role });
      เขียนบันทึก("users/" + u.id);
    }
    for (var t of ข้อมูล.leaveTypes) {
      await setDoc(doc(db, "leaveTypes", t.id), { name: t.name });
      เขียนบันทึก("leaveTypes/" + t.id);
    }
    for (var r of ข้อมูล.leaveRequests) {
      await setDoc(doc(db, "leaveRequests", r.id), {
        title: r.title, reason: r.reason, status: r.status,
        requesterId: r.requesterId, requesterName: r.requesterName,
        approverId: r.approverId, approverName: r.approverName,
        leaveTypeId: r.leaveTypeId, leaveTypeName: r.leaveTypeName,
        startDate: r.startDate, endDate: r.endDate, createdAt: r.createdAt
      });
      เขียนบันทึก("leaveRequests/" + r.id);
    }
    for (var a of ข้อมูล.approvals) {
      await setDoc(doc(db, "leaveRequests", a.requestId, "approvals", a.id), {
        authorId: a.authorId, authorName: a.authorName,
        message: a.message, createdAt: a.createdAt
      });
      เขียนบันทึก("leaveRequests/" + a.requestId + "/approvals/" + a.id);
    }
    เขียนบันทึก("\nเสร็จแล้ว — เปิด Firebase Console เพื่อตรวจข้อมูลได้เลย");
  } catch (e) {
    console.error(e);
    เขียนบันทึก("\nผิดพลาด: " + (e && e.message ? e.message : e) + "\n(ถ้าเป็นเรื่องสิทธิ์ ให้ตรวจกฎ Firestore ที่ publish อยู่)");
  }
  ปุ่ม.disabled = false;
});
