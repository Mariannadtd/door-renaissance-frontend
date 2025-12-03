<script setup>
const props = defineProps({
  variant: {
    type: String,
    required: true,
    validator: (v) => ["incart", "hit", "exhibit"].includes(v),
  },
  title: { type: String, default: "" },
  ariaLabel: { type: String, default: "" },
});
</script>

<template>
  <span
    class="badge"
    :class="`-${variant}`"
    :title="title || undefined"
    :aria-label="ariaLabel || undefined"
  >
    <slot />
  </span>
</template>

<style scoped lang="sass">
.badge
  --badge-width: 9.5rem
  display: inline-flex
  justify-content: center
  align-items: center
  width: var(--badge-width)
  min-height: 2.2rem
  padding: .35rem .6rem
  font-size: .85rem
  font-weight: 800
  line-height: 1.1
  text-align: center
  text-transform: uppercase
  letter-spacing: .02em
  color: #fff  /* белый текст у всех */
  border-radius: 0
  box-shadow: 0 1px 3px rgba(0,0,0,.15)
  user-select: none

  &.-incart
    background: var(--main-color, #003ADC)

  &.-hit
    background: var(--third-color, #C0392B)

  &.-exhibit
    background: var(--this, #D2AA2D)

@media (max-width: 480px)
  .badge
    --badge-width: 8.2rem
    min-height: 2rem
    font-size: .8rem
</style>
