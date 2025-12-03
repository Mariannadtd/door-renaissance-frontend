import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../firebase";
const HomeView = () => import("../views/HomeView.vue");
const InteriorDoors = () => import("../views/InteriorDoors.vue");
const ExteriorDoors = () => import("../views/ExteriorDoors.vue");
const FloorsView = () => import("../views/FloorsView.vue");
const FittingsView = () => import("../views/FittingsView.vue");
const ProductDetail = () => import("../views/ProductDetail.vue");
const CartView = () => import("../views/Cart.vue");
const AboutView = () => import("../views/AboutView.vue");
const ContactsView = () => import("../views/ContactsView.vue");
const AdminLoginView = () => import("../views/AdminView.vue");
const AdminPanel = () => import("../views/AdminPanel.vue");

const ADMIN_UIDS = [
  "N9oOrhcobEUN31LYAbuKSP7cOCL2",
  "OcobZTDs6RdkHjnxfmaocKo3o2d2",
];
const ADMIN_EMAILS = ["romanova.lenovo@gmail.com"];

async function isAdminUser(user) {
  if (!user) return false;
  if (ADMIN_UIDS.includes(user.uid)) return true;
  if (user.email && ADMIN_EMAILS.includes(user.email)) return true;
  const t = await user.getIdTokenResult(true);
  return t?.claims?.admin === true;
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/interiors", name: "interiors", component: InteriorDoors },
    { path: "/exteriors", name: "exteriors", component: ExteriorDoors },
    { path: "/floors", name: "floors", component: FloorsView },
    { path: "/fittings", name: "fittings", component: FittingsView },
    {
      path: "/product/:id",
      name: "product-detail",
      component: ProductDetail,
      props: true,
    },
    { path: "/cart", name: "cart", component: CartView },
    { path: "/about", name: "about-view", component: AboutView },
    { path: "/contacts", name: "contacts-view", component: ContactsView },

    {
      path: "/login",
      name: "login",
      component: AdminLoginView,
      meta: { requiresGuest: true },
    },
    {
      path: "/admin",
      name: "adminPanel",
      component: AdminPanel,
      meta: { requiresAdmin: true },
    },

    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to, from, next) => {
  const needsGuest = to.matched.some((r) => r.meta?.requiresGuest);
  const needsAdmin = to.matched.some((r) => r.meta?.requiresAdmin);

  if (!needsGuest && !needsAdmin) return next();

  const user = auth.currentUser;

  if (import.meta.env.DEV) {
    console.log(
      "[GUARD] to:",
      to.fullPath,
      "user:",
      user && { uid: user.uid, email: user.email }
    );
  }

  if (needsGuest) {
    if (!user) return next();
    if (await isAdminUser(user)) {
      const redirect =
        typeof to.query.redirect === "string" ? to.query.redirect : "/admin";
      return next(redirect);
    } else {
      await auth.signOut();
      return next();
    }
  }

  if (needsAdmin) {
    if (!user) {
      return next({ name: "login", query: { redirect: to.fullPath } });
    }
    if (!(await isAdminUser(user))) {
      await auth.signOut();
      return next({
        name: "login",
        query: { redirect: to.fullPath, err: "noadmin" },
      });
    }
    return next();
  }

  next();
});

export default router;
