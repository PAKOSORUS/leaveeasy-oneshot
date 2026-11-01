// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา (Firestore จริง)
// เพิ่ม แก้ ลบ ได้เฉพาะฝ่ายบุคคล (hr)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ผู้ใช้ปัจจุบันพร้อมบทบาท } from "./auth-role.js";

var รายการ = [];
var ที่วางตาราง = document.getElementById("ตารางประเภท");
var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
var กล่องเตือน = document.getElementById("เตือนประเภท");

(async function () {
  var ผู้ใช้ = await ผู้ใช้ปัจจุบันพร้อมบทบาท();
  if (!ผู้ใช้.user) return;   // nav.js พาไปหน้าล็อกอินให้แล้ว

  if (ผู้ใช้.role !== "hr") {
    document.querySelector(".container").innerHTML =
      '<h1>จัดการประเภทการลา</h1><div class="alert alert-warn">หน้านี้สำหรับฝ่ายบุคคลเท่านั้น</div>' +
      '<div class="btn-row"><a class="btn btn-ghost" href="index.html">← กลับหน้าแรก</a></div>';
    return;
  }

  document.getElementById("ปุ่มเพิ่ม").addEventListener("click", เพิ่มประเภท);
  await โหลดและวาด();
})();

async function โหลดและวาด() {
  try {
    var ผล = await getDocs(collection(db, "leaveTypes"));
    รายการ = [];
    ผล.forEach(function (d) { รายการ.push({ id: d.id, name: d.data().name }); });
    รายการ.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
  } catch (e) {
    console.error(e);
    ที่วางตาราง.innerHTML = "<p>โหลดประเภทการลาไม่สำเร็จ</p>";
    return;
  }
  วาดตาราง();
}

function วาดตาราง() {
  if (รายการ.length === 0) {
    ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
    return;
  }

  var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
  รายการ.forEach(function (ประเภท) {
    html +=
      "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
      '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
      '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
      "</td></tr>";
  });
  html += "</tbody></table>";
  ที่วางตาราง.innerHTML = html;

  ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
    ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
  });
  ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
    ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
  });
}

async function เพิ่มประเภท() {
  var ชื่อ = ช่องชื่อใหม่.value.trim();
  if (!ชื่อ) {
    กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
    กล่องเตือน.classList.remove("hidden");
    return;
  }
  กล่องเตือน.classList.add("hidden");
  try {
    await addDoc(collection(db, "leaveTypes"), { name: ชื่อ });
    ช่องชื่อใหม่.value = "";
    await โหลดและวาด();
  } catch (e) {
    console.error(e);
    alert("เพิ่มประเภทการลาไม่สำเร็จ");
  }
}

async function แก้ประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
  if (ชื่อใหม่ === null) return;              // กดยกเลิก
  if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }
  try {
    await updateDoc(doc(db, "leaveTypes", id), { name: ชื่อใหม่.trim() });
    await โหลดและวาด();
  } catch (e) {
    console.error(e);
    alert("แก้ไขไม่สำเร็จ");
  }
}

async function ลบประเภท(id) {
  var ประเภท = รายการ.find(function (t) { return t.id === id; });
  if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;
  try {
    await deleteDoc(doc(db, "leaveTypes", id));
    await โหลดและวาด();
  } catch (e) {
    console.error(e);
    alert("ลบไม่สำเร็จ");
  }
}
