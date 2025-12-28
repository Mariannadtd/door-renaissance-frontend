<script setup>
import { computed } from "vue";
import { useCartStore } from "../stores/cart";
import Button from "./UI/Button.vue";
import Badge from "./UI/Badge.vue";

const props = defineProps({
  image: { type: String, default: "" },
  title: { type: String, default: "" },
  price: { type: [String, Number], default: 0 },
  id: { type: String, required: true },
  isHit: { type: [String, Boolean], default: "" },
  isExhibit: { type: [String, Boolean], default: "" },
  category: { type: String, default: "" },
});

const cart = useCartStore();

const isInCart = computed(() =>
  cart.items.some((item) => item.id === props.id)
);

const isHitMark = computed(() => props.isHit === "да" || props.isHit === true);
const isExhibitMark = computed(
  () => props.isExhibit === "да" || props.isExhibit === true
);

function onAddToCart() {
  if (!isInCart.value) {
    cart.addToCart({
      id: props.id,
      name: props.title,
      price: Number(props.price),
      images: [props.image],
      quantity: 1,
      category: props.category || null,
    });
  }
}
</script>

<template>
  <div class="card" :data-id="id">
    <div class="card__badges">
      <Badge v-if="isInCart" variant="incart" title="Товар уже в корзине">
        В корзине
      </Badge>
      <Badge v-if="isHitMark" variant="hit" title="Хит продаж">Хит</Badge>
      <Badge
        v-if="isExhibitMark"
        variant="exhibit"
        title="Есть выставочный образец в салоне"
      >
        Есть в салоне
      </Badge>
    </div>

    <div class="card__content">
      <img :src="image" :alt="title" class="card__image" />
      <h3 class="card__title">{{ title }}</h3>
    </div>

    <div class="card__footer">
      <div class="card__info">
        <span class="card__label">Цена:</span>
        <span class="card__price">{{ price }} ₽</span>
      </div>

      <Button
        class="card__button"
        @click.stop.prevent="onAddToCart"
        :disabled="isInCart"
      >
        {{ isInCart ? "В корзине" : "В корзину" }}
      </Button>
    </div>

    <router-link
      class="card__overlay"
      :to="{ name: 'product-detail', params: { id } }"
      aria-label="Открыть страницу товара"
    />
  </div>
</template>

<style scoped lang="sass">
.card
  position: relative
  overflow: visible
  display: flex
  flex-direction: column
  align-items: center
  padding: 1rem
  background: #fff
  border: 1px solid rgba(0,0,0,.1)
  border-radius: .5rem
  box-shadow: 0 4px 12px rgba(0,0,0,.15)
  transition: box-shadow .3s, transform .25s ease, opacity .25s ease
  &:hover
    box-shadow: 0 6px 18px rgba(0,0,0,.28)

.card__overlay
  position: absolute
  inset: 0
  z-index: 1
  cursor: pointer
  display: block

.card__badges
  position: absolute
  top: .75rem
  right: calc(-1 * var(--badge-overhang, 1.2rem))
  display: flex
  flex-direction: column
  gap: .35rem
  align-items: flex-end
  z-index: 3

.card__content
  width: 100%

.card__image
  width: 100%
  height: 22rem
  object-fit: cover
  border-radius: .5rem

.card__title
  margin: 1rem 0 0
  font-size: 1.7rem
  font-weight: 700
  line-height: 1.2
  text-align: center
  min-height: calc(1.2em * 2)
  overflow: hidden

.card__footer
  display: flex
  flex-direction: column
  align-items: center
  margin-top: auto
  width: 100%
  gap: .5rem

.card__info
  display: flex
  align-items: baseline
  gap: .5rem

.card__label
  font-size: 1.2rem
  opacity: .6

.card__price
  font-size: 1.7rem
  font-weight: 700
  color: var(--main-color)

.card__button
  position: relative
  z-index: 4
  white-space: nowrap
  width: auto

.card__button[disabled]
  opacity: .5
  pointer-events: none
  cursor: default

@media (max-width: 576px)
  .card__badges
    right: calc(-1 * var(--badge-overhang, .4rem))
</style>
