<template>
  <section class="orders">
    <header class="orders__top">
      <h2>Заказы</h2>
      <div class="orders__meta">
        <span v-if="loading" class="muted">Загрузка…</span>
        <span v-else class="muted">Всего: {{ visibleOrders.length }}</span>
        <button class="refresh" @click="refresh" :disabled="loading">
          Обновить
        </button>
      </div>
    </header>

    <p v-if="error" class="error">
      {{ error }}
      <br />
      <small class="muted"
        >Проверьте вход под админ-почтой из правил Firestore.</small
      >
    </p>

    <div v-if="!loading && !error && visibleOrders.length === 0" class="empty">
      Заказов пока нет.
    </div>

    <div v-for="o in visibleOrders" :key="o.id" class="order-card">
      <div class="order-head">
        <div class="head__left">
          <strong
            >Заказ <span class="mono">#{{ o.id.slice(0, 5) }}</span></strong
          >
          <span class="chip chip--new" v-if="o.status === 'new'">new</span>
          <span class="muted">от {{ formatDate(o.createdAt) }}</span>
        </div>

        <div class="head__right">
          <div class="total">
            Итого: <b>{{ formatMoney(o.total) }}</b>
          </div>
          <button
            class="danger"
            @click="archiveOrder(o.id)"
            :disabled="archiving[o.id]"
          >
            {{ archiving[o.id] ? "..." : "Удалить" }}
          </button>
        </div>
      </div>

      <div class="contact">
        <span class="contact__name">{{ o.contact?.name || "—" }}</span>
        <span class="dot">•</span>
        <span class="contact__phone">{{ o.contact?.phone || "—" }}</span>
        <span class="dot" v-if="o.contact?.email">•</span>
        <span class="contact__email" v-if="o.contact?.email">{{
          o.contact.email
        }}</span>
      </div>

      <div class="order-grid row row--head">
        <div class="cell cell--name">Товар</div>
        <div class="cell">Кол-во</div>
        <div class="cell">Размер</div>
        <div class="cell">Погонаж</div>
        <div class="cell">Итого по позиции</div>
      </div>

      <div v-for="(it, idx) in o.items" :key="idx" class="order-grid row">
        <div class="cell cell--name">
          {{ it.name || it.title || "Без названия" }}
        </div>

        <div class="cell">× {{ it.qty ?? it.quantity ?? 1 }}</div>

        <div class="cell">
          <span v-if="it.size || it.selectedSize" class="badge">{{
            it.size ?? it.selectedSize
          }}</span>
          <span v-else class="muted">—</span>
        </div>

        <div class="cell">
          <template v-if="hasMoulding(it)">
            {{ formatMoney(getMouldingSum(it)) }}
            <button class="mini" @click="toggleMoulding(o.id, idx)">
              {{ isMouldingOpen(o.id, idx) ? "Скрыть" : "Показать" }} погонаж
            </button>

            <div v-if="isMouldingOpen(o.id, idx)" class="moulding">
              <div
                v-for="(m, mi) in Array.isArray(it.pogonazh?.items)
                  ? it.pogonazh.items
                  : toArray(it.moulding || it.pogonazh)"
                :key="mi"
                class="moulding__row"
              >
                <span class="m-name">{{ m.name || "Элемент" }}</span>
                <span class="m-dot">·</span>
                <span class="m-qty"
                  >×{{ m.qty ?? m.count ?? m.quantity ?? 1 }}</span
                >
                <span class="m-money">{{
                  formatMoney(mouldingItemSum(m))
                }}</span>
              </div>
            </div>
          </template>
          <span v-else class="muted">—</span>
        </div>

        <div class="cell">
          {{ formatMoney(itemTotal(it)) }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import {
  getFirestore,
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

type Contact = { name?: string; phone?: string; email?: string };
type MouldingItem = Record<string, any>;
type OrderItem = {
  name?: string;
  title?: string;
  qty?: number;
  quantity?: number;
  size?: string | number;
  selectedSize?: string | number;
  price?: number;
  sum?: number;
  moulding?: MouldingItem[] | Record<string, any>;
  pogonazh?:
    | MouldingItem[]
    | Record<string, any>
    | { items?: any[]; total?: number };
};
type Order = {
  id: string;
  contact?: Contact;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: Timestamp | Date | null;
};

const db = getFirestore();

const orders = ref<Order[]>([]);
const loading = ref(true);
const error = ref<string>("");
const openMoulding = ref<Record<string, boolean>>({});
const archiving = ref<Record<string, boolean>>({});

const visibleOrders = computed(() =>
  orders.value.filter((o) => o.status !== "archived")
);

function keyFor(orderId: string, idx: number) {
  return `${orderId}:${idx}`;
}
function isMouldingOpen(orderId: string, idx: number) {
  return !!openMoulding.value[keyFor(orderId, idx)];
}
function toggleMoulding(orderId: string, idx: number) {
  const k = keyFor(orderId, idx);
  openMoulding.value[k] = !openMoulding.value[k];
}

function toArray(val: any): MouldingItem[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return Object.values(val);
  return [];
}

function num(x: any, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

function mouldingItemSum(m: any) {
  if (typeof m === "number") return num(m);
  if (!m) return 0;
  if (m.sum != null) return num(m.sum);
  if (m.total != null) return num(m.total);
  if (m.amount != null) return num(m.amount);

  const price =
    num(m.price) ||
    num(m.unitPrice) ||
    num(m.pricePerUnit) ||
    num(m.price_per_unit) ||
    num(m.pricePerMeter) ||
    num(m.cost);

  const qty =
    num(m.qty, 1) || num(m.count, 1) || num(m.quantity, 1) || num(m.pieces, 1);

  const length = num(m.length) || num(m.meters) || num(m.m);
  if (length && num(m.pricePerMeter)) return length * num(m.pricePerMeter);

  return price * (qty || 1);
}

function hasMoulding(it: OrderItem) {
  const p: any = (it as any).pogonazh;
  if (p) {
    if (Array.isArray(p.items) && p.items.length > 0) return true;
    if (num(p.total)) return true;
  }
  return toArray((it as any).moulding || (it as any).pogonazh).length > 0;
}

function getMouldingSum(it: OrderItem) {
  const p: any = (it as any).pogonazh;
  if (p) {
    const totalNum = num(p.total);
    if (totalNum) return totalNum;
    if (Array.isArray(p.items)) {
      return p.items.reduce((s: number, m: any) => s + mouldingItemSum(m), 0);
    }
  }
  return toArray((it as any).moulding || (it as any).pogonazh).reduce(
    (s: number, m: any) => s + mouldingItemSum(m),
    0
  );
}

function itemTotal(it: OrderItem) {
  if (typeof it.sum === "number") return it.sum;
  const qty = it.qty ?? it.quantity ?? 1;
  const base = (it.price ?? 0) * qty;
  return base + getMouldingSum(it);
}

function formatMoney(n: number | undefined) {
  const num = typeof n === "number" ? n : 0;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(num);
}
function formatDate(ts: Timestamp | Date | null) {
  if (!ts) return "—";
  const d = ts instanceof Date ? ts : ts.toDate();
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function archiveOrder(id: string) {
  try {
    archiving.value[id] = true;
    await updateDoc(doc(db, "orders", id), { status: "archived" });
  } catch (e: any) {
    console.error(e);
    error.value =
      "Не удалось удалить (нужно разрешить update status в правилах и нажать Publish).";
  } finally {
    archiving.value[id] = false;
  }
}

function refresh() {
  loading.value = true;
  error.value = "";
  getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")))
    .then((snap) => {
      const arr: Order[] = [];
      snap.forEach((docu) => {
        const data = docu.data() as any;
        arr.push({
          id: docu.id,
          contact: data.contact ?? {},
          items: (data.items ?? []) as OrderItem[],
          total: data.total ?? 0,
          status: data.status ?? "new",
          createdAt: data.createdAt ?? null,
        });
      });
      orders.value = arr;
    })
    .catch((e: any) => {
      console.error(e);
      error.value = humanizeFirestoreError(e);
    })
    .finally(() => (loading.value = false));
}

function humanizeFirestoreError(e: any) {
  const msg = (e?.message || "").toString();
  if (msg.includes("Missing or insufficient permissions")) {
    return "Недостаточно прав для чтения заказов. Войдите под админ-почтой и проверьте правила.";
  }
  return "Ошибка загрузки заказов. " + msg;
}

onMounted(() => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const unsub = onSnapshot(
    q,
    (snap) => {
      const arr: Order[] = [];
      snap.forEach((docu) => {
        const data = docu.data() as any;
        arr.push({
          id: docu.id,
          contact: data.contact ?? {},
          items: (data.items ?? []) as OrderItem[],
          total: data.total ?? 0,
          status: data.status ?? "new",
          createdAt: data.createdAt ?? null,
        });
      });
      orders.value = arr;
      loading.value = false;
    },
    (e) => {
      console.error("orders snapshot:", e);
      error.value = humanizeFirestoreError(e);
      loading.value = false;
    }
  );
  onUnmounted?.(unsub);
});
</script>

<style scoped lang="scss">
:root {
  --sep: rgba(0, 0, 0, 0.08);
  --sep-strong: rgba(0, 0, 0, 0.12);
  --muted: #6b7280;
  --chip: #2563eb;
  --chip-bg: #eef2ff;
  --card-radius: 16px;
}

.orders {
  max-width: 1100px;
  margin: 0 auto;
}
.orders__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0 16px;
  h2 {
    margin: 0;
  }
}
.orders__meta {
  display: inline-flex;
  gap: 12px;
  align-items: center;
}
.refresh {
  border: 1px solid var(--sep);
  background: #fff;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.refresh:disabled {
  opacity: 0.5;
  cursor: default;
}

.muted {
  color: var(--muted);
}
.error {
  color: #c0392b;
  background: #ffecec;
  border: 1px solid #ffd2d2;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 10px;
}
.empty {
  color: var(--muted);
  padding: 24px 8px;
}

.order-card {
  background: #fff;
  border-radius: var(--card-radius);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.06);
  padding: 16px 18px;
  margin-bottom: 16px;
}
.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.head__left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
.chip {
  font-size: 12px;
  line-height: 1;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid var(--sep);
  background: var(--chip-bg);
  color: var(--chip);
  font-weight: 700;
}
.total {
  white-space: nowrap;
}
.head__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

button.danger {
  border: 1px solid rgba(220, 38, 38, 0.25);
  background: #fff;
  color: #dc2626;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
}
button.danger:hover {
  background: #fff5f5;
}

.contact {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  color: var(--muted);
}
.dot {
  color: var(--muted);
}

.order-grid {
  display: grid;
  grid-template-columns: minmax(160px, 1.1fr) 0.35fr 0.45fr 0.8fr 0.6fr;
  align-items: center;
  min-height: 44px;
  border-radius: 12px;
  overflow: hidden;
}
.row {
  background: #fff;
  border: 1px solid var(--sep);
}
.row:not(:last-child) {
  border-bottom: none;
}
.row--head {
  background: #f8fafc;
  font-weight: 700;
}

.cell {
  padding: 10px 12px;
  position: relative;
}
.cell:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 0;
  right: -0.5px;
  bottom: 0;
  width: 1px;
  background: var(--sep);
}
.row:hover .cell:not(:last-child)::after {
  background: var(--sep-strong);
}
.cell--name {
  font-weight: 600;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 26px;
  padding: 0 8px;
  border-radius: 10px;
  background: #f3f4f6;
  font-weight: 600;
}

button.mini {
  margin-left: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--sep);
  background: #fff;
  cursor: pointer;
}

.moulding {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed var(--sep);
  display: grid;
  gap: 4px;
}
.moulding__row {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
}
.m-name {
  font-weight: 600;
}
.m-money {
  margin-left: auto;
}

@media (max-width: 640px) {
  .order-grid {
    grid-template-columns: 1fr;
  }
  .row {
    border-radius: 12px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--sep);
  }
  .cell {
    padding: 10px 8px;
  }
  .cell:not(:last-child)::after {
    display: none;
  }
  .order-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .contact {
    flex-wrap: wrap;
  }
}
</style>
