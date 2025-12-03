<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import arrow from "../../assets/img/arrow-right.png";

const props = defineProps({
  slides: { type: Array, required: true },
  breakpoints: { type: Object, default: () => ({ 0: 1, 768: 2, 1024: 3 }) },
  autoplay: { type: Boolean, default: false },
  interval: { type: Number, default: 3000 },
});

const track = ref(null);
const current = ref(0);
let timer = null;
const perView = ref(1);

const fading = ref(false);
const FADE_MS = 1200;
const FADE_EASE = "ease-in-out";

function updatePerView() {
  const w = window.innerWidth;
  const points = Object.keys(props.breakpoints)
    .map(Number)
    .sort((a, b) => a - b);
  let vp = props.breakpoints[points[0]];
  for (const bp of points) if (w >= bp) vp = props.breakpoints[bp];
  perView.value = vp;
}

const trackStyle = computed(() => ({
  transform: `translateX(-${(100 / perView.value) * current.value}%)`,
}));

const trackFadeStyle = computed(() => ({
  opacity: fading.value ? 0 : 1,
  transition: `opacity ${FADE_MS}ms ${FADE_EASE}`,
  willChange: "opacity",
}));

const slideStyle = computed(() => ({
  flex: `0 0 ${100 / perView.value}%`,
}));

async function goTo(index) {
  if (index === current.value) return;
  fading.value = true;
  await new Promise((r) => setTimeout(r, 20));

  current.value = index;
  await nextTick();

  requestAnimationFrame(() => {
    fading.value = false;
  });
}

function nextSlide() {
  const max = props.slides.length - perView.value;
  const next = current.value < max ? current.value + 1 : 0;
  goTo(next);
}
function prevSlide() {
  const max = props.slides.length - perView.value;
  const prev = current.value > 0 ? current.value - 1 : max;
  goTo(prev);
}

function startAutoplay() {
  if (!props.autoplay) return;
  stopAutoplay();
  timer = setInterval(nextSlide, props.interval);
}
function stopAutoplay() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(() => {
  updatePerView();
  window.addEventListener("resize", updatePerView);
  startAutoplay();
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", updatePerView);
  stopAutoplay();
});
</script>

<template>
  <div class="slider">
    <button class="nav prev" @click="prevSlide">
      <img class="arrow" :src="arrow" alt="‹" />
    </button>

    <div class="viewport">
      <div
        class="track fade-mode"
        :style="[trackStyle, trackFadeStyle]"
        ref="track"
      >
        <div
          v-for="(slide, i) in slides"
          :key="i"
          class="slide"
          :style="slideStyle"
        >
          <img :src="slide.src" class="slide__img" />
          <div class="slide__caption">
            <h3 class="slide__title" :data-text="slide.title">
              {{ slide.title }}
            </h3>
            <p class="slide__desc">{{ slide.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <button class="nav next" @click="nextSlide">
      <img class="arrow next-arrow" :src="arrow" alt="›" />
    </button>
  </div>
</template>

<style scoped lang="sass">
@import "../../assets/css/main.sass"

.slider
  position: relative
  overflow: hidden

.viewport
  overflow: hidden

.track
  display: flex
  transition: transform .5s ease

.track.fade-mode
  transition: none

.nav
  position: absolute
  top: 43%
  transform: translateY(-50%)
  background: rgba(0,0,0,0.4)
  border: none
  padding: .5rem
  border-radius: 50%
  cursor: pointer
  z-index: 10
  display: flex
  align-items: center
  justify-content: center

.prev
  left: 1rem
  transform: rotate(180deg)

.next
  right: 1rem

.arrow
  width: 2rem
  height: auto
  user-select: none
  filter: brightness(0) invert(1)
</style>
