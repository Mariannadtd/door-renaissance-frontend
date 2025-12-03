<script setup>
const advantages = [
  {
    src: new URL("../assets/img/delivery.png", import.meta.url).href,
    title: "Быстрая доставка",
  },
  {
    src: new URL("../assets/img/supply.png", import.meta.url).href,
    title: "Поставки напрямую от производителя",
  },
  {
    src: new URL("../assets/img/substandard.png", import.meta.url).href,
    title: "Изготовление нестандартных дверей",
  },
  {
    src: new URL("../assets/img/consultation.png", import.meta.url).href,
    title: "Бесплатный замер и консультация",
  },
  {
    src: new URL("../assets/img/shop.png", import.meta.url).href,
    title: "Салон с выставкой товаров",
  },
  {
    src: new URL("../assets/img/fabric.png", import.meta.url).href,
    title: "Качественные материалы",
  },
];
</script>

<template>
  <section class="advantages">
    <h1>Выбирая нас вы получаете:</h1>
    <ul>
      <li v-for="ad in advantages" :key="ad.title">
        <img :src="ad.src" alt="" />
        <p>{{ ad.title }}</p>
      </li>
    </ul>
  </section>
</template>

<style lang="sass" scoped>
@import "../assets/css/main.sass"

h1
  display: flex
  justify-content: center
.advantages
  padding-bottom: 2rem
  ul
    list-style: none
    margin: 0
    padding: 0
    display: flex
    flex-wrap: wrap
    align-content: center
    gap: 2rem

    @media (max-width: $x-large)
      gap: 1.5rem
      justify-content: center

    @media (max-width: $large)
      display: grid
      grid-template-columns: repeat(3, minmax(0, 1fr))
      gap: 1.25rem
      justify-items: stretch

    @media (max-width: $small)
      grid-template-columns: repeat(2, minmax(0, 1fr))

    li
      flex: 1
      max-width: calc((100% - 5 * 2rem) / 6)
      flex-direction: column
      align-items: center
      gap: 1.5rem
      padding: 2rem
      position: relative
      background: #ffffffcc
      backdrop-filter: blur(2px)
      -webkit-backdrop-filter: blur(2px)
      background-clip: padding-box
      border: 1px solid #ececec
      border-radius: .75rem
      box-shadow: 0 1px 4px rgba(0,0,0,0.04)
      overflow: hidden

      @media (max-width: $large)
        flex: none
        max-width: none
        width: 100%
        gap: 1rem
        padding: 1.25rem

      img
        width: 5rem
        height: 5rem
        object-fit: contain

      p
        margin: 0
        color: black
        font-size: 1.6rem
        opacity: 0.7
        text-align: center

  ul
    li:last-child
      img
        width: 4.2rem !important

.advantages ul li
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  text-align: center

.advantages ul li img
  display: block
  margin: 0 auto
  object-fit: contain
  width: 5rem
  height: 5rem

@media (max-width: $large)
  .advantages ul
    justify-items: center
</style>
