<script setup>
import { reactive, ref, computed, watch } from "vue";
import CartSizePicker from "./CartSizePicker.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  productName: { type: String, default: "" },
  initial: {
    type: Object,
    default: () => ({ size: 80, items: [], note: "" }),
  },
});
const emit = defineEmits(["close", "save"]);

const BASE = [
  { key: "box", name: "Дверная коробка", unit: "п.м.", price: 660, qty: 0 },
  { key: "dobor1", name: "Добор 100", unit: "п.м.", price: 490, qty: 0 },
  { key: "dobor2", name: "Добор 150", unit: "п.м.", price: 720, qty: 0 },
  { key: "dobor3", name: "Добор 200", unit: "п.м.", price: 960, qty: 0 },
  { key: "nal", name: "Наличник", unit: "п.м.", price: 370, qty: 0 },
  { key: "plint", name: "Плинтус МДФ", unit: "п.м.", price: 470, qty: 0 },
  { key: "plan", name: "Притворная планка", unit: "шт", price: 350, qty: 0 },
];

const size = ref(80);
const rows = reactive(BASE.map((r) => ({ ...r })));
const note = ref("");

watch(
  () => props.initial,
  (v) => {
    size.value = Number(v?.size ?? 80);
    note.value = v?.note ?? "";
    for (let i = 0; i < rows.length; i++)
      Object.assign(rows[i], { ...BASE[i] });
    (v?.items || []).forEach((s) => {
      const t = rows.find((r) => r.key === s.key);
      if (t) t.qty = Number(s.qty || 0);
    });
  },
  { immediate: true }
);

const total = computed(() =>
  rows.reduce((s, r) => s + Number(r.qty || 0) * Number(r.price || 0), 0)
);

function close() {
  emit("close");
}
function save() {
  emit("save", {
    size: Number(size.value),
    items: rows
      .filter((r) => Number(r.qty) > 0)
      .map((r) => ({
        key: r.key,
        name: r.name,
        unit: r.unit,
        price: r.price,
        qty: Number(r.qty),
      })),
    total: total.value,
    note: note.value,
  });
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="pm">
      <div class="pm__backdrop" @click="close"></div>
      <div class="pm__panel">
        <div class="pm__header">
          <div class="pm__title">
            Подобрать погонаж и размер
            <span v-if="productName" class="pm__subtitle"
              >— {{ productName }}</span
            >
          </div>
          <button class="pm__close" @click="close" aria-label="Закрыть">
            ×
          </button>
        </div>

        <div class="pm__block">
          <CartSizePicker v-model="size" :options="[60, 70, 80, 90]" />
        </div>

        <div class="pm__table">
          <div class="pm__row pm__row--head">
            <div>Позиция</div>
            <div>Ед.</div>
            <div>Цена</div>
            <div>Кол-во</div>
            <div>Сумма</div>
          </div>

          <div v-for="r in rows" :key="r.key" class="pm__row">
            <div>{{ r.name }}</div>
            <div>{{ r.unit }}</div>
            <div>{{ r.price }} ₽</div>
            <div class="pm__qty">
              <button @click="r.qty = Math.max(0, Number(r.qty || 0) - 1)">
                −
              </button>
              <input type="number" min="0" step="1" v-model.number="r.qty" />
              <button @click="r.qty = Number(r.qty || 0) + 1">+</button>
            </div>
            <div>
              {{
                (Number(r.qty || 0) * Number(r.price || 0)).toLocaleString(
                  "ru-RU"
                )
              }}
              ₽
            </div>
          </div>
        </div>

        <div class="pm__note">
          <label>Комментарий</label>
          <textarea
            v-model="note"
            rows="2"
            placeholder="Например: цвет добора как у полотна"
          ></textarea>
        </div>

        <div class="pm__footer">
          <div class="pm__total">
            Итого по погонажу: <b>{{ total.toLocaleString("ru-RU") }} ₽</b>
          </div>
          <div class="pm__actions">
            <button class="pm__btn pm__btn--ghost" @click="close">
              Отмена
            </button>
            <button class="pm__btn pm__btn--primary" @click="save">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="sass">
<style scoped lang="sass">
.fade-enter-active, .fade-leave-active
  transition: opacity .15s ease
.fade-enter-from, .fade-leave-to
  opacity: 0

.pm
  position: fixed
  inset: 0
  z-index: 2000
  &__backdrop
    position: absolute
    inset: 0
    background: rgba(0,0,0,.35)
    backdrop-filter: blur(2px)
  &__panel
    position: relative
    margin: 4vh auto
    width: min(920px, 94vw)
    background: #fff
    border-radius: 14px
    box-shadow: 0 10px 40px rgba(0,0,0,.15)
    padding: 12px 12px 16px
  &__header
    display: flex
    align-items: center
    justify-content: space-between
    padding: .25rem .25rem .75rem
    border-bottom: 1px solid #eef2f5
  &__title
    font-size: 1.4rem !important
    font-weight: 800 !important
  &__subtitle
    color: #7c8a97
    font-weight: 600
    font-size: 1.1rem
    margin-left: .25rem
  &__close
    font-size: 1.6rem
    width: 38px
    height: 38px
    border-radius: 10px
    border: 1px solid #e5e9ef
    background: #fff
    cursor: pointer
    &:hover
      background: #f6f8fb

  &__block
    padding: 1.2rem 0

  &__table
    display: grid
    gap: .75rem
    font-size: 1.2rem !important

  &__row
    display: grid
    grid-template-columns: 1.3fr 80px 140px 180px 160px
    align-items: center
    gap: .75rem
    padding: .75rem .5rem
    border-bottom: 1px dashed #eef2f5
    font-size: 1.2rem !important
    line-height: 1.35

  &__row--head
    color: #555
    font-weight: 900
    font-size: 1.25rem !important

  &__qty
    display: inline-flex
    align-items: center
    gap: .5rem
    > button
      width: 38px
      height: 38px
      font-size: 1.2rem
      border: 1px solid #dfe3e6
      border-radius: 10px
      background: #fff
      cursor: pointer
    > input
      width: 92px
      height: 38px
      border: 1px solid #dfe3e6
      border-radius: 10px
      padding: 0 .6rem
      font-size: 1.2rem
      text-align: center

  &__note
    margin-top: 1rem
    display: grid
    gap: .5rem
    > textarea
      border: 1px solid #e2e7ec
      border-radius: 10px
      padding: .7rem .8rem
      font-size: 1.1rem
      resize: vertical

  &__footer
    display: flex
    align-items: center
    justify-content: space-between
    padding-top: 1rem

  &__btn
    height: 42px
    padding: 0 1.1rem
    border-radius: 10px
    cursor: pointer
    font-size: 1.1rem
    font-weight: 700
    &--ghost
      background: #fff
      border: 1px solid #dde3ea
    &--primary
      background: #1f8bff
      color: #fff
      border: 1px solid #1f8bff

  &__total
    font-size: 1.35rem !important
    font-weight: 900 !important
    b
      font-weight: 900 !important

.pm :deep(.size__label)
  font-size: 1.25rem !important
  font-weight: 800 !important
.pm :deep(.size__btn)
  font-size: 1.15rem !important
  min-width: 64px !important
  height: 38px !important
  border-radius: 10px !important

@media (max-width: $small)
  .pm__panel
    padding: 10px
  .pm__row
    font-size: 1.05rem !important
    grid-template-columns: 1fr 64px 110px 150px 130px
  .pm__row--head
    font-size: 1.1rem !important
  .pm__qty > input
    width: 80px !important
  .pm__total
    font-size: 1.2rem !important
</style>
