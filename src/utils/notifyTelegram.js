const WORKER_URL = import.meta.env.VITE_TG_WORKER_URL;

export async function notifyTelegram(contact, order, total) {
  if (!WORKER_URL) {
    console.warn("notifyTelegram: пропущено (нет WORKER_URL)");
    return { success: false, skipped: true };
  }

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, order, total }),
    });

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      const t = await res.text();
      console.warn("notifyTelegram: not_json:", res.status, t.slice(0, 120));
      return { success: false, status: res.status, not_json: true };
    }

    const json = await res.json();
    if (!res.ok || !json.success) {
      console.warn("notifyTelegram: backend error:", json);
      return {
        success: false,
        status: res.status,
        error: json?.error || "tg_failed",
      };
    }

    return json;
  } catch (e) {
    console.warn("notifyTelegram: network/error:", e);
    return { success: false, error: String(e) };
  }
}
