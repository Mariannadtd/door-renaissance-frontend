import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { initCartCrossTabSync } from "./stores/cart-sync";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
initCartCrossTabSync(pinia);

app.mount("#app");
