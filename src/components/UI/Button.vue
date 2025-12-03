<script setup>
const props = defineProps({
  disabled: { type: Boolean, default: false },
  type: { type: String, default: "button" },
});
const emit = defineEmits(["click"]);

function handleClick(e) {
  if (props.disabled) return;
  emit("click", e);
}
</script>

<template>
  <button class="btn" :type="type" :disabled="disabled" @click="handleClick">
    <slot />
  </button>
</template>

<style scoped lang="sass">
.btn
  border: none
  cursor: pointer
  text-decoration: none
  outline: none
  font-weight: 700
  font-size: 1.4rem
  color: var(--third-color)
  background: white
  border: .1rem solid var(--third-color)
  border-radius: .5rem
  padding: .65rem 1.52rem
  transition: all .3s ease

  &:hover:enabled
    color: white
    background: var(--third-color)
    position: relative

  &:disabled
    opacity: .5
    cursor: default
    pointer-events: none
</style>
