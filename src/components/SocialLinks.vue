<script setup>
import { inject, computed } from "vue";
import { useCartStore } from "../stores/cart";

const links = inject("socialLinks", []);
const cartStore = useCartStore();

const itemCount = computed(() => cartStore.totalCount);
</script>

<template>
  <ul class="social-links">
    <li
      v-for="link in links"
      :key="link.name"
      :class="{ 'is-cart': link.name === 'cart' }"
    >
      <router-link v-if="link.name === 'cart'" to="/cart" class="social-link">
        <img :src="link.src" :alt="link.name" />
        <span v-if="itemCount > 0" class="cart-badge">{{ itemCount }}</span>
      </router-link>

      <a
        v-else
        :href="link.href"
        target="_blank"
        rel="noopener"
        class="social-link"
      >
        <img :src="link.src" :alt="link.name" />
      </a>
    </li>
  </ul>
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

.social-links
  display: flex
  justify-content: center
  gap: 1.5rem
  list-style: none
  margin: 0
  padding: 0
  @media (max-width: $small)
    gap: .5rem

  li
    position: relative

    a
      display: block
      position: relative

    img
      width: 2.9rem
      height: 2.9rem
      transition: transform .2s ease
      &:hover
        transform: scale(1.25)

.cart-badge
  position: absolute
  top: -0.4rem
  right: -0.4rem
  min-width: 1.2rem
  height: 1.2rem
  padding: 0 .3rem
  background: var(--main-color)
  color: white
  font-size: .75rem
  font-weight: bold
  line-height: 1.2rem
  text-align: center
  border-radius: 50%
  box-shadow: 0 0 .2rem rgba(0,0,0,0.2)
</style>
