<script setup>
import { provide } from "vue";
import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import BackToTop from "./components/UI/BackToTop.vue";

const socialLinks = [
  {
    name: "telegram",
    href: "https://t.me/avto_lady_lena",
    src: new URL("./assets/img/icons/telegram.png", import.meta.url).href,
  },
  {
    name: "wa",
    href: "https://wa.me/79884068887?text=Здравствуйте",
    src: new URL("./assets/img/icons/wa.png", import.meta.url).href,
  },
  {
    name: "cart",
    href: "#",
    src: new URL("./assets/img/icons/cart.png", import.meta.url).href,
  },
];

provide("socialLinks", socialLinks);
</script>

<template>
  <div class="container">
    <Header />

    <div class="app-content">
      <RouterView />
    </div>

    <Footer />

    <BackToTop />
  </div>
</template>

<style lang="sass">
.app-content
  flex: 1
</style>
