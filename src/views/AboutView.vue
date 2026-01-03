<script setup>
import Slider from "../components/UI/Slider.vue";

const topSlides = [
  {
    src: "https://res.cloudinary.com/dvhggrc3x/image/upload/f_auto,q_auto,dpr_auto,w_2000/IMG_3073_lxdayb.jpg",
    title: "",
    desc: "",
  },
  {
    src: "https://res.cloudinary.com/dvhggrc3x/image/upload/f_auto,q_auto,dpr_auto,w_2000/photo2_qlzoia.jpg",
    title: "",
    desc: "",
  },
  {
    src: "https://res.cloudinary.com/dvhggrc3x/image/upload/f_auto,q_auto,dpr_auto,w_2000/photo4_oymsfl.jpg",
    title: "",
    desc: "",
  },
];
</script>

<template>
  <section>
    <h1 class="page-title">О компании</h1>

    <div class="about-top">
      <div class="slider-wrapper top-slider">
        <Slider
          :slides="topSlides"
          :breakpoints="{ 0: 1, 768: 1, 1024: 1 }"
          autoplay
          :interval="4000"
        />
      </div>

      <div class="text">
        <p>
          Приветствуем вас! Мы — Оксана и Елена, основательницы компании
          <strong>«Дверной Ренессанс»</strong>. Наш магазин вырос из общего
          дела, любви к интерьеру и желания создавать пространство, где красота
          встречается с надёжностью.
        </p>
        <p>
          Наша цель — не просто продать двери и отделочные материалы, а стать
          вашим надёжным партнёром на пути к дому, в котором приятно жить. Мы
          помогаем воплощать задумки в реальность, подбираем решения под стиль,
          бюджет и пространство.
        </p>
        <p>
          За нашими плечами — годы работы в сфере дизайна и продаж. Мы прошли
          путь от найма до создания собственной компании, и сегодня открыли
          салон в Сочи, дополнив его онлайн-магазином. Доверьтесь нашему опыту —
          с нами ваш интерьер будет продуман до мелочей.
        </p>
        <p>
          Заказывайте двери, напольные покрытия и фурнитуру онлайн или
          приезжайте в наш шоу-рум — будем рады познакомиться лично и помочь с
          выбором.
        </p>
        <p>
          По всем вопросам звоните по телефону
          <a href="tel:+79884068887">+7 (988) 406-88-87</a> или пишите нам в
          <a href="https://wa.me/79884068887" target="_blank">WhatsApp</a> — мы
          всегда на связи.
        </p>
      </div>
    </div>

    <div class="video-wrapper">
      <video class="video" controls preload="metadata" playsinline>
        <source
          src="https://res.cloudinary.com/dvhggrc3x/video/upload/7_xia9vh.mp4"
          type="video/mp4"
        />
        Ваш браузер не поддерживает видео.
      </video>

      <video class="video" controls preload="metadata" playsinline>
        <source
          src="https://res.cloudinary.com/dvhggrc3x/video/upload/4_t3faly.mp4"
          type="video/mp4"
        />
        Ваш браузер не поддерживает видео.
      </video>
    </div>
  </section>
</template>

<style scoped lang="sass">
.page-title
  display: flex
  justify-content: center
  align-items: center
  width: 100%
  text-align: center

.about-top
  display: flex
  gap: 2rem
  align-items: center
  margin: 0 auto
  max-width: 1200px

.top-slider
  flex: 1
  max-width: 500px
  display: flex
  justify-content: center

.text
  flex: 1
  font-size: 1.6rem
  text-align: left
  display: flex
  flex-direction: column
  justify-content: center
  gap: 1rem

  position: relative
  padding: 2rem
  background: #ffffffcc
  backdrop-filter: blur(2px)
  -webkit-backdrop-filter: blur(2px)
  border: 1px solid #ececec
  border-radius: .75rem
  box-shadow: 0 1px 4px rgba(0,0,0,0.04)

.slider-wrapper
  margin: 2rem auto
  max-width: 1200px

.top-slider.slider-wrapper
  margin: 0

::v-deep .slider .track
  display: flex
  transition: transform .5s ease

::v-deep .slider .slide
  padding: 0
  box-sizing: border-box
  display: flex
  justify-content: center

::v-deep .slide__img
  width: auto
  max-width: 100%
  height: auto
  max-height: 60rem
  object-fit: contain
  margin: 0 auto

.about-top + .video-wrapper
  margin-top: 2.5rem

.video-wrapper
  display: flex
  justify-content: center
  align-items: flex-start
  gap: 2rem
  margin: 2rem auto
  max-width: 1200px

.video
  width: 100%
  max-width: 400px
  height: 600px
  border: none
  border-radius: 8px
  box-shadow: 0 2px 10px rgba(0,0,0,0.2)

@media (max-width: 900px)
  .about-top
    flex-direction: column
    align-items: center
  .top-slider
    max-width: 100%
  .top-slider ::v-deep .slide__img
    max-height: 40rem
  .video-wrapper
    flex-direction: column
    align-items: center
  .video
    max-width: 100%
    height: 500px

::v-deep .slider .slide
  border-radius: .75rem
  overflow: hidden

::v-deep .slide__img
  border-radius: .75rem
  box-shadow: 0 2px 10px rgba(0,0,0,0.2)
  display: block
</style>
