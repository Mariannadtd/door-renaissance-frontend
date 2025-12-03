<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="card__badges" style="visibility: hidden">
      <span class="badge -incart"></span>
      <span class="badge -hit"></span>
      <span class="badge -exhibit"></span>
    </div>

    <div class="thumb skeleton"></div>

    <div class="title">
      <div class="line skeleton"></div>
      <div class="line skeleton short"></div>
    </div>

    <div class="footer">
      <div class="price">
        <div class="line skeleton"></div>
        <div class="line skeleton short"></div>
      </div>
      <div class="btn skeleton"></div>
    </div>
  </div>
</template>

<script setup></script>

<style lang="sass" scoped>
.skeleton-card
  position: relative
  display: flex
  flex-direction: column
  align-items: center
  padding: 1rem
  border-radius: .5rem
  background: #fff
  border: 1px solid rgba(0,0,0,.1)
  box-shadow: 0 4px 12px rgba(0,0,0,.15)
  box-sizing: border-box
  overflow: hidden
  min-height: 100%

  @media (max-width: 576px)
    padding: 1rem
    border-radius: .6rem

.card__badges
  position: absolute
  top: .75rem
  right: .75rem
  display: flex
  flex-direction: column
  gap: .35rem
  z-index: 2

.thumb
  width: 100%
  height: 22rem
  border-radius: .5rem
  margin-bottom: 1rem

  @media (max-width: 576px)
    border-radius: .5rem

.title
  margin-bottom: 1rem

.footer
  margin-top: auto
  display: flex
  align-items: center
  justify-content: space-between
  gap: .75rem

  @media (max-width: 576px)
    flex-direction: column
    align-items: stretch
    gap: .5rem

.price
  display: flex
  flex-direction: column
  gap: .4rem
  flex: 1 1 auto

.skeleton
  position: relative
  overflow: hidden
  background: #e4e5ea
  background-image: linear-gradient(90deg, #e4e5ea 0, #f3f3f7 50%, #e4e5ea 100%)
  background-size: 200% 100%
  animation: shimmer 1.5s linear infinite

.line
  height: .8rem
  border-radius: .35rem
  width: 100%

.line.short
  width: 60%

.btn
  flex: 0 0 auto
  height: 2.7rem
  width: 8rem
  border-radius: .5rem

  @media (max-width: 576px)
    width: 100%

@keyframes shimmer
  0%
    background-position: -200% 0
  100%
    background-position: 200% 0
</style>
