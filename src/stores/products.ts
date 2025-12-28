import { defineStore } from "pinia";
import { ref } from "vue";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";

const PAGE = 100;

export const useProductsStore = defineStore("products", () => {
  const items = ref<any[]>([]);
  const loading = ref(false);
  const done = ref(false);

  const lastDoc = ref<QueryDocumentSnapshot<DocumentData> | null>(null);
  const category = ref<string>("");

  function reset(cat = "") {
    items.value = [];
    loading.value = false;
    done.value = false;
    lastDoc.value = null;
    category.value = cat;
  }

  async function loadMore() {
    if (loading.value || done.value) return;
    loading.value = true;

    try {
      const colRef = collection(db, "products");

      const parts: any[] = [];

      if (category.value) parts.push(where("category", "==", category.value));

      parts.push(orderBy("createdAt", "desc"));

      if (lastDoc.value) parts.push(startAfter(lastDoc.value));
      parts.push(limit(PAGE));

      const q = query(colRef, ...parts);
      const snap = await getDocs(q);

      const batch = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.value.push(...batch);

      if (snap.docs.length) lastDoc.value = snap.docs[snap.docs.length - 1];

      if (snap.docs.length < PAGE) done.value = true;
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, done, reset, loadMore };
});
