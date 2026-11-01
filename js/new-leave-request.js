// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่ (บันทึกลง Firestore จริง)
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ผู้ใช้ปัจจุบันพร้อมบทบาท } from "./auth-role.js";
import { จัดประเภทการลาด้วยAI, สร้างคำเตือนข้อมูลส่วนบุคคล } from "./ai.js";

var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
var ช่องประเภท = document.getElementById("leaveTypeId");
var กล่องเตือน = document.getElementById("ข้อความเตือน");
var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
var ประเภททั้งหมด = [];

// เติมรายการเลื่อนลงด้วยประเภทการลาจากโฟลเดอร์ leaveTypes
(async function () {
  try {
    var ผล = await getDocs(collection(db, "leaveTypes"));
    ผล.forEach(function (d) { ประเภททั้งหมด.push({ id: d.id, name: d.data().name }); });
    ประเภททั้งหมด.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    ประเภททั้งหมด.forEach(function (ประเภท) {
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = ประเภท.id;
      ตัวเลือก.textContent = ประเภท.name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });
  } catch (e) {
    console.error(e);
    เตือน("โหลดประเภทการลาไม่สำเร็จ");
  }
})();

ฟอร์ม.addEventListener("submit", async function (e) {
  e.preventDefault();

  var ค่า = {
    title: document.getElementById("title").value.trim(),
    reason: document.getElementById("reason").value.trim(),
    leaveTypeId: ช่องประเภท.value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value
  };

  // ตรวจว่ากรอกครบก่อนบันทึก
  if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
    เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
    return;
  }
  if (ค่า.endDate < ค่า.startDate) {
    เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
    return;
  }

  var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });
  if (!ประเภท) {
    เตือน("ไม่พบประเภทการลาที่เลือก");
    return;
  }

  var ผู้ใช้ = await ผู้ใช้ปัจจุบันพร้อมบทบาท();
  if (!ผู้ใช้.user) {
    location.href = "login.html";
    return;
  }

  กล่องเตือน.classList.add("hidden");
  ปุ่มบันทึก.disabled = true;
  try {
    // เขียนชื่อคู่กับรหัสเสมอ · ใบใหม่เริ่มที่ รอพิจารณา เสมอ
    await addDoc(collection(db, "leaveRequests"), {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",
      requesterId: ผู้ใช้.user.uid, requesterName: ผู้ใช้.name,
      approverId: "",               approverName: "",
      leaveTypeId: ประเภท.id,        leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    });
    location.href = "leave-requests.html";
  } catch (err) {
    console.error(err);
    เตือน("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    ปุ่มบันทึก.disabled = false;
  }
});

// ── US-09: ปุ่มให้ AI ช่วยจัดประเภทการลา (ส่วน AI เท่านั้น ไม่แตะ Firestore) ──
var ปุ่มAI = document.getElementById("ปุ่มจัดประเภทAI");
var ป้ายAI = document.getElementById("ป้ายAI");
var เตือนAI = document.getElementById("เตือนAI");
var กำลังเรียกAI = false;

if (ปุ่มAI) {
  // คำเตือนห้ามใส่ข้อมูลส่วนบุคคลจริงในเหตุผลการลา
  var กล่องปุ่มAI = document.getElementById("กล่องจัดประเภทAI");
  กล่องปุ่มAI.parentNode.insertBefore(สร้างคำเตือนข้อมูลส่วนบุคคล(), กล่องปุ่มAI);

  // ผู้ใช้แก้ประเภทเองเมื่อไร ป้ายข้อเสนอ AI ก็ซ่อน (ค่านั้นไม่ใช่ข้อเสนอของ AI แล้ว)
  ช่องประเภท.addEventListener("change", function () { ป้ายAI.classList.add("hidden"); });

  ปุ่มAI.addEventListener("click", async function () {
    if (กำลังเรียกAI) return;   // กดซ้ำไม่ได้
    เตือนAI.classList.add("hidden");
    ป้ายAI.classList.add("hidden");

    var เหตุผล = document.getElementById("reason").value.trim();
    if (!เหตุผล) {
      เตือนAI.textContent = "⚠️ พิมพ์เหตุผลการลาก่อน AI จึงจะช่วยจัดประเภทได้";
      เตือนAI.classList.remove("hidden");
      return;
    }
    if (ประเภททั้งหมด.length === 0) {
      เตือนAI.textContent = "⚠️ ยังไม่มีรายการประเภทการลาให้ AI เลือก";
      เตือนAI.classList.remove("hidden");
      return;
    }

    กำลังเรียกAI = true;
    ปุ่มAI.disabled = true;
    var ข้อความเดิม = ปุ่มAI.textContent;
    ปุ่มAI.textContent = "กำลังทำงาน…";
    try {
      var รหัส = await จัดประเภทการลาด้วยAI(เหตุผล, ประเภททั้งหมด);
      if (รหัส) {
        ช่องประเภท.value = รหัส;
        ป้ายAI.classList.remove("hidden");
      } else {
        // ไม่ตรงประเภทที่มี → ไม่เปลี่ยนค่าเดิม
        เตือนAI.textContent = "⚠️ AI จัดประเภทให้ไม่ได้ — ค่าเดิมไม่เปลี่ยน กรุณาเลือกประเภทเอง";
        เตือนAI.classList.remove("hidden");
      }
    } catch (err) {
      console.error("เรียก AI ไม่สำเร็จ:", err && err.message);
      เตือนAI.textContent = "⚠️ จัดประเภทด้วย AI ไม่สำเร็จ (" + (err && err.message ? err.message : "ไม่ทราบสาเหตุ") +
                            ") — เลือกประเภทเองแล้วกดบันทึกได้ตามปกติ";
      เตือนAI.classList.remove("hidden");
    } finally {
      กำลังเรียกAI = false;
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความเดิม;
    }
  });
}

function เตือน(ข้อความ) {
  กล่องเตือน.textContent = "⚠️ " + ข้อความ;
  กล่องเตือน.classList.remove("hidden");
}
