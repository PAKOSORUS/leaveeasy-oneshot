// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า + เช็กล็อกอิน
// แก้เมนูที่ไฟล์นี้ที่เดียว ทุกหน้าเปลี่ยนตามพร้อมกัน
//
// วิธีใช้: ทุกหน้ามี <div id="nav"></div> ไว้บนสุดของ body
// และโหลดไฟล์นี้ด้วย <script type="module" src="js/nav.js">
// ถ้ายังไม่ล็อกอิน จะพาไปหน้า login.html
// ─────────────────────────────────────────────────────────────

import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ผู้ใช้ปัจจุบันพร้อมบทบาท } from "./auth-role.js";

var ชื่อบทบาท = { employee: "ผู้ขอลา", manager: "ผู้อนุมัติ", hr: "ฝ่ายบุคคล" };

// ชื่อไฟล์ของหน้าที่กำลังเปิดอยู่ เอาไว้ขีดเส้นใต้เมนูที่ตรงกัน
var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";

function วาดแถบเมนู(role) {
  var เมนู = [
    { href: "index.html",             ชื่อ: "หน้าแรก" },
    { href: "leave-requests.html",    ชื่อ: "รายการใบลา" },
    { href: "new-leave-request.html", ชื่อ: "ยื่นใบลาใหม่" }
  ];
  // หน้าจัดการประเภทการลา แสดงเฉพาะฝ่ายบุคคล
  if (role === "hr") เมนู.push({ href: "leave-types.html", ชื่อ: "ประเภทการลา" });

  var html = '<div class="navbar"><span class="brand">🔧 LeaveEasy</span>';
  เมนู.forEach(function (m) {
    var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
    html += '<a href="' + m.href + '"' + active + ">" + m.ชื่อ + "</a>";
  });
  html += '<span class="nav-user" id="navUser"></span></div>';

  var ที่วาง = document.getElementById("nav");
  if (ที่วาง) ที่วาง.innerHTML = html;
}

function วาดผู้ใช้(ข้อมูล) {
  var ที่วาง = document.getElementById("navUser");
  if (!ที่วาง) return;
  ที่วาง.innerHTML =
    "<span>" + esc(ข้อมูล.name) + " (" + (ชื่อบทบาท[ข้อมูล.role] || "") + ")</span>" +
    '<button type="button" class="btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';
  document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", async function () {
    await signOut(auth);
    location.href = "login.html";
  });
}

(async function () {
  var ข้อมูล = await ผู้ใช้ปัจจุบันพร้อมบทบาท();
  if (!ข้อมูล.user) {
    location.href = "login.html";
    return;
  }
  วาดแถบเมนู(ข้อมูล.role);
  วาดผู้ใช้(ข้อมูล);
})();

// แถบเตือนสีเหลือง ใช้ตอนที่เชื่อมต่อฐานข้อมูลไม่สำเร็จ
window.showConfigWarning = function (ข้อความ) {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML = "⚠️ " + esc(ข้อความ || "เชื่อมต่อฐานข้อมูลไม่สำเร็จ");
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
};
