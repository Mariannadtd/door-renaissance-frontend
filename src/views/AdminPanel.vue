<template>
  <div class="admin-panel" v-if="allowed">
    <AddProductForm @created="reloadProducts" />
    <hr />
    <ProductsList ref="productsList" />
    <hr />
    <OrdersList />
    <Button class="logout" @click="logout">Выйти из админ-панели</Button>
  </div>

  <div v-else class="admin-panel">
    <p>Проверяем права доступа…</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase";
import { ensureAdminOrRedirect } from "@/utils/adminGate";
import Button from "../components/UI/Button.vue";

import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";

import AddProductForm from "@/components/admin/AddProductForm.vue";
import ProductsList from "@/components/admin/ProductsList.vue";
import OrdersList from "@/components/admin/OrdersList.vue";

const router = useRouter();
const allowed = ref(false);

onMounted(async () => {
  allowed.value = await ensureAdminOrRedirect(router);

  onAuthStateChanged(auth, async (u) => {
    console.log("[DEBUG] user:", u?.email, "uid:", u?.uid);
    if (!u) {
      console.warn("[DEBUG] НЕ авторизован");
      return;
    }
    const t = await getIdTokenResult(u, true);
    console.log("[DEBUG] claims:", t.claims);
  });
});

const productsList = ref(null);
function reloadProducts() {
  productsList.value?.reload?.();
}

async function logout() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Logout failed (signOut):", e);
  } finally {
    try {
      await router.replace({ path: "/" });
    } catch (navErr) {
      console.error("Logout navigation error:", navErr);
      window.location.href = "/";
    }
  }
}
</script>

<style lang="sass" scoped>
.admin-panel
  max-width: 1100px
  margin: 2rem auto
  padding: 1rem

.admin-topbar
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 1rem

.logout
  padding: .5rem .9rem
  border: 1px solid #ddd
  border-radius: 6px
  cursor: pointer

hr
  margin: 2rem 0

.logout
  display: block
  margin: 0 auto
  border: 1px solid var(--third-color)
  margin-top: 2rem
</style>
