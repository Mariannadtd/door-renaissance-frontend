<script setup>
import { ref } from "vue";
import Button from "./UI/Button.vue";
import Modal from "./UI/Modal.vue";
import SocialLinks from "./SocialLinks.vue";
import { RouterLink } from "vue-router";

const links = [
  { name: "Межкомнатные двери", href: "/interiors", class: "first__link" },
  { name: "Входные двери", href: "/exteriors", class: "second__link" },
  { name: "Напольные покрытия", href: "/floors", class: "first__link" },
  { name: "Фурнитура", href: "/fittings", class: "first__link" },
  { name: "О нас", href: "/about", class: "first__link" },
  { name: "Контакты", href: "/contacts", class: "first__link" },
  { name: "Главная", href: "/", class: "first__link" },
  { name: "Админ", href: "/login", class: "first__link" },
];

const showModal = ref(false);
const showNav = ref(false);

function handleClick() {
  showModal.value = true;
}
function toggleNav() {
  showNav.value = !showNav.value;
}
</script>

<template>
  <header v-auto-animate>
    <div class="header__top">
      <button
        :class="['burger', { open: showNav }]"
        @click="toggleNav"
        aria-label="Меню"
      >
        <span></span><span></span><span></span>
      </button>

      <a href="/" class="header__logo_group">
        <span class="header__logo_img" role="img" aria-label="Логотип"></span>
        <p class="header__logo">Дверной<br />Ренессанс</p>
      </a>

      <router-link to="/contacts" class="header__geo">
        <img src="../assets/img/geo.png" alt="Геолокация" />
        <span>Сочи, ул. Гагарина, 63<br />Ежедневно с 9:00 до 21:00</span>
      </router-link>

      <div class="header__call">
        <p>Вам перезвонить?</p>
        <Button @click="handleClick">+7 988 406-88-87</Button>
      </div>

      <SocialLinks />
    </div>

    <nav v-auto-animate :class="['nav-container', { nav__active: showNav }]">
      <ul class="nav">
        <li v-for="link in links" :key="link.name">
          <RouterLink
            :to="link.href"
            :class="link.class"
            exact-active-class="is-active"
            @click="showNav = false"
          >
            {{ link.name }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <Modal v-if="showModal" @close="showModal = false" />
  </header>
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

header
  position: relative
  padding: 0
  background-color: #fff
  margin-left:  calc(50% - 50vw)
  margin-right: calc(50% - 50vw)

  .header__top
    max-width: 1550px
    margin: 0 auto
    display: flex
    align-items: center
    justify-content: space-between
    gap: 1rem
    @media (max-width: $xx-large)
      padding-left: 2rem
      padding-right: 2rem

  .header__logo
    margin: 0
    line-height: 1.05
    font-family: 'EB Garamond', serif
    font-size: 1.5rem
    font-weight: 800
    text-transform: uppercase
    color: var(--third-color)
    display: flex
    align-items: center
    @media (max-width: $small)
      font-size: 1.2rem

  .header__logo_group
    display: flex
    flex-direction: row
    align-items: center
    gap: .4rem
    text-decoration: none
    margin: 0
    padding: 0
    margin-inline-start: -1rem

  .header__logo_img
    width: 7rem
    height: 7rem
    display: block
    background-color: var(--third-color)
    -webkit-mask-image: url("../assets/img/lg2.png")
    mask-image: url("../assets/img/lg2.png")
    -webkit-mask-repeat: no-repeat
    mask-repeat: no-repeat
    -webkit-mask-position: center
    mask-position: center
    -webkit-mask-size: contain
    mask-size: contain
    margin: 0
    padding: 0

  .header__geo
    display: flex
    align-items: center
    gap: 1rem
    font-size: 1.2rem
    @media (max-width: $small)
      display: none
    img
      width: 2.5rem

  .header__call
    display: flex
    align-items: baseline
    gap: 1rem
    p
      font-size: 1.4rem
      @media (max-width: $small)
        font-size: 1rem

nav.nav-container
  position: relative
  z-index: 1
  margin-left:  calc(50% - 50vw)
  margin-right: calc(50% - 50vw)
  background: white
  border-top:    1px solid var(--second-color)
  border-bottom: 1px solid var(--second-color)
  padding:       1.5rem 3rem
  box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.20)

  .nav
    max-width: 1530px !important
    font-family: 'EB Garamond', serif
    margin: 0 auto
    display: flex
    justify-content: space-between
    list-style: none

    li a
      font-size:      1.5rem
      text-transform: uppercase
      font-weight:    bold
      color:          #000
      transition:     color .3s
      @media (max-width: $large)
        font-size: 2rem
      &:hover,
      &.is-active
        color: var(--third-color)

.burger
  display: none
  background: none
  border: none
  cursor: pointer
  flex-direction: column
  gap: 4px
  padding: 10px
  margin-left: -10px
  margin-right: -10px

  span
    display: block
    width: 20px
    height: 2px
    background: #000
    transition: transform .3s ease, opacity .3s ease
    transform-origin: center

.burger.open span:nth-child(1)
  transform: translateY(6px) rotate(45deg)

.burger.open span:nth-child(2)
  opacity: 0

.burger.open span:nth-child(3)
  transform: translateY(-6px) rotate(-45deg)

@media (max-width: $large)
  .burger
    display: flex

  header
    z-index: 10
    position: relative
    border-bottom: 1px solid var(--second-color)
    box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.20)

  nav.nav-container
    display: none

  nav.nav-container.nav__active
    display: block
    position: absolute
    top: calc(100%)
    left: 0
    right: 0
    background: white
    z-index: 100
    padding: 2rem 0
    .nav
      flex-direction: column
      align-items: center
      gap: 1rem

  .header__call p
    display: none


@media (max-width: $small)
  .header__logo_group
    display: flex !important
    gap: 0 !important
  .header__logo_group > .header__logo
    margin-left: -0.5rem !important
    line-height: 1.05
  .header__logo_group > .header__logo_img
    margin-right: -0.5rem !important
  .header__logo
    margin-right: 0 !important
  header .header__top
    gap: .6rem !important
    padding-left: 1.5rem
    padding-right: 1.5rem
</style>
