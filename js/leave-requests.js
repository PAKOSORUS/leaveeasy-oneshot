// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา (อ่านจาก Firestore จริง)
// ผู้ขอลาเห็นเฉพาะใบของตัวเอง · ผู้อนุมัติและฝ่ายบุคคลเห็นทุกใบ
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-config.js";
import { collection, getDocs, query, where, orderBy, limit }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ผู้ใช้ปัจจุบันพร้อมบทบาท, เป็นผู้พิจารณา } from "./auth-role.js";

var กล่อง = document.getElementById("ผลลัพธ์");
var จำนวนสูงสุด = 100;   // ไม่แบ่งหน้า จึงจำกัดจำนวนที่ดึงมาแสดง

(async function () {
  var ผู้ใช้ = await ผู้ใช้ปัจจุบันพร้อมบทบาท();
  if (!ผู้ใช้.user) return;   // nav.js พาไปหน้าล็อกอินให้แล้ว

  var ใบลาทั้งหมด = [];
  try {
    var คำสั่ง;
    if (เป็นผู้พิจารณา(ผู้ใช้.role)) {
      คำสั่ง = query(collection(db, "leaveRequests"), orderBy("createdAt", "desc"), limit(จำนวนสูงสุด));
    } else {
      คำสั่ง = query(collection(db, "leaveRequests"), where("requesterId", "==", ผู้ใช้.user.uid), limit(จำนวนสูงสุด));
    }
    var ผล = await getDocs(คำสั่ง);
    ผล.forEach(function (d) {
      var ข้อมูล = d.data();
      ข้อมูล.id = d.id;
      ใบลาทั้งหมด.push(ข้อมูล);
    });
  } catch (e) {
    console.error(e);
    กล่อง.innerHTML = "<p>โหลดรายการใบลาไม่สำเร็จ — ตรวจการเชื่อมต่อหรือสิทธิ์การเข้าถึง</p>";
    return;
  }

  // ใหม่ไปเก่า
  ใบลาทั้งหมด.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });

  แสดงตาราง(ใบลาทั้งหมด);

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + encodeURIComponent(แถว.dataset.id);
      });
    });
  }
})();
