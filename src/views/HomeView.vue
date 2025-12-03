<script setup>
import Slider from "../components/UI/Slider.vue";
import { onMounted, ref, computed } from "vue";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Button from "../components/UI/Button.vue";
import Catalog from "../components/Catalog.vue";
import Advantages from "../components/Advantages.vue";
import { useRouter } from "vue-router";
import Map from "../components/Map.vue";

const router = useRouter();
const products = ref([]);
const loading = ref(true);

function goTo(routeName) {
  router.push({ name: routeName }).catch(() => {});
}

const slides = [
  {
    src: new URL("../assets/img/nonestandard.png", import.meta.url).href,
    title: "Изготовим нестандартные двери по вашим размерам",
    desc: "",
  },
  {
    src: new URL("../assets/img/firstPhoto1.png", import.meta.url).href,
    title: "Закажи дверь и пол, не выходя из дома",
    desc: "",
  },
  {
    src: new URL("../assets/img/yamap.png", import.meta.url).href,
    title: "Приходи к нам в гости. г. Сочи, ул. Гагарина 63",
    desc: "",
  },
];

onMounted(async () => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    products.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (e) {
    console.error("Ошибка загрузки продуктов:", e);
  } finally {
    loading.value = false;
  }
});

const interiors = computed(() =>
  products.value.filter((p) => p.category === "interiors")
);
const exteriors = computed(() =>
  products.value.filter((p) => p.category === "exteriors")
);
const floors = computed(() =>
  products.value.filter((p) => p.category === "floors")
);
const fittings = computed(() =>
  products.value.filter((p) => p.category === "fittings")
);

function getRandomItems(arr, count) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

const interiorsRandom = computed(() =>
  getRandomItems(interiors.value, Math.min(6, interiors.value.length))
);
const exteriorsRandom = computed(() =>
  getRandomItems(exteriors.value, Math.min(6, exteriors.value.length))
);
const floorsRandom = computed(() =>
  getRandomItems(floors.value, Math.min(6, floors.value.length))
);
const fittingsRandom = computed(() =>
  getRandomItems(fittings.value, Math.min(6, fittings.value.length))
);
</script>

<template>
  <section class="home">
    <div class="home__slider">
      <Slider
        class="home__slider-inner"
        :slides="slides"
        :breakpoints="{ 0: 1 }"
        autoplay
        :interval="4000"
      />
    </div>
  </section>

  <section>
    <Catalog
      class="home__catalog"
      title="Межкомнатные двери"
      :products="interiorsRandom"
      :loading="loading"
    />
    <Button class="home__button" @click="goTo('interiors')">
      Показать ещё
      <img
        class="home__button_img"
        src="../assets/img/arrow-right.png"
        alt="arrow-right"
      />
    </Button>

    <Catalog
      class="home__catalog"
      title="Входные двери"
      :products="exteriorsRandom"
      :loading="loading"
    />
    <Button class="home__button" @click="goTo('exteriors')">
      Показать ещё
      <img
        class="home__button_img"
        src="../assets/img/arrow-right.png"
        alt="arrow-right"
      />
    </Button>

    <Catalog
      class="home__catalog"
      title="Напольные покрытия"
      :products="floorsRandom"
      :loading="loading"
    />
    <Button class="home__button" @click="goTo('floors')">
      Показать ещё
      <img
        class="home__button_img"
        src="../assets/img/arrow-right.png"
        alt="arrow-right"
      />
    </Button>

    <Catalog
      class="home__catalog"
      title="Фурнитура"
      :products="fittingsRandom"
      :loading="loading"
    />
    <Button class="home__button" @click="goTo('fittings')">
      Показать ещё
      <img
        class="home__button_img"
        src="../assets/img/arrow-right.png"
        alt="arrow-right"
      />
    </Button>
  </section>

  <Advantages />
  <Map />
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

.home__slider
  position: relative
  margin-top: 1rem
  background: #ffffffcc
  backdrop-filter: blur(2px)
  -webkit-backdrop-filter: blur(2px)
  border-radius: .75rem
  box-shadow: 0 1px 4px rgba(0,0,0,0.04)
  max-width: 1530px

.home__slider-inner
  position: relative
  z-index: 1
  width: 100%

.home
  &__button
    font-size: 1.4rem
    display: flex
    align-items: center
    margin: 3.5rem auto 2rem
    color: white
    background-color: var(--third-color)
    transition: transform 0.5s ease
    &:hover
      .home__button_img
        transform: translateX(5px) scale(1.2)
    &_img
      filter: invert(1) brightness(1.5)
      margin-left: 1rem
      width: 2rem
      height: 2rem

.map
  padding: 4rem 0

:deep(.slider .slide)
  flex: 0 0 auto
  position: relative
  height: 30rem
  background-size: cover
  background-repeat: no-repeat
  background-position: center
  border-radius: .75rem
  overflow: hidden
  :nth-child(2)
    padding: 10rem 1rem 0 1rem

:deep(.slider .slide__title)
  display: inline-block
  color: #000
  font-size: 4.7rem
  font-weight: 700
  font-family: "EB Garamond", serif
  font-style: italic
  line-height: 1.4
  text-decoration-line: underline
  text-decoration-color: var(--this)
  text-decoration-thickness: 1rem
  text-underline-offset: -.5rem
  text-decoration-skip-ink: none

@media (max-width: $small)
  :deep(.slider .slide__title)
    font-size: 2.7rem !important
    background-color: rgba(255,255,255,0.1)
    backdrop-filter: blur(6px)
    -webkit-backdrop-filter: blur(6px)
    text-shadow: 0 0 10px rgba(255,255,255,0.9)
    border-radius: .5rem
    padding-left: 1rem
    width: 90%

:deep(.slider .slide__caption)
  position: absolute
  top: -2rem
  left: 16rem
  color: black
  font-size: 2rem
  width: 68rem
  padding: 0.5rem 1rem
  border-radius: 0.25rem
  @media (max-width: $xx-large)
    left: 6rem
    width: 56rem
    font-size: 1.8rem
  @media (max-width: $x-large)
    left: 2rem
    width: 45rem
    font-size: 1.5rem !important
  @media (max-width: $small)
    top: 10rem
    width: 100% !important
    padding: 1rem

:deep(.slider .slide__img)
  height: 35rem
  object-fit: cover
  float: right

:deep(.slider .nav)
  display: none !important

.skeleton-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))
  gap: 1rem
</style>
