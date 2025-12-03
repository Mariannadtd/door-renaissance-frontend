<template>
  <section class="contacts">
    <h1>Как нас найти?</h1>
    <div class="text">
      <p>
        Мы находимся по адресу:
        <span class="sub-text">г. Сочи, ул. Гагарина, д. 63.</span>
      </p>
      <p>
        Режим работы: <span class="sub-text">Пн-ВС с 9:00 до 21:00.</span> Без
        перерывов и выходных!
      </p>
    </div>

    <div class="map-wrapper">
      <iframe
        class="map-iframe"
        src="https://yandex.ru/map-widget/v1/?ll=39.730170%2C43.610221&mode=search&poi%5Bpoint%5D=39.729127%2C43.609734&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D213034152987&z=16.4"
        frameborder="0"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>
    </div>
  </section>
</template>

<style scoped lang="sass">
h1
  display: flex
  justify-content: center

.contacts
  h2
    font-size: 1.8rem
    margin-bottom: 1rem

.map-wrapper
  position: relative
  height: 39rem
  overflow: hidden
  border-radius: .75rem
  box-shadow: 0 0 1rem rgba(0,0,0,0.1)
  background: #fff

.map-iframe
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  border: 0

.map-credit
  position: absolute
  left: 0
  color: #eee
  font-size: 12px
  text-decoration: none
  z-index: 2

.text
  font-size: 1.6rem
  text-align: center
  max-width: 600px
  margin: 0 auto
  & p
    margin-bottom: 1rem

.sub-text
  font-size: 2rem
  font-weight: 700
</style>
