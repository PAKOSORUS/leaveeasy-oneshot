// ─────────────────────────────────────────────────────────────
// js/ai.js — ผู้ช่วย AI ผ่าน OpenRouter (US-09 + สรุปใบลาให้หัวหน้า)
// คีย์อ่านจาก js/config.local.js เท่านั้น (ไม่อยู่ใน git) · ไม่พิมพ์ค่าคีย์ออก console
// ล้มเหลว/หมดเวลา → โยน Error ที่มีข้อความไทย ผู้เรียกจับแล้วแสดงเตือน ระบบไม่ค้าง
// ─────────────────────────────────────────────────────────────

var เวลารอสูงสุดมิลลิวินาที = 15000;
var ที่อยู่OpenRouter = "https://openrouter.ai/api/v1/chat/completions";

// โหลดคีย์แบบ dynamic เพื่อให้หน้ายังทำงานได้แม้ไม่มีไฟล์ config.local.js
async function โหลดการตั้งค่า() {
  try {
    var m = await import("./config.local.js");
    if (!m.OPENROUTER_API_KEY || !m.OPENROUTER_MODEL) throw new Error("ว่าง");
    return { key: m.OPENROUTER_API_KEY, model: m.OPENROUTER_MODEL };
  } catch (e) {
    throw new Error("ยังไม่ได้ตั้งค่าผู้ช่วย AI (ไม่พบ config.local.js)");
  }
}

// เรียกโมเดลหนึ่งครั้ง พร้อม timeout 15 วินาทีด้วย AbortController
async function ถามAI(ข้อความระบบ, ข้อความผู้ใช้) {
  var ตั้งค่า = await โหลดการตั้งค่า();
  var ตัวยกเลิก = new AbortController();
  var ตัวจับเวลา = setTimeout(function () { ตัวยกเลิก.abort(); }, เวลารอสูงสุดมิลลิวินาที);
  try {
    var res = await fetch(ที่อยู่OpenRouter, {
      method: "POST",
      signal: ตัวยกเลิก.signal,
      headers: {
        "Authorization": "Bearer " + ตั้งค่า.key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: ตั้งค่า.model,
        temperature: 0,
        messages: [
          { role: "system", content: ข้อความระบบ },
          { role: "user", content: ข้อความผู้ใช้ }
        ]
      })
    });
    if (!res.ok) throw new Error("บริการ AI ตอบกลับผิดปกติ (" + res.status + ")");
    var json = await res.json();
    var ข้อความ = json && json.choices && json.choices[0] && json.choices[0].message &&
                  json.choices[0].message.content;
    if (!ข้อความ) throw new Error("AI ไม่ได้ตอบข้อความกลับมา");
    return String(ข้อความ);
  } catch (e) {
    if (e && e.name === "AbortError") throw new Error("AI ตอบช้าเกิน 15 วินาที");
    if (e instanceof TypeError) throw new Error("เชื่อมต่อบริการ AI ไม่ได้");
    throw e;
  } finally {
    clearTimeout(ตัวจับเวลา);
  }
}

// คืน id ของประเภทที่มีอยู่จริง หรือ null ถ้าจัดไม่ได้/ผลไม่ตรงรายการ
export async function จัดประเภทการลาด้วยAI(เหตุผล, ประเภททั้งหมด) {
  var รายชื่อ = ประเภททั้งหมด.map(function (t) { return t.id + " = " + t.name; }).join("\n");
  var ตอบ = await ถามAI(
    "คุณเป็นผู้ช่วยจัดประเภทการลา เลือกได้เฉพาะจากรายการที่ให้เท่านั้น " +
    "ตอบเป็น JSON บรรทัดเดียว เช่น {\"id\":\"<รหัส>\"} ถ้าไม่มีประเภทที่เหมาะสมให้ตอบ {\"id\":null} " +
    "ห้ามตอบอย่างอื่น",
    "รายการประเภทการลา (รหัส = ชื่อ):\n" + รายชื่อ + "\n\nเหตุผลการลา:\n" + เหตุผล
  );
  var ตรง = ตอบ.match(/\{[\s\S]*?\}/);
  if (!ตรง) return null;
  var id;
  try { id = JSON.parse(ตรง[0]).id; } catch (e) { return null; }
  var พบ = ประเภททั้งหมด.find(function (t) { return t.id === id; });
  return พบ ? พบ.id : null;
}

// สรุปใบลาเป็นข้อความสั้นสำหรับหัวหน้า (ไม่ส่งชื่อคนและรหัสผู้ใช้ไปให้ AI)
export async function สรุปใบลาด้วยAI(ใบ, ความเห็น) {
  var ข้อมูล =
    "หัวข้อ: " + ใบ.title + "\n" +
    "เหตุผล: " + ใบ.reason + "\n" +
    "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
    "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
    "จำนวนความเห็นที่มีแล้ว: " + ความเห็น.length;
  return await ถามAI(
    "คุณช่วยสรุปใบลาให้หัวหน้าอ่านก่อนตัดสินใจ สรุปเป็นภาษาไทย 2-3 ประโยค " +
    "บอกประเภท ช่วงวันที่ และเหตุผลโดยย่อ ห้ามแนะนำว่าควรอนุมัติหรือไม่ ห้ามเดาข้อมูลที่ไม่มี",
    ข้อมูล
  );
}

// คำเตือนห้ามใส่ข้อมูลส่วนบุคคลจริง (สเปกหัวข้อ 9) — ใส่ไว้เหนือปุ่มที่ส่งข้อความไป AI
export function สร้างคำเตือนข้อมูลส่วนบุคคล() {
  var p = document.createElement("p");
  p.className = "hint";
  p.id = "คำเตือนข้อมูลส่วนบุคคล";
  p.textContent = "⚠️ อย่าพิมพ์ข้อมูลส่วนบุคคลจริง (เช่น ชื่อจริง เลขบัตรประชาชน เบอร์โทร อาการป่วยที่ระบุตัวตนได้) " +
                  "ในเหตุผลการลา เพราะข้อความนี้จะถูกส่งไปให้ AI ภายนอกเมื่อกดปุ่ม AI";
  return p;
}
