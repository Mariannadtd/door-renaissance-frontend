<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from "vue";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../firebase";

import Catalog from "../components/Catalog.vue";
import Search from "../components/Search.vue";
import Filter from "../components/UI/Filter.vue";
import Button from "../components/UI/Button.vue";
import SkeletonCard from "../components/UI/Preloader.vue";

const products = ref([]);
const searchQuery = ref("");
const loading = ref(true);

const loadingMore = ref(false);
const hasMore = ref(true);
const lastDoc = ref(null);

const PAGE = 40;

const bottomEl = ref(null);
let io = null;

const controlsKey = ref(0);
const filterKey = ref(0);
const searchKey = ref(0);

const defaultFilters = () => ({
  sort: "",
  form: "",
  structure: "",
  class: "",
  type: "",
  moistureresistance: "",
  substrate: "",
  installation: "",
  format: "",
  surface: [],
});

const filterState = ref(defaultFilters());

const norm = (v) =>
  (v ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ё/g, "е")
    .trim();

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;

  try {
    const base = [
      where("category", "==", "floors"),
      orderBy("createdAt", "desc"),
      limit(PAGE),
    ];

    const q = lastDoc.value
      ? query(
          collection(db, "products"),
          ...base.slice(0, 2),
          startAfter(lastDoc.value),
          base[2]
        )
      : query(collection(db, "products"), ...base);

    const snap = await getDocs(q);

    const batch = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    products.value.push(...batch);

    if (snap.docs.length) lastDoc.value = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < PAGE) hasMore.value = false;
  } catch (e) {
    console.error("floors loadMore error:", e);
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
  }
}

onMounted(async () => {
  await loadMore();
  loading.value = false;

  io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) loadMore();
    },
    { rootMargin: "900px" }
  );

  if (bottomEl.value) io.observe(bottomEl.value);
});

const sortFilter = {
  key: "sort",
  type: "sort",
  label: "Сортировка по цене",
  options: [
    { label: "Сортировка по цене", value: "" },
    { label: "По цене ↑", value: "asc" },
    { label: "По цене ↓", value: "desc" },
  ],
};

const baseFilters = [
  {
    key: "form",
    label: "Вид",
    type: "select",
    options: ["ламинат", "кварц винил"],
  },
  {
    key: "moistureresistance",
    label: "Влагостойкость",
    type: "select",
    options: ["да", "нет"],
  },
  {
    key: "substrate",
    label: "Встроенная подложка",
    type: "select",
    options: ["да", "нет"],
  },
  {
    key: "installation",
    label: "Монтаж",
    type: "select",
    options: ["Клеится на основание", "Плавающий, замок", "Замковый"],
  },
  {
    key: "format",
    label: "Формат",
    type: "select",
    options: ["Плитка ", "доска", "ёлочка"],
  },
  {
    key: "surface",
    label: "Поверхность",
    type: "multiselect",
    options: ["матовая", "глянцевая", "текстурная", "под дерево", "под камень"],
  },
];

const lamFilters = [
  {
    key: "class",
    label: "Класс износостойкости",
    type: "select",
    options: ["31", "32", "33", "34", "42", "43", "53"],
  },
  {
    key: "type",
    label: "Тип планки",
    type: "select",
    options: ["1-полосный", "2-полосный", "3-полосный", "Мультиполосный"],
  },
];

const quartzFilters = [
  {
    key: "structure",
    label: "Тип кварц-винила",
    type: "select",
    options: [
      "LVT(кварц винил)",
      "SPC(Каменно-полимерная плитка)",
      "WPC(древесно-полимерная плитка)",
    ],
  },
  {
    key: "class",
    label: "Класс износостойкости",
    type: "select",
    options: ["31", "32", "33", "34", "42", "43", "53"],
  },
];

const filtersConfig = computed(() => {
  const f = norm(filterState.value.form);
  if (f === "ламинат") return [sortFilter, ...baseFilters, ...lamFilters];
  if (f === "кварц винил")
    return [sortFilter, ...baseFilters, ...quartzFilters];
  return [sortFilter, ...baseFilters];
});

const processed = computed(() => {
  let arr = products.value;

  const q = norm(searchQuery.value);
  if (q) arr = arr.filter((p) => norm(p.name).includes(q));

  const st = filterState.value;
  const simple = [
    "form",
    "structure",
    "class",
    "type",
    "moistureresistance",
    "substrate",
    "installation",
    "format",
  ];
  for (const k of simple) {
    const v = norm(st[k]);
    if (v) arr = arr.filter((p) => norm(p[k]) === v);
  }

  if (Array.isArray(st.surface) && st.surface.length) {
    const selected = st.surface.map(norm);
    arr = arr.filter((p) => {
      const item = Array.isArray(p.surface) ? p.surface.map(norm) : [];
      return selected.every((s) => item.includes(s));
    });
  }

  if (st.sort === "asc") arr = [...arr].sort((a, b) => a.price - b.price);
  else if (st.sort === "desc") arr = [...arr].sort((a, b) => b.price - a.price);

  return arr;
});

const showNoResults = ref(false);
let resetTimerId = null;

watch(
  () => ({
    len: processed.value.length,
    filters: { ...filterState.value },
    q: searchQuery.value,
  }),
  ({ len, filters, q }) => {
    const hasAnyFilter =
      !!norm(q) ||
      Object.entries(filters).some(([k, v]) =>
        Array.isArray(v) ? v.length > 0 : !!norm(v)
      );
    showNoResults.value = len === 0 && hasAnyFilter;

    if (showNoResults.value && !resetTimerId) {
      resetTimerId = setTimeout(() => {
        resetFilters();
        showNoResults.value = false;
        resetTimerId = null;
      }, 5000);
    }

    if (!showNoResults.value && resetTimerId) {
      clearTimeout(resetTimerId);
      resetTimerId = null;
    }
  },
  { immediate: true, deep: true }
);

onBeforeUnmount(() => {
  if (io) io.disconnect();
  if (resetTimerId) clearTimeout(resetTimerId);
});

const resetFilters = () => {
  searchQuery.value = "";
  filterState.value = defaultFilters();
  controlsKey.value++;
  filterKey.value++;
  searchKey.value++;
};
</script>

<template>
  <Catalog
    title="Напольные покрытия"
    :products="loading ? [] : processed"
    :loading="loading"
    title-margin="4rem auto 2rem"
  >
    <template #search>
      <div class="catalog-controls" :key="controlsKey">
        <div class="search-wrap">
          <Search :key="searchKey" v-model="searchQuery" :debounce="500" />
        </div>
        <div class="filters-row">
          <Filter
            :key="filterKey"
            v-model="filterState"
            :filters="filtersConfig"
          />
          <Button type="button" @click="resetFilters" class="btn-reset">
            Сбросить фильтры
          </Button>
        </div>
      </div>
    </template>

    <template #loading>
      <SkeletonCard v-for="n in 6" :key="n" />
    </template>
  </Catalog>

  <div v-if="loading" class="skeleton-grid">
    <SkeletonCard v-for="n in 6" :key="n" />
  </div>

  <div ref="bottomEl" style="height: 1px"></div>

  <p v-if="!loading && loadingMore" class="no-results">Загружаю ещё…</p>
  <p v-else-if="!loading && !hasMore && products.length" class="no-results">
    Больше товаров нет
  </p>

  <p v-if="!loading && showNoResults" class="no-results">
    Товары с выбранными фильтрами отсутствуют!
  </p>
  <p v-else-if="!loading && !processed.length" class="no-results">
    Ничего не найдено<span v-if="searchQuery"> «{{ searchQuery }}»</span>.
  </p>
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

.catalog-controls
  display: flex
  flex-direction: column
  align-items: center
  gap: .75rem
  margin-bottom: 2rem

.search-wrap
  width: 100%
  max-width: 520px

.search-wrap :deep(input)
  width: 100%

.filters-row
  width: 100%
  display: grid
  grid-auto-rows: min-content
  grid-template-columns: repeat(auto-fit, minmax(160px, max-content))
  justify-content: center
  align-items: start
  gap: .5rem

.btn-reset
  padding-top: 0.55rem
  padding-bottom: 0.55rem

@media (max-width: 1200px)
  .filters-row
    grid-template-columns: 1fr
    justify-items: center

  .btn-reset
    grid-column: 1 / -1
    justify-self: center
    padding-top: 0.65rem
    padding-bottom: 0.65rem

.skeleton-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))
  gap: 1rem

.no-results
  text-align: center
  margin: 1rem auto 2rem
  font-size: 1.05rem
  font-weight: 500
  color: #b00
</style>
