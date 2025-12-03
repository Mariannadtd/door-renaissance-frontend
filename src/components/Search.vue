<script setup>
import { ref, watch, onBeforeUnmount } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  debounce: { type: Number, default: 3000 },
});
const emit = defineEmits(["update:modelValue"]);

const localValue = ref(props.modelValue);
let timer;

watch(
  () => props.modelValue,
  (v) => {
    if (v !== localValue.value) localValue.value = v;
  }
);

watch(localValue, (v) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    emit("update:modelValue", v);
  }, props.debounce);
});

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <input
    v-model="localValue"
    placeholder="Поиск товаров..."
    class="search__input"
    type="text"
  />
</template>

<style scoped lang="sass">
.search__input
  width: 40%
  padding: .6rem 1rem
  border: none
  border-radius: .5rem
  margin-right: 1rem

  &::placeholder
    font-size: 1.1rem
    font-family: "Gidole", sans-serif;
</style>
