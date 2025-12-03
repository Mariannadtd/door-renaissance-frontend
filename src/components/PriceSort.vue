<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

const props = defineProps({ modelValue: { type: String, default: "" } });
const emit = defineEmits(["update:modelValue"]);

const options = [
  { label: "Сортировка по цене", value: "" },
  { label: "По цене ↑", value: "asc" },
  { label: "По цене ↓", value: "desc" },
];

const internalValue = ref(props.modelValue);
const isOpen = ref(false);
const dropdownRef = ref(null);

watch(
  () => props.modelValue,
  (v) => (internalValue.value = v)
);
watch(internalValue, (v) => emit("update:modelValue", v));

const currentLabel = computed(() => {
  const found = options.find((o) => o.value === internalValue.value);
  return found ? found.label : "Сортировка по цене";
});

function toggle() {
  isOpen.value = !isOpen.value;
}

function selectOption(opt) {
  internalValue.value = opt.value;
  isOpen.value = false;
}

function handleClickOutside(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() =>
  document.removeEventListener("click", handleClickOutside)
);
</script>

<template>
  <div class="price-sort" ref="dropdownRef">
    <button class="psd__toggle" @click="toggle()" type="button">
      {{ currentLabel }}
      <span class="psd__arrow">▾</span>
    </button>

    <ul v-if="isOpen" class="psd__menu">
      <li
        v-for="opt in options"
        :key="opt.value"
        @click="selectOption(opt)"
        :class="{ 'psd__option--active': internalValue === opt.value }"
        class="psd__option"
      >
        {{ opt.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="sass">
.price-sort
  position: relative
  display: inline-block

.psd__toggle
  padding: .7rem 1rem
  border: .1rem solid var(--third-color)
  border-radius: .5rem
  background: white
  cursor: pointer
  display: flex
  align-items: center
  justify-content: space-between
  min-width: 12rem
  font-size: 1.1rem
  font-family: "Gidole", sans-serif
  color: gray
  outline: none
  box-shadow: none

.psd__arrow
  margin-left: .5rem

.psd__menu
  position: absolute
  top: 100%
  left: 0
  margin-top: .4rem
  background: white
  border: .1rem solid var(--third-color)
  border-radius: .5rem
  box-shadow: 0 4px 12px rgba(0,0,0,.1)
  list-style: none
  padding: 0
  margin: 0
  z-index: 10
  width: 100%
  font-family: "Gidole", sans-serif
  font-size: 1.1rem

.psd__option
  padding: .7rem 1rem
  cursor: pointer
  color: gray
  font-family: "Gidole", sans-serif
  &:hover
    background: var(--third-color)
    color: white

.psd__option--active
  font-weight: bold
  background: rgba(0,0,0,.05)
  color: var(--third-color)
</style>
