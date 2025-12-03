import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

const ADMIN_UIDS = [
  "N9oOrhcobEUN31LYAbuKSP7cOCL2",
  "OcobZTDs6RdkHjnxfmaocKo3o2d2",
];

export async function ensureAdminOrRedirect(router) {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, async (user) => {
      stop();

      if (!user) {
        router.replace({ name: "login", query: { redirect: "/admin" } });
        return resolve(false);
      }

      const isUid = ADMIN_UIDS.includes(user.uid);
      let isClaim = false;

      try {
        const token = await user.getIdTokenResult(true);
        isClaim = token?.claims?.admin === true;
      } catch {}

      if (isUid || isClaim) {
        return resolve(true);
      }
      router.replace({
        name: "login",
        query: { redirect: "/admin", err: "noadmin" },
      });
      resolve(false);
    });
  });
}
