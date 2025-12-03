<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from "vue";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

import Catalog from "../components/Catalog.vue";
import Search from "../components/Search.vue";
import Filter from "../components/UI/Filter.vue";
import Button from "../components/UI/Button.vue";
import SkeletonCard from "../components/UI/Preloader.vue";

const products = ref([]);
const searchQuery = ref("");
const loading = ref(true);

const controlsKey = ref(0);
const filterKey = ref(0);
const searchKey = ref(0);

const filterState = ref({
  sort: "",
  form: "",
  side: "",
  latch: "",
  thermalbreak: "",
});

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
  const snap = await getDocs(collection(db, "products"));
  products.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  loading.value = false;
});

const exteriors = computed(() =>
  products.value.filter((p) => p.category === "exteriors")
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
    key: "form",
    label: "Вид",
    type: "select",
    options: ["с ковкой", "с ковкой / остеклением", "с зеркалом"],
  },
  {
    key: "side",
    label: "Сторона открывания",
    type: "select",
    options: ["правая", "левая", "и правая и левая"],
  },
  {
    key: "latch",
    label: "Ночная задвижка",
    type: "select",
    options: ["есть", "нет"],
  },
  {
    key: "thermalbreak",
    label: "Терморазрыв",
    type: "select",
    options: ["да", "нет"],
  },
];

const filtersConfig = [sortFilter, ...baseFilters];

const processed = computed(() => {
  let arr = exteriors.value;

  const q = norm(searchQuery.value);
  if (q) arr = arr.filter((p) => norm(p.name).includes(q));

  const { sort, ...rest } = filterState.value;
  for (const key of Object.keys(rest)) {
    const val = norm(rest[key]);
    if (val) arr = arr.filter((p) => norm(p[key]) === val);
  }

  if (filterState.value.sort === "asc") {
    arr = [...arr].sort((a, b) => a.price - b.price);
  } else if (filterState.value.sort === "desc") {
    arr = [...arr].sort((a, b) => b.price - a.price);
  }

  return arr;
});

const showNoResults = ref(false);
let resetTimerId = null;

watch(
  () => ({
    len: processed.value.length,
    st: { ...filterState.value },
    q: searchQuery.value,
  }),
  ({ len, st, q }) => {
    const hasAny = !!norm(q) || Object.values(st).some((v) => !!norm(v));
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

const resetFilters = () => {
  searchQuery.value = "";
  filterState.value = {
    sort: "",
    form: "",
    side: "",
    latch: "",
    thermalbreak: "",
  };
  controlsKey.value++;
  filterKey.value++;
  searchKey.value++;
};
</script>

<template>
  <Catalog
    title="Входные двери"
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

.no-results
  text-align: center
  margin: 1rem auto 2rem
  font-size: 1.05rem
  font-weight: 500
  color: #b00

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
</style>
