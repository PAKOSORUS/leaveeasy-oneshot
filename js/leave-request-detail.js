// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา (Firestore จริง)
// อนุมัติ/ไม่อนุมัติ (แก้เฉพาะ status) · ความเห็นใน approvals · ลบใบที่รอพิจารณา
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ผู้ใช้ปัจจุบันพร้อมบทบาท, เป็นผู้พิจารณา } from "./auth-role.js";
import { สรุปใบลาด้วยAI } from "./ai.js";

var รหัสใบลา = ค่าจากURL("id");
var กล่องใบลา = document.getElementById("กล่องใบลา");
var กล่องความเห็น = document.getElementById("กล่องความเห็น");
var กล่องลบ = document.getElementById("กล่องลบใบลา");

var ผู้ใช้ = null;
var ใบ = null;
var ความเห็น = [];

(async function () {
  ผู้ใช้ = await ผู้ใช้ปัจจุบันพร้อมบทบาท();
  if (!ผู้ใช้.user) return;   // nav.js พาไปหน้าล็อกอินให้แล้ว

  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — ลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  try {
    var ไฟล์ = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (!ไฟล์.exists()) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = ไฟล์.data();
    ใบ.id = ไฟล์.id;
    await โหลดความเห็น();
  } catch (e) {
    console.error(e);
    กล่องใบลา.innerHTML = "<p>เปิดใบลานี้ไม่ได้ — คุณอาจไม่มีสิทธิ์ดูใบลาของผู้อื่น</p>";
    return;
  }

  วาดใบลา();
  วาดความเห็น();
  try { เตรียมปุ่มสรุปAI(); } catch (e) { console.error(e); }   // ล้มเหลวต้องไม่ขัดส่วนอื่น
  กล่องความเห็น.classList.remove("hidden");
  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
  document.getElementById("ปุ่มลบใบลา").addEventListener("click", ลบใบลา);
})();

async function โหลดความเห็น() {
  var ผล = await getDocs(query(collection(db, "leaveRequests", รหัสใบลา, "approvals"), orderBy("createdAt", "asc")));
  ความเห็น = [];
  ผล.forEach(function (d) {
    var ข้อมูล = d.data();
    ข้อมูล.id = d.id;
    ความเห็น.push(ข้อมูล);
  });
}

// ── วาดข้อมูลใบลาลงหน้าจอ ──
function วาดใบลา() {
  var แถว = [
    ["หัวข้อ", esc(ใบ.title)],
    ["เหตุผลการลา", esc(ใบ.reason)],
    ["ประเภทการลา", esc(ใบ.leaveTypeName)],
    ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
    ["ผู้ขอลา", esc(ใบ.requesterName)],
    ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
    ["สถานะ", ป้ายสถานะ(ใบ.status)],
    ["วันที่ยื่น", esc(ใบ.createdAt)]
  ];

  var html = แถว.map(function (r) {
    return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
  }).join("");

  var รอพิจารณา = ใบ.status === "รอพิจารณา";
  var พิจารณาได้ = เป็นผู้พิจารณา(ผู้ใช้.role);

  if (รอพิจารณา && พิจารณาได้) {
    html +=
      '<div class="btn-row">' +
      '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
      '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
      "</div>";
  } else if (!รอพิจารณา) {
    html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
  } else {
    html += '<p class="hint">ใบนี้รอผู้อนุมัติพิจารณา</p>';
  }

  กล่องใบลา.innerHTML = html;

  if (รอพิจารณา && พิจารณาได้) {
    document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
  }

  // ปุ่มลบ: เฉพาะเจ้าของใบ และเฉพาะใบที่ยังรอพิจารณา
  if (ใบ.requesterId === ผู้ใช้.user.uid && รอพิจารณา) กล่องลบ.classList.remove("hidden");
  else กล่องลบ.classList.add("hidden");
}

// ── สรุปใบลาโดย AI (เฉพาะ manager/hr · แยกจากการอนุมัติโดยสิ้นเชิง ล้มเหลวแล้วไม่กระทบ) ──
function เตรียมปุ่มสรุปAI() {
  var กล่อง = document.getElementById("กล่องสรุปAI");
  var ปุ่ม = document.getElementById("ปุ่มสรุปAI");
  if (!กล่อง || !ปุ่ม || !เป็นผู้พิจารณา(ผู้ใช้.role)) return;   // พนักงานไม่เห็นกล่องนี้
  กล่อง.classList.remove("hidden");

  var ป้าย = document.getElementById("ป้ายสรุปAI");
  var เตือนสรุป = document.getElementById("เตือนสรุปAI");
  var ผลสรุป = document.getElementById("ผลสรุปAI");
  var กำลังเรียก = false;

  ปุ่ม.addEventListener("click", async function () {
    if (กำลังเรียก) return;
    กำลังเรียก = true;
    ปุ่ม.disabled = true;
    var ข้อความเดิม = ปุ่ม.textContent;
    ปุ่ม.textContent = "กำลังทำงาน…";
    เตือนสรุป.classList.add("hidden");
    ป้าย.classList.add("hidden");
    try {
      var สรุป = await สรุปใบลาด้วยAI(ใบ, ความเห็น);
      ผลสรุป.textContent = สรุป.trim();   // textContent ปลอดภัยจากโค้ดแปลกปลอม
      ป้าย.classList.remove("hidden");
    } catch (e) {
      console.error("สรุปด้วย AI ไม่สำเร็จ:", e && e.message);
      เตือนสรุป.textContent = "⚠️ สรุปด้วย AI ไม่สำเร็จ (" + (e && e.message ? e.message : "ไม่ทราบสาเหตุ") +
                              ") — ยังอนุมัติหรือไม่อนุมัติได้ตามปกติ";
      เตือนสรุป.classList.remove("hidden");
    } finally {
      กำลังเรียก = false;
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = ข้อความเดิม;
    }
  });
}

// ── เปลี่ยนสถานะ (updateDoc แก้เฉพาะช่อง status) ──
async function เปลี่ยนสถานะ(สถานะใหม่) {
  if (ใบ.status !== "รอพิจารณา") return;   // อนุมัติ/ไม่อนุมัติ เป็นสถานะปลายทาง

  // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน (ตรวจจากข้อมูลล่าสุดในฐานข้อมูล)
  if (สถานะใหม่ === "ไม่อนุมัติ") {
    try { await โหลดความเห็น(); } catch (e) { console.error(e); }
    if (ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }
  }

  document.querySelectorAll("#ปุ่มอนุมัติ, #ปุ่มไม่อนุมัติ").forEach(function (p) { p.disabled = true; });
  try {
    await updateDoc(doc(db, "leaveRequests", ใบ.id), { status: สถานะใหม่ });
    ใบ.status = สถานะใหม่;
  } catch (e) {
    console.error(e);
    alert("เปลี่ยนสถานะไม่สำเร็จ — ใบนี้อาจถูกพิจารณาไปแล้ว หรือคุณไม่มีสิทธิ์");
  }
  วาดใบลา();
}

// ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
function วาดความเห็น() {
  var ที่วาง = document.getElementById("รายการความเห็น");
  if (ความเห็น.length === 0) {
    ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
    return;
  }
  ที่วาง.innerHTML = ความเห็น
    .slice()
    .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
    .map(function (c) {
      return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
             "</div><div>" + esc(c.message) + "</div></div>";
    }).join("");
}

// ── ส่งความเห็นใหม่ (เก็บในโฟลเดอร์ย่อย approvals ของใบนี้) ──
async function ส่งความเห็น() {
  var ช่อง = document.getElementById("ข้อความความเห็น");
  var เตือน = document.getElementById("เตือนความเห็น");
  var ปุ่ม = document.getElementById("ปุ่มส่งความเห็น");
  var ข้อความ = ช่อง.value.trim();

  if (!ข้อความ) {
    เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
    เตือน.classList.remove("hidden");
    return;
  }
  เตือน.classList.add("hidden");
  ปุ่ม.disabled = true;
  try {
    await addDoc(collection(db, "leaveRequests", ใบ.id, "approvals"), {
      authorId: ผู้ใช้.user.uid,
      authorName: ผู้ใช้.name,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    });
    ช่อง.value = "";
    await โหลดความเห็น();
    วาดความเห็น();
  } catch (e) {
    console.error(e);
    เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ ลองใหม่อีกครั้ง";
    เตือน.classList.remove("hidden");
  }
  ปุ่ม.disabled = false;
}

// ── ลบใบลา (เฉพาะรอพิจารณา + ถามยืนยันก่อน) ──
async function ลบใบลา() {
  if (ใบ.status !== "รอพิจารณา") return;
  if (!confirm("ยืนยันการลบใบลานี้หรือไม่ เมื่อลบแล้วกู้คืนไม่ได้")) return;
  try {
    await deleteDoc(doc(db, "leaveRequests", ใบ.id));
    location.href = "leave-requests.html";
  } catch (e) {
    console.error(e);
    alert("ลบไม่สำเร็จ — ลบได้เฉพาะใบของตัวเองที่ยังรอพิจารณา");
  }
}
