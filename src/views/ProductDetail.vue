<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useCartStore } from "../stores/cart";
import Button from "../components/UI/Button.vue";
import ProductAttributes from "../components/ProductAttributes.vue";
import Badge from "../components/UI/Badge.vue";

const route = useRoute();
const router = useRouter();
const cart = useCartStore();

const id = route.params.id;
const product = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) throw new Error("Товар не найден");
    product.value = { id: snap.id, ...snap.data() };
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

const images = computed(() => product.value?.images || []);

const isInCart = computed(() => cart.items.some((it) => it.id === id));
const isHitMark = computed(
  () =>
    product.value &&
    (product.value.isHit === "да" || product.value.isHit === true)
);
const isExhibitMark = computed(
  () =>
    product.value &&
    (product.value.isExhibit === "да" || product.value.isExhibit === true)
);

function onAddToCart() {
  cart.addToCart(product.value);
  router.push({ name: "cart" });
}

const currentIdx = ref(0);
const showModal = ref(false);
function open(i) {
  currentIdx.value = i;
  showModal.value = true;
}
function close() {
  showModal.value = false;
}
function next() {
  currentIdx.value = (currentIdx.value + 1) % images.value.length;
}
function prev() {
  currentIdx.value =
    (currentIdx.value - 1 + images.value.length) % images.value.length;
}
</script>

<template>
  <section class="product-detail">
    <div v-if="loading" class="loader">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content">
      <Button @click="router.back()" class="back">
        <img src="../assets/img/arrow-right.png" alt="" class="back__img" />
        Назад
      </Button>

      <div class="content__wrapper">
        <div class="gallery">
          <img
            v-if="images.length"
            :src="images[0]"
            class="main-img"
            @click="open(0)"
            alt=""
          />
          <div class="thumbs">
            <img
              v-for="(src, i) in images"
              :key="i"
              :src="src"
              class="thumb-img"
              @click="open(i)"
              alt=""
            />
          </div>
        </div>

        <div class="info">
          <div class="pd-badges">
            <Badge v-if="isInCart" variant="incart" title="Товар уже в корзине"
              >В корзине</Badge
            >
            <Badge v-if="isHitMark" variant="hit" title="Хит продаж">Хит</Badge>
            <Badge
              v-if="isExhibitMark"
              variant="exhibit"
              title="Есть выставочный образец в салоне"
            >
              Есть в салоне
            </Badge>
          </div>

          <h1 class="title">{{ product.name }}</h1>
          <p class="cat">Категория: {{ product.category }}</p>
          <ProductAttributes :product="product" />
          <p class="desc">{{ product.description }}</p>
          <p class="price">Цена: {{ product.price }} ₽</p>

          <Button class="btn-add" @click="onAddToCart">В корзину</Button>
        </div>
      </div>
    </div>

    <teleport to="body">
      <div v-if="showModal" class="modal" @click.self="close">
        <button class="close" @click="close">
          <img src="../assets/img/close.png" alt="" />
        </button>
        <button class="nav prev" @click="prev">
          <img src="../assets/img/nav-arrow.png" alt="" />
        </button>
        <img :src="images[currentIdx]" class="modal-img" alt="" />
        <button class="nav next" @click="next">
          <img src="../assets/img/nav-arrow.png" alt="" />
        </button>
      </div>
    </teleport>
  </section>
</template>

<style scoped lang="sass">
@import "../assets/css/main.sass"

.title
  margin-bottom: 3rem !important
  margin-top: 0 !important
  padding: 0 !important
  text-align: start

.product-detail
  padding-top: 4rem
  @media (max-width: $small)
    padding: 2rem 0

.loader,
.error
  text-align: center
  font-size: 1.5rem
  margin: 2rem 0

.content
  display: flex
  justify-content: center
  gap: 3rem
  flex-wrap: wrap
  max-width: 1200px
  margin: 0 auto
  width: 100%
  box-sizing: border-box

  @media (max-width: $large)
    flex-direction: column
    align-items: center
    gap: 2rem

  @media (max-width: $small)
    align-items: center

  &__wrapper
    display: flex
    justify-content: center
    gap: 3rem

    @media (max-width: $small)
      display: flex
      flex-direction: column
      align-items: center
      gap: 1rem

    > .gallery,
    > .info
      flex: 0 0 calc(50% - 1.5rem)
      max-width: calc(50% - 1.5rem)
      min-width: 0
      box-sizing: border-box

      @media (max-width: $small)
        flex: none
        width: 100%
        max-width: 100%
        margin: 0 auto

.gallery
  flex: 1 1 45%
  max-height: 50vh

.main-frame
  position: relative
  width: 100%
  height: min(70vh, 48rem)
  overflow: hidden
  border-radius: .5rem
  background: #f7f7f7
  display: flex
  align-items: center
  justify-content: center
  cursor: zoom-in
  @media (max-width: $small)
    height: min(50vh, 28rem)

.main-img
  display: block
  max-width: 100%
  max-height: 100%
  object-fit: contain
  margin-left: auto

.thumbs
  display: flex
  flex-wrap: wrap
  gap: .5rem
  margin-top: .5rem
  justify-content: flex-end

.thumb-img
  width: 6rem
  height: 6rem
  object-fit: cover
  cursor: pointer
  border: 2px solid transparent
  border-radius: .25rem
  flex: 0 0 auto
  &:hover
    border-color: var(--third-color)

.info
  flex: 1 1 45%
  min-width: 280px
  max-width: 600px

  .cat
    color: gray
    margin-bottom: 1rem
    font-size: 1.2rem

  .desc
    line-height: 1.4
    margin-bottom: 1rem
    margin-top: 2rem
    font-size: 1.4rem

  .price
    font-weight: bold
    font-size: 1.8rem
    margin-top: 2rem

.modal
  position: fixed
  inset: 0
  display: flex
  align-items: center
  justify-content: center
  z-index: 10000
  opacity: 1
  background-color: rgba(0, 0, 0, 0)

  &::before
    content: ""
    position: absolute
    inset: 0
    background-color: rgba(0,0,0,0.8)
    z-index: 1

.modal-img
  position: relative
  z-index: 2
  max-width: 90vw
  max-height: 90vh
  object-fit: contain
  border-radius: .5rem
  opacity: 1

.nav.prev,
.nav.next
  position: absolute
  top: 50%
  border: none
  display: flex
  align-items: center
  justify-content: center
  cursor: pointer
  background-color: transparent !important
  box-shadow: none !important
  transform: translateY(-50%)
  padding: 1rem
  z-index: 2

  img
    filter: invert(1)
    width: 4rem
    height: 4rem

.nav.prev
  left: 1rem
  opacity: .5
  &:hover
    opacity: 1

.nav.next
  right: 1rem
  transform: rotate(180deg)
  opacity: .5
  &:hover
    opacity: 1

.close
  cursor: pointer
  background: transparent
  border: none
  padding: 0
  position: absolute
  top: 1rem
  right: 1rem
  z-index: 2

.close img
  display: block
  width: 5rem
  height: 5rem
  filter: brightness(0) invert(1)
  cursor: pointer

.back
  display: flex
  align-items: center
  gap: .5rem
  cursor: pointer
  color: black
  font-weight: 300
  background: none
  border: none
  font-size: 1.5rem
  &:hover
    background-color: transparent !important
    color: black !important

  @media (max-width: $large)
    width: 100%

  ::v-deep(.back__img)
    width: 1.5rem
    height: 1.5rem
    transition: transform .2s ease
    transform: rotate(180deg)

  &:hover
    color: black
    background-color: #f5f5f5
    border: none

    ::v-deep(.back__img)
      transform: rotate(180deg) translateX(5px) scale(1.2)

.btn-add
  margin-top: 2rem

.attributes
  margin-top: 2rem
  padding: 0
  list-style: none
  font-size: 1.2rem

.attributes li
  margin-bottom: 0.8rem
  display: flex
  gap: 0.5rem

.attributes strong
  width: 180px
  flex-shrink: 0
  font-weight: 600
  color: #000
  font-size: 1.2rem

.attrs__row
  font-size: 7rem

@media (max-width: 600px)
  .attributes li
    flex-direction: column
    gap: .25rem
  .attributes strong
    width: auto

.pd-badges
  display: flex
  flex-direction: column
  gap: .35rem
  align-items: flex-end
  margin-top: .75rem
  margin-right: calc(-1 * var(--badge-overhang, 1.2rem))

@media (max-width: $small)
  .pd-badges
    margin-right: calc(-1 * var(--badge-overhang, .4rem))
</style>
