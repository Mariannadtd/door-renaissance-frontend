<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Button from "../components/UI/Button.vue";

const email = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push("/admin");
  } catch (err) {
    error.value = "Ошибка входа: " + err.message;
  }
};
</script>

<template>
  <div>
    <h1>Вход в админку</h1>
    <form @submit.prevent="login" class="form">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        required
        class="input"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Пароль"
        required
        class="input"
      />
      <Button type="submit">Войти</Button>
    </form>
    <p v-if="error" style="color: red">{{ error }}</p>
  </div>
</template>

<style scoped lang="sass">
h1
  display: flex
  justify-content: space-between
.form
  display: flex
  flex-direction: column
  align-items: center
  gap: 1rem

.input
  padding: 0.7rem 1.2rem
  border: 1px solid #ccc
  border-radius: 4px
</style>
