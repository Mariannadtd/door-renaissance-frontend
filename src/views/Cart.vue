<script setup>
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "../stores/cart";
import Button from "../components/UI/Button.vue";
import Modal from "../components/UI/Modal.vue";
import Advantages from "../components/Advantages.vue";
import Map from "../components/Map.vue";
import CartSizePicker from "@/components/CartSizePicker.vue";
import HowTo from "../components/HowTo.vue";

import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { notifyTelegram } from "../utils/notifyTelegram.js";

const router = useRouter();
const cartStore = useCartStore();

const items = computed(() => cartStore.items);
const totalPrice = computed(() => cartStore.totalPrice);

const showModal = ref(false);
const isSubmitting = ref(false);

const selections = reactive({});
const openedId = ref(null);

const BASE_ROWS = [
  { key: "box", name: "Дверная коробка", unit: "п.м.", price: 660, qty: 0 },
  { key: "dob100", name: "Добор 100", unit: "п.м.", price: 490, qty: 0 },
  { key: "dob150", name: "Добор 150", unit: "п.м.", price: 720, qty: 0 },
  { key: "dob200", name: "Добор 200", unit: "п.м.", price: 960, qty: 0 },
  { key: "nal", name: "Наличник", unit: "п.м.", price: 370, qty: 0 },
  { key: "plint", name: "Плинтус МДФ", unit: "п.м.", price: 470, qty: 0 },
  { key: "plan", name: "Притворная планка", unit: "шт", price: 350, qty: 0 },
];

// Двери: межкомнатные и входные
function isDoor(item) {
  return item.category === "interiors" || item.category === "exteriors";
}

function ensureSelection(id) {
  if (!selections[id]) {
    selections[id] = {
      size: null,
      rows: BASE_ROWS.map((r) => ({ ...r })),
      pogonazhTotal: 0,
    };
  }
  return selections[id];
}

function togglePogonazh(item) {
  ensureSelection(item.id);
  openedId.value = openedId.value === item.id ? null : item.id;
}

function lineTotalPogonazh(item) {
  if (!isDoor(item)) return 0;

  const sel = ensureSelection(item.id);
  sel.pogonazhTotal = sel.rows.reduce(
    (s, r) => s + Number(r.qty || 0) * Number(r.price || 0),
    0
  );
  return sel.pogonazhTotal;
}

const pogonazhGrandTotal = computed(() =>
  items.value.reduce((sum, it) => sum + lineTotalPogonazh(it), 0)
);

const orderPayload = computed(() => ({
  items: items.value.map((i) => {
    const hasDoorPogonazh = isDoor(i);
    const sel = hasDoorPogonazh ? ensureSelection(i.id) : null;

    const base = {
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      ...(hasDoorPogonazh && sel?.size != null
        ? { selectedSize: Number(sel.size) }
        : {}),
    };

    if (hasDoorPogonazh && sel) {
      base.pogonazh = {
        items: sel.rows.filter((r) => Number(r.qty) > 0),
        total: sel.pogonazhTotal,
      };
      base.lineTotal = i.price * i.quantity + sel.pogonazhTotal;
    } else {
      base.lineTotal = i.price * i.quantity;
    }

    return base;
  }),
  total: totalPrice.value + pogonazhGrandTotal.value,
}));

function increment(item) {
  cartStore.addToCart(item);
}

function decrement(item) {
  item.quantity > 1
    ? cartStore.decrementItem(item.id)
    : cartStore.removeFromCart(item.id);
}

function remove(item) {
  cartStore.removeFromCart(item.id);
  delete selections[item.id];
}

function clearCart() {
  if (confirm("Вы действительно хотите удалить все товары из корзины?")) {
    cartStore.clearCart();
    for (const k in selections) delete selections[k];
    openedId.value = null;
  }
}

function openModal() {
  if (items.value.length) showModal.value = true;
}

function goBack() {
  router.back();
}

function formatPrice(v) {
  return Math.round(v).toLocaleString("ru-RU");
}

function buildOrderDoc(contactData, payload) {
  return {
    contact: {
      name: String(contactData.name || "").trim(),
      phone: String(contactData.phone || "").trim(),
      ...(contactData.email ? { email: String(contactData.email).trim() } : {}),
    },
    items: payload.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 0,
      ...(i.selectedSize != null
        ? { selectedSize: Number(i.selectedSize) }
        : {}),
      ...(i.pogonazh
        ? {
            pogonazh: {
              items: Array.isArray(i.pogonazh.items) ? i.pogonazh.items : [],
              total: Number(i.pogonazh.total) || 0,
            },
          }
        : {}),
    })),
    total: Number(payload.total) || 0,
    status: "new",
    createdAt: serverTimestamp(),
  };
}

async function submitOrder(contactData) {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const orderDoc = buildOrderDoc(contactData, orderPayload.value);

    await addDoc(collection(db, "orders"), orderDoc);

    try {
      await notifyTelegram(
        {
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email || null,
        },
        orderPayload.value.items,
        orderPayload.value.total
      );
    } catch (err) {
      console.warn("⚠️ notifyTelegram skipped:", err);
    }

    cartStore.clearCart();
    for (const k in selections) delete selections[k];
    openedId.value = null;
    showModal.value = false;
    router.push({ name: "home" });
  } catch (e) {
    console.error("❌ Firestore addDoc failed:", e?.code, e?.message, e);
    if (e?.code === "permission-denied") {
      alert(
        "Не удалось сохранить заказ: правила Firestore отклонили запись. Проверьте схему документа."
      );
    } else {
      alert("Не удалось оформить заказ:\n" + (e?.message || e));
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="cart-page">
    <h1>Корзина</h1>

    <div v-if="!items.length" class="empty">Ваша корзина пуста.</div>

    <div v-else class="cart__wrapper">
      <Button @click="goBack" class="back">
        <img src="../assets/img/arrow-right.png" alt="" class="back__img" />
        Назад
      </Button>

      <div class="cart-group">
        <ul class="cart-list">
          <li v-for="item in items" :key="item.id" class="cart-item">
            <img :src="item.images?.[0]" alt="" class="c-img" />

            <div class="c-title">{{ item.name }}</div>

            <div class="c-qty">
              <Button @click="decrement(item)" class="cart-item__btn">−</Button>
              <span>{{ item.quantity }}</span>
              <Button @click="increment(item)" class="cart-item__btn">+</Button>
            </div>

            <div class="c-price">
              {{ formatPrice(item.price * item.quantity) }} ₽
            </div>

            <Button @click="remove(item)" class="c-remove" aria-label="Удалить">
              ✕
            </Button>

            <!-- Резюме погонажа только для дверей -->
            <div class="c-pg-summary" v-if="isDoor(item)">
              <template v-if="ensureSelection(item.id).size === null">
                Размер не выбран
              </template>
              <template v-else>
                Размер: <b>{{ ensureSelection(item.id).size }}</b>
                <span v-if="ensureSelection(item.id).pogonazhTotal > 0">
                  • Погонаж:
                  <b>
                    {{ formatPrice(ensureSelection(item.id).pogonazhTotal) }}
                    ₽
                  </b>
                </span>
              </template>
            </div>

            <!-- Кнопка погонажа только для дверей -->
            <Button
              v-if="isDoor(item)"
              class="c-pg-btn"
              @click="togglePogonazh(item)"
            >
              Подобрать погонаж и размер
              <span class="c-caret">
                {{ openedId === item.id ? "▲" : "▼" }}
              </span>
            </Button>

            <!-- Панель погонажа только для дверей -->
            <transition name="fade">
              <div
                v-show="isDoor(item) && openedId === item.id"
                class="c-pg-panel"
              >
                <CartSizePicker
                  v-model="ensureSelection(item.id).size"
                  :options="[60, 70, 80, 90]"
                  label="Размер"
                />

                <div class="pg-table">
                  <div class="pg-row pg-head">
                    <div>Позиция</div>
                    <div>Ед.</div>
                    <div>Цена</div>
                    <div>Кол-во</div>
                    <div>Сумма</div>
                  </div>

                  <div
                    v-for="r in ensureSelection(item.id).rows"
                    :key="r.key"
                    class="pg-row"
                  >
                    <div>{{ r.name }}</div>
                    <div>{{ r.unit }}</div>
                    <div>{{ r.price }} ₽</div>
                    <div class="pg-qty">
                      <button
                        @click="r.qty = Math.max(0, Number(r.qty || 0) - 1)"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        v-model.number="r.qty"
                      />
                      <button @click="r.qty = Number(r.qty || 0) + 1">+</button>
                    </div>
                    <div>
                      {{
                        (
                          Number(r.qty || 0) * Number(r.price || 0)
                        ).toLocaleString("ru-RU")
                      }}
                      ₽
                    </div>
                  </div>
                </div>

                <div class="c-pg-total">
                  Итого по погонажу:
                  <b>{{ formatPrice(lineTotalPogonazh(item)) }} ₽</b>
                </div>
              </div>
            </transition>

            <div class="c-line-total">
              Итого:
              <b>
                {{
                  formatPrice(
                    item.price * item.quantity +
                      (isDoor(item)
                        ? ensureSelection(item.id).pogonazhTotal
                        : 0)
                  )
                }}
                ₽
              </b>
            </div>
          </li>
        </ul>

        <div class="cart-summary">
          <p>
            Итого:
            <strong>
              {{ formatPrice(totalPrice + pogonazhGrandTotal) }} ₽
            </strong>
          </p>
          <div class="cart-controls">
            <Button @click="clearCart" class="btn__remove">
              Удалить все
            </Button>
            <Button
              @click="openModal"
              class="btn-checkout"
              :disabled="isSubmitting"
            >
              Оформить
            </Button>
          </div>
        </div>
      </div>
    </div>

    <HowTo />

    <h1 class="txt">
      Не разобрались как подобрать погонаж? Оксана и Елена с радостью помогут!
    </h1>
    <div class="call">
      <Button @click="openModal">+7 988 406-88-87</Button>
    </div>

    <Modal
      v-if="showModal"
      :order="orderPayload"
      @close="showModal = false"
      @submit-order="submitOrder"
    />
  </section>

  <Advantages />
  <Map />
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

h1
  display: flex
  justify-content: center

.call
  display: flex
  justify-content: center

.empty
  text-align: center
  color: gray
  margin-bottom: 2rem
  font-size: 1.6rem

.cart__wrapper
  max-width: 70rem
  margin: 0 auto

.cart-list
  list-style: none
  margin: 0
  padding: 0

.cart-item
  display: grid
  grid-template-columns: 10rem 1fr auto auto auto
  grid-template-areas: unquote('"img title qty price remove" "img pgbtn pgbtn pgbtn pgbtn" "img pgpanel pgpanel pgpanel pgpanel" "img pgsum pgsum pgsum pgsum" "img linetotal linetotal linetotal linetotal"')
  gap: .75rem 1rem
  padding: 1rem 0
  border-bottom: 1px solid #80808040

.c-img
  grid-area: img
  width: 10rem
  height: 10rem
  object-fit: cover
  border-radius: .5rem

.c-title
  min-width: 0
  overflow-wrap: anywhere
  grid-area: title
  align-self: center
  font-size: 1.2rem
  font-weight: 700
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.c-qty
  grid-area: qty
  display: inline-flex
  align-items: center
  gap: .5rem
  .cart-item__btn
    padding: .45rem 1rem

.c-price
  grid-area: price
  align-self: center
  font-weight: 800
  font-size: 1.1rem
  white-space: nowrap

.c-remove
  grid-area: remove
  justify-self: end
  background: none
  border: none
  font-size: 1.1rem
  cursor: pointer
  line-height: 1
  padding: .25rem .4rem
  color: #b91c1c

.c-pg-btn
  grid-area: pgbtn
  font-weight: 700
  display: inline-flex
  align-items: center
  gap: .5rem
  width: fit-content
  border: none !important
  background-color: #fff
  box-shadow: 0 4px 12px rgba(0,0,0,.1)
  color: black

.c-caret
  opacity: .9

.c-pg-panel
  grid-area: pgpanel
  background: #fff
  border: 1px solid #eef2f5
  border-radius: .6rem
  padding: .8rem

.c-pg-total
  margin-top: .5rem
  font-weight: 600

.c-pg-summary
  grid-area: pgsum
  color: #6b6b6b

.c-line-total
  grid-area: linetotal
  text-align: right
  font-size: 1.05rem
  b
    font-weight: 800

.pg-table
  display: grid
  gap: .5rem

.pg-row
  display: grid
  grid-template-columns: 1fr 70px 110px 160px 130px
  align-items: center
  gap: .5rem
  padding: .5rem .25rem
  border-bottom: 1px dashed #eef2f5

.pg-head
  color: #6b6b6b
  font-weight: 600

.pg-qty
  display: inline-flex
  align-items: center
  gap: .35rem
  > button
    width: 28px
    height: 28px
    border: 1px solid #dfe3e6
    border-radius: 6px
    background: #fff
    cursor: pointer
  > input
    width: 68px
    height: 28px
    border: 1px solid #dfe3e6
    border-radius: 6px
    padding: 0 .5rem

.cart-summary
  margin-top: 2rem
  display: flex
  justify-content: space-between
  align-items: center
  p
    font-size: 1.6rem
    margin: 0

.cart-group
  position: relative
  padding: 2rem
  background: #ffffffcc
  backdrop-filter: blur(2px)
  -webkit-backdrop-filter: blur(2px)
  border: 1px solid #ececec
  border-radius: .75rem
  box-shadow: 0 1px 4px rgba(0,0,0,0.04)

.back
  display: flex
  align-items: center
  gap: .5rem
  cursor: pointer
  color: black
  font-weight: 300
  padding: 2rem 0
  background: none
  border: none
  font-size: 1.5rem
  ::v-deep(.back__img)
    width: 1.5rem
    height: 1.5rem
    transition: transform .2s ease
    transform: rotate(180deg)
  &:hover
    background-color: #f5f5f5
    color: black
    ::v-deep(.back__img)
      transform: rotate(180deg) translateX(5px) scale(1.2)

.cart-controls
  display: flex
  gap: 1rem

.btn__remove
  background: none
  border: 1px solid var(--third-color)
  border-radius: .5rem
  color: var(--third-color)
  font-size: 1.2rem
  cursor: pointer
  background-color: #fff
  &:hover
    background: var(--third-color)
    color: white

.fade-enter-active, .fade-leave-active
  transition: opacity .15s ease

.fade-enter-from, .fade-leave-to
  opacity: 0

@media (max-width: $small)
  .cart-item
    grid-template-columns: 7rem 1fr auto
    grid-template-areas: unquote('"img title remove" "img qty price" "img pgbtn pgbtn" "img pgpanel pgpanel" "img pgsum pgsum" "img linetotal linetotal"')
  .c-img
    width: 7rem
    height: 7rem

.c-title
  font-size: 1.6rem

.c-price
  font-size: 1.4rem
  font-weight: 900

.c-line-total
  font-size: 1.25rem
  b
    font-weight: 900

.cart-summary p
  font-size: 1.8rem

.cart-summary p strong
  font-weight: 900

.btn-checkout
  color: var(--primary)
  border-color: var(--primary)
  &:hover
    background-color: var(--primary)
    color: white
    border: 1px solid var(--primary)

:deep(.btn.btn-checkout)
  color: var(--primary)
  border: 1px solid var(--primary)
  background: #fff

:deep(.btn.btn-checkout:hover:enabled),
:deep(.btn.btn-checkout:focus-visible:enabled)
  background-color: var(--primary)
  color: #fff
  border-color: var(--primary)

:deep(.btn.back)
  background: transparent
  border-color: transparent
  color: black

:deep(.btn.back:hover:enabled),
:deep(.btn.back:focus-visible:enabled)
  background-color: transparent
  border-color: transparent
  color: black

@media (max-width: $small)
  .c-title
    font-size: 1.35rem
  .c-price
    font-size: 1.25rem
  .c-line-total
    font-size: 1.15rem
  .cart-summary p
    font-size: 1.5rem

.map-iframe
  border-radius: .5rem
  box-shadow: 0 0 1rem rgba(0,0,0,0.3)

.is-active
  background: var(--this)

@media (max-width: $small)
  .c-pg-btn
    width: 100%
    justify-content: center
    padding: .75rem 1rem
    font-size: 1.05rem
    box-shadow: 0 3px 10px rgba(0,0,0,.08)
  .c-pg-panel
    padding: .75rem
    border-radius: .6rem
  .pg-head
    display: none
  .pg-row
    grid-template-columns: 1fr auto
    grid-template-areas: unquote('"name sum" "unit unit" "price qty"')
    gap: .35rem .5rem
    padding: .6rem .25rem
    align-items: center
    border-bottom: 1px dashed #eef2f5
    > :nth-child(1)
      grid-area: name
      font-weight: 600
      line-height: 1.25
    > :nth-child(2)
      grid-area: unit
      opacity: .7
      font-size: .95rem
    > :nth-child(3)
      grid-area: price
      white-space: nowrap
      font-weight: 600
      font-size: 1rem
    > :nth-child(4)
      grid-area: qty
      justify-self: end
    > :nth-child(5)
      grid-area: sum
      justify-self: end
      font-weight: 800
      white-space: nowrap
  .pg-qty
    gap: .25rem
    > button
      width: 32px
      height: 32px
      border-radius: 8px
    > input
      width: 60px
      height: 32px
      font-size: 1rem
  .c-pg-total
    margin-top: .75rem
    font-size: 1.05rem
  .c-pg-panel .pg-row > :nth-child(5)
    font-size: 1.05rem

@media (max-width: $small)
  .pg-qty
    gap: .2rem
    > button
      width: 26px
      height: 26px
      min-width: 26px
      min-height: 26px
      padding: 0
      border-radius: 6px
      line-height: 24px
      font-size: 15px
    > input
      width: 52px
      height: 26px
      padding: 0 .4rem
      font-size: .95rem

@media (max-width: 360px)
  .pg-qty
    > button
      width: 24px
      height: 24px
      line-height: 22px
      font-size: 14px
    > input
      width: 48px
      height: 24px
      font-size: .9rem

:deep(.size)
  max-width: 100%
  min-width: 0

:deep(.size_group)
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(58px, 1fr))
  gap: .4rem
  max-width: 100%
  min-width: 0
  white-space: normal

:deep(.size_group button),
:deep(.size_group .btn)
  min-width: 58px
  flex: 0 0 auto

@media (max-width: $small)
  :deep(.size_group)
    grid-template-columns: repeat(auto-fit, minmax(54px, 1fr))
    gap: .35rem

/* стоппер переполнения у панели погонажа */
.c-pg-panel
  box-sizing: border-box
  width: 100% !important
  max-width: 100% !important
  min-width: 0 !important
  overflow-x: hidden !important

.c-pg-panel > *
  min-width: 0
  max-width: 100%

.cart-item > *
  min-width: 0

.pg-table
  width: 100%
  max-width: 100%
  overflow-x: hidden

.pg-row > *
  min-width: 0
  max-width: 100%
  overflow-wrap: anywhere
  white-space: normal

.txt
  display: flex
  justify-content: center
</style>
