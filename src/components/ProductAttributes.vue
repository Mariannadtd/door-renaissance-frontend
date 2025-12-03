<script setup>
import { computed } from "vue";

import { categoryFields, floorFormFields } from "../lib/catalogSchema.js";

const props = defineProps({
  product: { type: Object, required: false, default: null },
  items: { type: Array, required: false, default: () => [] },
  excludeKeys: { type: Array, required: false, default: () => [] },
  title: { type: String, required: false, default: "Характеристики" },
  showTitle: { type: Boolean, required: false, default: true },
});

function formatMoney(n) {
  if (n === undefined || n === null || n === "") return n;
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  return num.toLocaleString("ru-RU");
}

const fromSchemaItems = computed(() => {
  if (!props.product) return [];
  const p = props.product;
  const cat = p.category;
  const exclude = new Set(props.excludeKeys || []);

  const baseDefs =
    categoryFields && categoryFields[cat] ? categoryFields[cat] : [];

  let extraDefs = [];
  if (cat === "floors") {
    const f = p.form;
    if (f && floorFormFields && floorFormFields[f]) {
      extraDefs = floorFormFields[f];
    }
  }

  const defs = [...baseDefs, ...extraDefs];

  return defs
    .map((f) => {
      if (!f || !f.key || exclude.has(f.key)) return null;
      let v = p[f.key];

      if (Array.isArray(v)) v = v.join(", ");

      const isEmpty =
        v === undefined ||
        v === null ||
        v === "" ||
        (Array.isArray(v) && v.length === 0);
      if (isEmpty) return null;

      if (f.key === "packPrice" || f.key === "price") v = `${formatMoney(v)} ₽`;
      if (f.key === "weight") v = `${v} кг`;

      return { key: f.key, label: f.label || f.key, value: v };
    })
    .filter(Boolean);
});

const rows = computed(() =>
  props.items && props.items.length ? props.items : fromSchemaItems.value
);
const twoCols = computed(() => rows.value.length > 6);
</script>

<template>
  <section v-if="rows.length" class="attrs" :class="{ 'attrs--two': twoCols }">
    <h3 v-if="showTitle" class="attrs__title">{{ title }}</h3>
    <ul class="attrs__list">
      <li v-for="r in rows" :key="r.key" class="attrs__row">
        <span class="attrs__label">{{ r.label }}</span>
        <span class="attrs__value">{{ r.value }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

.attrs
  margin-top: 1rem

.attrs__title
  font-weight: 600
  margin-bottom: .75rem
  font-size: 1.5rem

.attrs__list
  display: grid
  grid-template-columns: 1fr
  gap: 0

.attrs.attrs--two .attrs__list
  grid-template-columns: 1fr 1fr
  column-gap: 1rem
  row-gap: 0

.attrs__row
  display: grid
  grid-template-columns: 1fr auto
  gap: .75rem
  padding: .5rem 0
  border: 0
  font-size: 1.2rem
  border-bottom: 1px solid rgba(0,0,0,.1)

.attrs__row:last-child
  border-bottom: none

.attrs__label
  opacity: .75

.attrs__value
  font-weight: 600
</style>
