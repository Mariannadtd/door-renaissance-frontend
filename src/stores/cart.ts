import { defineStore } from "pinia";

const KEY = "cart";

function safeReadLS(key: string) {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      return parsed
        .filter((i) => i && typeof i === "object")
        .map((i) => ({
          id: i.id,
          name: i.name,
          price: Number.isFinite(+i.price) ? +i.price : 0,
          quantity:
            Number.isFinite(+i.quantity) && +i.quantity > 0 ? +i.quantity : 1,
          image: i.image,
          ...i,
        }));
    }
    return [];
  } catch {
    return [];
  }
}

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: safeReadLS(KEY) as Array<{
      id: string;
      name?: string;
      price: number;
      quantity: number;
      image?: string;
      [key: string]: any;
    }>,
  }),
  actions: {
    persist() {
      try {
        if (typeof window === "undefined") return;
        localStorage.setItem(KEY, JSON.stringify(this.items));
      } catch {}
    },

    addToCart(product: any) {
      const price = Number.isFinite(+product.price) ? +product.price : 0;
      const existing = this.items.find((i) => i.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.items.push({ ...product, price, quantity: 1 });
      }
      this.persist();
    },

    decrementItem(id: string) {
      const item = this.items.find((i) => i.id === id);
      if (!item) return;
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        this.items = this.items.filter((i) => i.id !== id);
      }
      this.persist();
    },

    setQuantity(id: string, qty: number) {
      const item = this.items.find((i) => i.id === id);
      if (!item) return;
      const q = Math.max(0, Math.floor(qty || 0));
      if (q <= 0) {
        this.items = this.items.filter((i) => i.id !== id);
      } else {
        item.quantity = q;
      }
      this.persist();
    },

    removeFromCart(id: string) {
      this.items = this.items.filter((i) => i.id !== id);
      this.persist();
    },

    clearCart() {
      this.items = [];
      this.persist();
    },
  },
  getters: {
    totalCount: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: (state) =>
      state.items.reduce(
        (sum, i) => sum + (Number(i.price) || 0) * i.quantity,
        0
      ),
  },
});
