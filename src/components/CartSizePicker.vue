<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: [Number, String, null], default: null },
  options: { type: Array, default: () => [60, 70, 80, 90] },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: "Размер" },
});
const emit = defineEmits(["update:modelValue", "change"]);

const value = computed({
  get: () => props.modelValue,
  set: (v) => {
    const n = v === null ? null : Number(v);
    emit("update:modelValue", n);
    emit("change", n);
  },
});
</script>

<template>
  <div class="size">
    <div class="size__label">{{ label }}</div>
    <div
      class="size__group"
      :class="{ 'size__group--disabled': disabled }"
      role="radiogroup"
      :aria-label="label"
    >
      <button
        v-for="opt in options"
        :key="opt"
        type="button"
        class="size__btn"
        :class="{
          'is-active': value !== null && Number(value) === Number(opt),
        }"
        :disabled="disabled"
        role="radio"
        :aria-checked="value !== null && Number(value) === Number(opt)"
        @click="value = opt"
      >
        {{ opt }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

.size
  display: grid
  gap: .5rem
  &__label
    font-size: .9rem
    color: #6b6b6b
  &__group
    display: inline-flex
    gap: .5rem
    &--disabled
      opacity: .5
      pointer-events: none
  &__btn
    min-width: 46px
    height: 26px
    border-radius: 6px
    padding: 0 .6rem
    border: 1px solid #dfe3e6
    background: #fff
    color: #7c8a97
    font-weight: 600
    cursor: pointer
    transition: .15s ease
    &:hover
      background: #f3f6f8
  .is-active
    background: var(--main-color)
    color: white
    border-color: var(--main-color)

.c-pg-panel
  ::v-deep(.size__label)
    font-size: 1.05rem
    font-weight: 700
  ::v-deep(.size__btn)
    font-size: 1rem
    min-width: 52px
    height: 32px
    border-radius: 8px

.pg-table
  font-size: 1.05rem

.pg-head
  font-size: 1.1rem
  font-weight: 800

.pg-row
  > div:first-child
    font-size: 1.1rem
    font-weight: 700
  > div:nth-child(3),
  > div:last-child
    font-size: 1.1rem
    font-weight: 800

.pg-qty
  > button
    font-size: 1.1rem
    width: 32px
    height: 32px
    border-radius: 8px
  > input
    font-size: 1.05rem
    width: 80px
    height: 32px
    border-radius: 8px

.c-pg-total
  font-size: 1.25rem
  b
    font-weight: 900

@media (max-width: $small)
  .pg-table
    font-size: 1rem
  .pg-head
    font-size: 1.05rem
  .pg-row > div:first-child
    font-size: 1.05rem
  .pg-qty > input
    width: 72px
</style>
