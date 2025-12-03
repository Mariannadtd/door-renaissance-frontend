<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

import Catalog from "../components/Catalog.vue";
import Search from "../components/Search.vue";
import Filter from "../components/UI/Filter.vue";
import Button from "../components/UI/Button.vue";
import SkeletonCard from "../components/UI/Preloader.vue";

const colorOptions = [
  "хром",
  "никель",
  "матовый никель",
  "бронза",
  "латунь",
  "черный",
  "белый",
  "золото",
  "медь",
];

const fittingsGroups = [
  { value: "accessories", label: "Аксессуары для дверей" },
  { value: "locks", label: "Дверные замки и защелки" },
  { value: "hinges", label: "Дверные петли" },
  { value: "handles", label: "Дверные ручки" },
];
const fittingsGroupOptions = fittingsGroups.map((g) => g.label);

const fittingsSubtypesByGroup = {
  accessories: [
    "автопороги дверные",
    "доводчики",
    "ограничители",
    "фурнитура для дверей купе",
  ],
  locks: ["дверные замки", "задвижки", "защелки", "цилиндры"],
  hinges: [
    "петли накладные (бабочки)",
    "петли разъемные",
    "петли универсальные",
  ],
  handles: [
    "ручки на розетке",
    "ручки купе",
    "ручки с механизмом",
    "ручки стандарт",
  ],
};

const products = ref([]);
const searchQuery = ref("");
const loading = ref(true);

const controlsKey = ref(0);
const filterKey = ref(0);
const searchKey = ref(0);

const initialFilterState = () => ({
  sort: "",
  fittingGroup: "",
  fittingSubtype: "",
  color: "",
  lockType: "",
  latchMaterial: "",
  securityClass: "",
  backset: "",
  purpose: "",
  installType: "",
  latchType: "",
  size: "",
  keys: "",
  protection: [],
  side: "",
  bearing: "",
  baseShape: "",
  mechanism: "",
  centerDistance: "",
  rosette: "",
  set: "",
  rollersCount: "",
  mount: "",
  doorweight: "",
  closingSpeed: "",
  length: "",
});
const filterState = ref(initialFilterState());

const norm = (v) =>
  (v ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ё/g, "е")
    .trim();

onMounted(async () => {
  const started = Date.now();
  const snap = await getDocs(collection(db, "products"));
  products.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const MIN_SKELETON_MS = 500;
  const remain = Math.max(0, MIN_SKELETON_MS - (Date.now() - started));
  setTimeout(() => (loading.value = false), remain);
});

const fittings = computed(() =>
  products.value.filter((p) => p.category === "fittings")
);

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
    key: "fittingGroup",
    label: "Подвид",
    type: "select",
    options: fittingsGroupOptions,
  },
  {
    key: "color",
    label: "Цвет/отделка",
    type: "select",
    options: colorOptions,
  },
];

const subtypeOptions = computed(() => {
  const groupLabel = filterState.value.fittingGroup;
  const group = fittingsGroups.find((g) => g.label === groupLabel);
  return group ? fittingsSubtypesByGroup[group.value] || [] : [];
});

const filtersConfig = computed(() => {
  const conf = [sortFilter, ...baseFilters];
  if (filterState.value.fittingGroup) {
    conf.splice(2, 0, {
      key: "fittingSubtype",
      label: "Тип",
      type: "select",
      options: subtypeOptions.value,
    });
  }
  return conf;
});

const processed = computed(() => {
  let arr = fittings.value;

  const q = norm(searchQuery.value);
  if (q) arr = arr.filter((p) => norm(p.name).includes(q));

  const st = filterState.value;
  const simpleKeys = ["fittingGroup", "fittingSubtype", "color"];
  for (const key of simpleKeys) {
    const val = norm(st[key]);
    if (val) arr = arr.filter((p) => norm(p[key]) === val);
  }

  if (st.sort === "asc") arr = [...arr].sort((a, b) => a.price - b.price);
  else if (st.sort === "desc") arr = [...arr].sort((a, b) => b.price - a.price);

  return arr;
});

const resetFilters = () => {
  searchQuery.value = "";
  filterState.value = initialFilterState();
  controlsKey.value++;
  filterKey.value++;
  searchKey.value++;
};

const showNoResults = ref(false);
let resetTimerId = null;

watch(
  () => ({ len: processed.value.length, filters: { ...filterState.value } }),
  ({ len, filters }) => {
    const hasAny = Object.entries(filters).some(([k, v]) =>
      k === "sort" ? !!norm(v) : Array.isArray(v) ? v.length > 0 : !!norm(v)
    );
    showNoResults.value = len === 0 && hasAny;

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
  if (resetTimerId) clearTimeout(resetTimerId);
});
</script>

<template>
  <Catalog
    title="Фурнитура"
    :products="loading ? [] : processed"
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
  </Catalog>

  <div v-if="loading" class="skeleton-grid">
    <SkeletonCard v-for="n in 6" :key="n" />
  </div>

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

.btn-reset
  padding-top: 0.55rem
  padding-bottom: 0.55rem

@media (max-width: $large)
  .search-wrap
    max-width: 100%

  .filters-row
    grid-template-columns: 1fr
    justify-items: center

  .btn-reset
    grid-column: 1 / -1
    justify-self: center
    padding-top: 0.65rem
    padding-bottom: 0.65rem

.search-wrap
  width: 100%
  max-width: 520px

.search-wrap :deep(input)
  width: 100%

@media (max-width: 1200px)
  .filters-row
    grid-template-columns: 1fr
    justify-items: center
  .btn-reset
    grid-column: 1 / -1
    justify-self: center
    padding-top: 0.65rem
    padding-bottom: 0.65rem
</style>
