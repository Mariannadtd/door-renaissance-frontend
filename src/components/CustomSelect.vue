<template>
  <div class="custom-select" ref="root">
    <button class="cs__toggle" @click="isOpen = !isOpen">
      {{ currentLabel }}
      <span class="cs__arrow">▾</span>
    </button>
    <ul v-if="isOpen" class="cs__list">
      <li
        v-for="opt in options"
        :key="opt.value"
        @click="select(opt)"
        :class="{ 'cs__item--active': opt.value === value }"
        class="cs__item"
      >
        {{ opt.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { onClickOutside } from "@vueuse/core";

const props = defineProps({
  modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const options = [
  { label: "Нет", value: "" },
  { label: "По цене ↑", value: "asc" },
  { label: "По цене ↓", value: "desc" },
];

const value = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => (value.value = v)
);

const currentLabel = computed(() => {
  const opt = options.find((o) => o.value === value.value);
  return opt ? opt.label : "Сортировка по цене";
});

function select(opt) {
  value.value = opt.value;
  emit("update:modelValue", opt.value);
  isOpen.value = false;
}

const isOpen = ref(false);
const root = ref(null);
onClickOutside(root, () => (isOpen.value = false));
</script>

<style scoped lang="sass">
.custom-select
  position: relative
  display: inline-block

.cs__toggle
  padding: .7rem 1rem
  border: .1rem solid var(--main-third)
  border-radius: .5rem
  background: #fff
  cursor: pointer
  display: flex
  align-items: center
  justify-content: space-between
  min-width: 12rem

.cs__arrow
  margin-left: .5rem

.cs__list
  position: absolute
  top: 100%; left: 0
  margin-top: .3rem
  background: var(--white)
  border: .1rem solid var(--main-third)
  border-radius: .5rem
  box-shadow: 0 4px 12px rgba(0,0,0,.1)
  list-style: none
  padding: 0; margin: 0; z-index: 10

.cs__item
  padding: .7rem 1rem
  cursor: pointer
  &:hover
    background: var(--main-third)
    color: #fff
  &.cs__item--active
    font-weight: bold
    background: rgba(0,0,0,.05)
</style>
