import { authReady } from "./firebase.js";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { autoAnimatePlugin } from "@formkit/auto-animate/vue";
import "@/assets/css/main.sass";
import { createPinia } from "pinia";

(function () {
  window.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    { passive: false }
  );
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && ["=", "-", "+", "0"].includes(e.key)) e.preventDefault();
  });
})();

(async () => {
  try {
    await authReady;
    const app = createApp(App);
    app.use(router);
    app.use(createPinia());
    app.use(autoAnimatePlugin);
    app.mount("#app");
  } catch (err) {
    const pre = document.createElement("pre");
    pre.style.cssText =
      "white-space:pre-wrap;padding:16px;font:14px/1.4 system-ui";
    pre.textContent =
      "App init error: " + (err && err.message ? err.message : String(err));
    document.body.appendChild(pre);
  }
})();
