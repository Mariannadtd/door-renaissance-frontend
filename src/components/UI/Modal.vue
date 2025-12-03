<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Button from "./Button.vue";

const emit = defineEmits(["close", "submit-order"]);
const closeIcon = new URL("../../assets/img/close.png", import.meta.url).href;

const nameValue = ref("");
const phoneValue = ref("");
const emailValue = ref("");

const touchedName = ref(false);
const touchedPhone = ref(false);
const touchedEmail = ref(false);
const submitted = ref(false);

const validName = computed(() =>
  /^[A-Za-zА-Яа-яЁё]{2,}(?: [A-Za-zА-Яа-яЁё]{2,})*$/.test(nameValue.value)
);
const validPhone = computed(() => /^\+?[0-9]{10,12}$/.test(phoneValue.value));
const validEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.value)
);
const formIsValid = computed(
  () =>
    validName.value &&
    validPhone.value &&
    (!emailValue.value || validEmail.value)
);

const honeypot = ref("");
const interacted = ref(false);
const timerReady = ref(false);
const minDelayMs = 1500 + Math.floor(Math.random() * 1500);

function markInteractedOnce() {
  interacted.value = true;
  window.removeEventListener("mousemove", markInteractedOnce);
  window.removeEventListener("keydown", markInteractedOnce);
  window.removeEventListener("pointerdown", markInteractedOnce);
  window.removeEventListener("scroll", markInteractedOnce);
  window.removeEventListener("touchstart", markInteractedOnce);
}

onMounted(() => {
  setTimeout(() => (timerReady.value = true), minDelayMs);
  window.addEventListener("mousemove", markInteractedOnce, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", markInteractedOnce, { once: true });
  window.addEventListener("pointerdown", markInteractedOnce, { once: true });
  window.addEventListener("scroll", markInteractedOnce, {
    once: true,
    passive: true,
  });
  window.addEventListener("touchstart", markInteractedOnce, {
    once: true,
    passive: true,
  });
});

onBeforeUnmount(() => {
  markInteractedOnce();
});

function handleSubmit() {
  touchedName.value = true;
  touchedPhone.value = true;
  touchedEmail.value = true;
  if (!formIsValid.value) return;
  if (honeypot.value) return;
  if (!timerReady.value || !interacted.value) return;

  emit("submit-order", {
    name: nameValue.value,
    phone: phoneValue.value,
    email: emailValue.value || null,
  });
  submitted.value = true;
  setTimeout(() => emit("close"), 3000);
}

function close() {
  emit("close");
}
</script>

<template>
  <div class="modal">
    <div class="modal-overlay" @click="close()"></div>
    <form class="modal-content" @submit.prevent="handleSubmit">
      <template v-if="!submitted">
        <div class="form__header">
          <h2>Оставьте данные для связи с менеджером</h2>
          <img class="close" :src="closeIcon" alt="close" @click="close()" />
        </div>

        <div class="input__container">
          <div class="hp">
            <label>Company</label>
            <input
              type="text"
              v-model="honeypot"
              autocomplete="organization"
              tabindex="-1"
              aria-hidden="true"
            />
          </div>

          <div class="field">
            <input
              type="text"
              v-model.trim="nameValue"
              placeholder="Введите Ваше имя"
              :class="{ invalid: touchedName && !validName }"
              @blur="touchedName = true"
              required
            />
            <p v-if="touchedName && !validName" class="error">
              Имя должно содержать не менее 2 букв, без цифр и символов
            </p>
          </div>

          <div class="field">
            <input
              type="tel"
              v-model.trim="phoneValue"
              placeholder="Ваш номер телефона"
              :class="{ invalid: touchedPhone && !validPhone }"
              @blur="touchedPhone = true"
              required
            />
            <p v-if="touchedPhone && !validPhone" class="error">
              Телефон: 10–12 цифр, можно с “+”
            </p>
          </div>

          <div class="field">
            <input
              type="email"
              v-model.trim="emailValue"
              placeholder="Ваш e-mail (необязательно)"
              :class="{ invalid: touchedEmail && emailValue && !validEmail }"
              @blur="touchedEmail = true"
            />
            <p v-if="touchedEmail && emailValue && !validEmail" class="error">
              Неверный формат e-mail
            </p>
          </div>
        </div>

        <div class="form__footer">
          <Button
            :disabled="!formIsValid || !timerReady || !interacted"
            @click="handleSubmit"
            >Отправить</Button
          >
        </div>
      </template>

      <template v-else>
        <div class="submitted">
          <h2>
            Спасибо, менеджер свяжется с вами в рабочее время в течение часа!
          </h2>
        </div>
      </template>
    </form>
  </div>
</template>

<style scoped lang="sass">
.modal
  position: fixed
  inset: 0
  display: flex
  align-items: center
  justify-content: center
  z-index: 10000
.modal-overlay
  position: absolute
  inset: 0
  background: rgba(0, 0, 0, 0.5)
.modal-content
  position: relative
  background: white
  padding: 2rem
  border-radius: .5rem
  max-width: 500px
  width: 100%
  z-index: 1
.form__header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 1rem
.close
  width: 1.5rem
  height: 1.5rem
  cursor: pointer
.input__container
  display: flex
  flex-direction: column
  gap: 1rem
  margin-bottom: 2rem
  margin-top: 2rem
.field
  display: flex
  flex-direction: column
  input
    padding: .7rem
    border: 1px solid #ccc
    border-radius: .5rem
    transition: border-color .2s
    outline: none
    &:focus
      outline: none
      border-color: var(--third-color) !important
    &.invalid
      border-color: red
  .error
    font-size: .85rem
    color: red
    margin-top: .25rem
.form__footer
  text-align: center
.submitted
  text-align: center
  h2
    margin: 0
.hp
  position: absolute
  left: -9999px
  width: 1px
  height: 1px
  overflow: hidden
</style>
