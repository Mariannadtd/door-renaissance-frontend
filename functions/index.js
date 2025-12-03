// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/* ===== helpers ===== */
function allowCORS(req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

function clientIp(req) {
  const fwd = (req.headers["x-forwarded-for"] || "")
    .toString()
    .split(",")[0]
    .trim();
  return fwd || req.socket.remoteAddress || "0.0.0.0";
}

async function rateLimit(key, limit, windowSec) {
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const ref = db.collection("ratelimits").doc(`${key}:${bucket}`);
  const snap = await ref.get();
  const count = snap.exists ? snap.get("count") : 0;
  if (count >= limit) return false;

  const expireMs = bucket * windowSec * 1000 + windowSec * 1000 * 2;
  const expireAt = admin.firestore.Timestamp.fromDate(new Date(expireMs));

  await ref.set(
    { count: admin.firestore.FieldValue.increment(1), expireAt },
    { merge: true }
  );
  return true;
}

async function verifyRecaptcha(token, secret, expectedAction = "order") {
  if (!token || !secret) return { ok: true, score: 0.0 };
  const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await resp.json();
  const ok =
    !!data.success &&
    (data.action ? data.action === expectedAction : true) &&
    (data.score ?? 0) >= 0.5;
  return { ok, score: data.score ?? 0 };
}

/* ============ TELEGRAM ============ */
const TELEGRAM_BOT_TOKEN = functions.config().telegram?.bot_token;
const TELEGRAM_CHAT_ID = functions.config().telegram?.chat_id;

exports.sendOrderToTelegram = functions.https.onRequest(async (req, res) => {
  if (allowCORS(req, res)) return;
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { contact, order, total } = req.body || {};
    if (!contact || !Array.isArray(order))
      return res.status(400).send("Bad request");

    let text = `📦 *Новый заказ* 📦\n`;
    text += `*Клиент:* ${contact.name}\n`;
    text += `*Телефон:* ${contact.phone}\n`;
    if (contact.email) text += `*Email:* ${contact.email}\n`;
    text += `\n*Товары:*\n`;
    order.forEach((i) => {
      text += `• ${i.name} × ${i.quantity} — ${Number(i.price).toLocaleString(
        "ru-RU"
      )}₽\n`;
    });
    text += `\n*Итого:* ${Number(total).toLocaleString("ru-RU")}₽`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    });
    if (!resp.ok) throw new Error(`telegram ${resp.status}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Telegram error:", err);
    res.status(500).json({ error: String(err) });
  }
});

/* ============ CREATE ORDER ============ */
exports.createOrder = functions.https.onRequest(async (req, res) => {
  if (allowCORS(req, res)) return;
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { name, phone, email, items, total, recaptchaToken, hp } =
      req.body || {};
    if (hp) return res.status(400).json({ ok: false, code: "bot_hp" });

    if (
      typeof name !== "string" ||
      !/^[A-Za-zА-Яа-яЁё]{2,}(?: [A-Za-zА-Яа-яЁё]{2,})*$/.test(name)
    )
      return res.status(400).json({ ok: false, code: "bad_name" });
    if (typeof phone !== "string" || !/^\+?[0-9]{10,12}$/.test(phone))
      return res.status(400).json({ ok: false, code: "bad_phone" });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ ok: false, code: "bad_email" });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ ok: false, code: "bad_items" });

    const ip = clientIp(req);

    const okIp = await rateLimit(`ip:${ip}`, 10, 60);
    const okPhone = await rateLimit(`phone:${phone}`, 3, 3600);
    if (!okIp || !okPhone)
      return res.status(429).json({ ok: false, code: "rate_limited" });

    const secret =
      (functions.config().recaptcha && functions.config().recaptcha.secret) ||
      "";
    const v = await verifyRecaptcha(recaptchaToken, secret, "order");
    if (!v.ok) return res.status(403).json({ ok: false, code: "recaptcha" });

    await db.collection("orders").add({
      contact: { name, phone, email: email || null },
      items,
      total,
      status: "new",
      createdAt: admin.firestore.Timestamp.now(),
      ip,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, code: "server_error" });
  }
});
