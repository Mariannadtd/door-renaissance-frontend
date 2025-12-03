<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const sentinel = ref(null);
const visible = ref(false);
let io;

onMounted(() => {
  io = new IntersectionObserver(
    ([entry]) => {
      visible.value = !entry.isIntersecting;
    },
    { root: null, threshold: 0 }
  );
  io.observe(sentinel.value);
});

onUnmounted(() => {
  io.disconnect();
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <div ref="sentinel" class="bt-sentinel"></div>

  <button
    class="back-to-top"
    :class="{ visible }"
    @click="scrollToTop"
    aria-label="Наверх"
  >
    <img src="../../assets/img/arrow-right.png" alt="Наверх" />
  </button>
</template>

<style scoped lang="sass">
.bt-sentinel
  position: absolute
  top: 300px
  left: 0
  width: 1px
  height: 1px
  pointer-events: none

.back-to-top
  all: unset
  position: fixed
  right: 1.5rem
  bottom: 1.5rem
  width: 3rem
  height: 3rem

  background: white
  border-radius: 50%
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2)

  display: flex
  align-items: center
  justify-content: center

  transform: translateY(150%)
  will-change: transform
  transition: transform .3s ease
  pointer-events: none
  cursor: pointer

  img
    width: 1.5rem
    height: 1.5rem
    transform: rotate(-90deg)

  &.visible
    transform: translateY(0)
    pointer-events: auto

  &:hover
    background: #f0f0f0
</style>
