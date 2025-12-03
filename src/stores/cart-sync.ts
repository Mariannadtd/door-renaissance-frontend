import { useCartStore } from "./cart";

function safeReadLS(key: string) {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function initCartCrossTabSync(pinia: any) {
  if (typeof window === "undefined") return;
  const store = useCartStore(pinia);

  window.addEventListener("storage", (e) => {
    if (e.key === "cart") {
      store.$patch({ items: safeReadLS("cart") });
    }
  });

  store.$subscribe((_mutation, state) => {
    localStorage.setItem("cart", JSON.stringify(state.items));
  });
}
