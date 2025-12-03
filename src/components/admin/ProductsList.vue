<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import Button from "../UI/Button.vue";
import { uploadToCloudinary } from "../../lib/uploads";

import {
  categoryFields,
  floorFormFields,
  fittingsGroups,
  fittingsGroupOptions,
  fittingsSubtypesByGroup,
  fittingsFieldsBySubtype,
  fittingsExtrasByValue,
  colorOptions,
  selectFirst,
  initialForm,
  categoryLabel,
  formatPrice,
} from "../../lib/catalogSchema";

const products = ref([]);
const searchTerm = ref("");
const limitProducts = ref(10);

const editingId = ref(null);
const editForm = reactive({ ...initialForm() });
const editImages = ref([]);

const newEditFiles = ref([]);
const newEditPreviews = ref([]);

const savingEdit = ref(false);

const fittingsHiddenKeysInView = [
  "color",
  "material",
  "style",
  "fittingGroup",
  "fittingSubtype",
];

const filteredProducts = computed(() => {
  const term = (searchTerm.value || "").toLowerCase().trim();

  const isHit = (p) => p.isHit === "да" || p.isHit === true;
  const isExh = (p) => p.isExhibit === "да" || p.isExhibit === true;

  return products.value
    .filter((p) => {
      if (!term) return true;
      const name = (p?.name || "").toLowerCase();
      const brand = (p?.manufacturerName || "").toLowerCase();
      const vendor = (p?.manufacturer || "").toLowerCase();
      return (
        name.includes(term) || brand.includes(term) || vendor.includes(term)
      );
    })
    .slice()
    .sort((a, b) => isHit(b) - isHit(a) || isExh(b) - isExh(a));
});

const limitedProducts = computed(() =>
  filteredProducts.value.slice(0, limitProducts.value)
);

function loadMoreProducts() {
  limitProducts.value += 10;
}

async function loadProducts() {
  const qy = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snap = await getDocs(qy);
  products.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function startEdit(p) {
  editingId.value = p.id;
  Object.assign(editForm, initialForm(), p);

  if (editForm.isHit === true) editForm.isHit = "да";
  if (editForm.isHit === false) editForm.isHit = "нет";
  if (editForm.isHit == null) editForm.isHit = "";

  if (editForm.isExhibit === true) editForm.isExhibit = "да";
  if (editForm.isExhibit === false) editForm.isExhibit = "нет";
  if (editForm.isExhibit == null) editForm.isExhibit = "";

  editImages.value = [...(p.images || [])];

  newEditFiles.value = [];
  newEditPreviews.value.forEach((u) => {
    try {
      URL.revokeObjectURL(u);
    } catch {}
  });
  newEditPreviews.value = [];
}

function cancelEdit() {
  newEditPreviews.value.forEach((u) => {
    try {
      URL.revokeObjectURL(u);
    } catch {}
  });
  newEditPreviews.value = [];
  newEditFiles.value = [];

  editingId.value = null;
}

function handleEditFiles(e) {
  const arr = Array.from(e.target.files || []);
  if (!arr.length) return;
  newEditFiles.value.push(...arr);
  newEditPreviews.value.push(...arr.map((f) => URL.createObjectURL(f)));
  e.target.value = "";
}

function removeImage(i) {
  editImages.value.splice(i, 1);
}

function moveUp(i) {
  if (i > 0) {
    const [img] = editImages.value.splice(i, 1);
    editImages.value.splice(i - 1, 0, img);
  }
}
function moveDown(i) {
  if (i < editImages.value.length - 1) {
    const [img] = editImages.value.splice(i, 1);
    editImages.value.splice(i + 1, 0, img);
  }
}

function removeNewEditFile(i) {
  const url = newEditPreviews.value[i];
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
  newEditPreviews.value.splice(i, 1);
  newEditFiles.value.splice(i, 1);
}

const editBaseFields = computed(() => categoryFields[editForm.category] || []);
const editFormField = computed(() =>
  editBaseFields.value.find((f) => f.key === "form")
);
const editFieldsRest = computed(() => {
  const list = editBaseFields.value.filter((f) => f.key !== "form");
  const fittingsHidden = new Set([
    "color",
    "material",
    "style",
    "fittingGroup",
    "fittingSubtype",
  ]);
  const filtered =
    editForm.category === "fittings"
      ? list.filter((f) => !fittingsHidden.has(f.key))
      : list;
  return selectFirst(filtered);
});

const editFloorExtraTop = computed(() =>
  editForm.category === "floors"
    ? (floorFormFields[editForm.form] || []).filter(
        (f) => f.key === "structure"
      )
    : []
);
const editFloorExtraRest = computed(() =>
  editForm.category === "floors"
    ? (floorFormFields[editForm.form] || []).filter(
        (f) => f.key !== "structure"
      )
    : []
);

const editFittingsSubtypeField = computed(() => {
  if (editForm.category !== "fittings" || !editForm.fittingGroup) return null;
  const group = fittingsGroups.find((g) => g.label === editForm.fittingGroup);
  const opts = group ? fittingsSubtypesByGroup[group.value] || [] : [];
  return { key: "fittingSubtype", label: "Тип", type: "select", options: opts };
});
const editFittingsDynamicFields = computed(() => {
  if (editForm.category !== "fittings" || !editForm.fittingSubtype) return [];
  return fittingsFieldsBySubtype[editForm.fittingSubtype] || [];
});

async function saveEdit(id) {
  if (!id) return;
  savingEdit.value = true;
  try {
    const uploaded = newEditFiles.value.length
      ? await Promise.all(newEditFiles.value.map(uploadToCloudinary))
      : [];
    const allImgs = [...editImages.value, ...uploaded];

    const normalizedIsHit =
      editForm.isHit === "да" ? "да" : editForm.isHit === "нет" ? "нет" : "";
    const normalizedIsExhibit =
      editForm.isExhibit === "да"
        ? "да"
        : editForm.isExhibit === "нет"
        ? "нет"
        : "";

    await updateDoc(doc(db, "products", id), {
      ...editForm,
      isHit: normalizedIsHit,
      isExhibit: normalizedIsExhibit,
      images: allImgs,
    });

    newEditPreviews.value.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    newEditPreviews.value = [];
    newEditFiles.value = [];

    editingId.value = null;
    await loadProducts();
  } catch (e) {
    console.error(e);
    alert("Ошибка при сохранении");
  } finally {
    savingEdit.value = false;
  }
}

async function deleteProduct(id) {
  if (!confirm("Удалить товар?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    await loadProducts();
  } catch (e) {
    console.error("Delete product failed:", e);
    alert(`Ошибка удаления: ${e.code || e.message}`);
  }
}

onMounted(loadProducts);

defineExpose({ reload: loadProducts });
</script>

<template>
  <h1 class="page-title">Список товаров</h1>
  <div class="products-list">
    <div class="toolbar">
      <input
        class="search"
        v-model.trim="searchTerm"
        type="search"
        placeholder="Поиск по названию / производителю…"
      />
    </div>

    <ul class="cards">
      <li v-for="p in limitedProducts" :key="p.id" class="card">
        <div v-if="editingId !== p.id" class="card__view">
          <div class="card__head">
            <h3 class="card__title">{{ p.name }}</h3>
            <div class="badges">
              <span
                v-if="p.isHit === 'да' || p.isHit === true"
                class="badge badge--hit"
                >Хит</span
              >
              <span
                v-if="p.isExhibit === 'да' || p.isExhibit === true"
                class="badge"
                >Выставочный</span
              >
            </div>
          </div>

          <div class="card__grid">
            <div class="card__images">
              <img
                v-for="(src, i) in p.images || []"
                :key="src + i"
                :src="src"
                alt=""
              />
            </div>
            <dl class="card__meta">
              <div>
                <dt>Цена</dt>
                <dd>{{ formatPrice(p.price) }} ₽</dd>
              </div>
              <div>
                <dt>Категория</dt>
                <dd>{{ categoryLabel(p.category) }}</dd>
              </div>

              <div v-if="p.manufacturerName">
                <dt>Производитель</dt>
                <dd>{{ p.manufacturerName }}</dd>
              </div>
              <div v-if="p.manufacturer">
                <dt>Название производителя</dt>
                <dd>{{ p.manufacturer }}</dd>
              </div>
            </dl>
          </div>
          <div class="card__actions">
            <Button @click="startEdit(p)">Редактировать</Button>
            <Button theme="danger" @click="deleteProduct(p.id)">Удалить</Button>
          </div>
        </div>

        <div v-else class="card__edit">
          <div class="edit-grid">
            <div class="edit-col">
              <div class="field-group">
                <label>Название</label>
                <input v-model="editForm.name" type="text" />
              </div>

              <div class="grid two">
                <div class="field-group">
                  <label>Цена (₽)</label>
                  <input v-model.number="editForm.price" type="number" />
                </div>
                <div class="field-group">
                  <label>Категория</label>
                  <select v-model="editForm.category">
                    <option value="interiors">Межкомнатные двери</option>
                    <option value="exteriors">Входные двери</option>
                    <option value="fittings">Фурнитура</option>
                    <option value="floors">Напольные покрытия</option>
                  </select>
                </div>
              </div>

              <div class="grid two">
                <div class="field-group">
                  <label>Производитель (бренд)</label>
                  <input
                    v-model="editForm.manufacturerName"
                    type="text"
                    placeholder="Напр.: Torex / ProfilDoors"
                  />
                </div>
                <div class="field-group">
                  <label>Название товара у производителя</label>
                  <input
                    v-model="editForm.manufacturer"
                    type="text"
                    placeholder="Юр. название / внутр. наименование"
                  />
                </div>
              </div>

              <div class="grid two">
                <div class="field-group">
                  <label>Хит продаж</label>
                  <select v-model="editForm.isHit">
                    <option value="">—</option>
                    <option value="да">да</option>
                    <option value="нет">нет</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Выставочный</label>
                  <select v-model="editForm.isExhibit">
                    <option value="">—</option>
                    <option value="да">да</option>
                    <option value="нет">нет</option>
                  </select>
                </div>
              </div>

              <div class="field-group">
                <label>Описание</label>
                <textarea v-model="editForm.description" rows="3" />
              </div>

              <!-- =================== СПЕЦИФИКАЦИИ =================== -->
              <div class="spec-section">
                <div v-if="editFormField" class="field-group">
                  <label :for="editFormField.key">{{
                    editFormField.label
                  }}</label>
                  <select
                    :id="editFormField.key"
                    v-model="editForm[editFormField.key]"
                  >
                    <option disabled value="">
                      Выберите {{ editFormField.label.toLowerCase() }}
                    </option>
                    <option
                      v-for="opt in editFormField.options"
                      :key="opt"
                      :value="opt"
                    >
                      {{ opt }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="editFloorExtraTop && editFloorExtraTop.length"
                  class="grid two"
                >
                  <div
                    v-for="field in editFloorExtraTop"
                    :key="'floor-top-' + field.key"
                    class="field-group"
                  >
                    <label :for="field.key">{{ field.label }}</label>
                    <template
                      v-if="
                        field.type === 'select' || field.type === 'multiselect'
                      "
                    >
                      <select
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :multiple="field.type === 'multiselect'"
                      >
                        <option
                          v-if="field.type !== 'multiselect'"
                          disabled
                          value=""
                        >
                          Выберите {{ field.label.toLowerCase() }}
                        </option>
                        <option
                          v-for="opt in field.options"
                          :key="opt"
                          :value="opt"
                        >
                          {{ opt }}
                        </option>
                      </select>
                    </template>
                    <template v-else>
                      <input
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :type="field.type || 'text'"
                        :placeholder="field.label"
                      />
                    </template>
                  </div>
                </div>

                <div v-if="editForm.category === 'fittings'" class="grid two">
                  <div class="field-group">
                    <label for="fittingGroup">Подвид</label>
                    <select id="fittingGroup" v-model="editForm.fittingGroup">
                      <option disabled value="">Выберите подвид</option>
                      <option
                        v-for="opt in fittingsGroupOptions"
                        :key="opt"
                        :value="opt"
                      >
                        {{ opt }}
                      </option>
                    </select>
                  </div>
                </div>

                <div v-if="editFittingsSubtypeField" class="field-group">
                  <label :for="editFittingsSubtypeField.key">
                    {{ editFittingsSubtypeField.label }}
                  </label>
                  <select
                    :id="editFittingsSubtypeField.key"
                    v-model="editForm[editFittingsSubtypeField.key]"
                  >
                    <option disabled value="">Выберите тип</option>
                    <option
                      v-for="opt in editFittingsSubtypeField.options"
                      :key="opt"
                      :value="opt"
                    >
                      {{ opt }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="
                    editFittingsDynamicFields &&
                    editFittingsDynamicFields.length
                  "
                  class="grid two"
                >
                  <div
                    v-for="field in editFittingsDynamicFields"
                    :key="'fit-dyn-' + field.key"
                    class="field-group"
                  >
                    <label :for="field.key">{{ field.label }}</label>
                    <template
                      v-if="
                        field.type === 'select' || field.type === 'multiselect'
                      "
                    >
                      <select
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :multiple="field.type === 'multiselect'"
                      >
                        <option
                          v-if="field.type !== 'multiselect'"
                          disabled
                          value=""
                        >
                          Выберите {{ field.label.toLowerCase() }}
                        </option>
                        <option
                          v-for="opt in field.options"
                          :key="opt"
                          :value="opt"
                        >
                          {{ opt }}
                        </option>
                      </select>
                    </template>
                    <template v-else>
                      <input
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :type="field.type || 'text'"
                        :placeholder="field.label"
                      />
                    </template>

                    <template
                      v-for="extra in fittingsExtrasByValue[field.key]?.[
                        editForm[field.key]
                      ] || []"
                      :key="'fit-extra-' + extra.key"
                    >
                      <div class="field-group">
                        <label :for="extra.key">{{ extra.label }}</label>
                        <template
                          v-if="
                            extra.type === 'select' ||
                            extra.type === 'multiselect'
                          "
                        >
                          <select
                            :id="extra.key"
                            v-model="editForm[extra.key]"
                            :multiple="extra.type === 'multiselect'"
                          >
                            <option
                              v-if="extra.type !== 'multiselect'"
                              disabled
                              value=""
                            >
                              Выберите {{ extra.label.toLowerCase() }}
                            </option>
                            <option
                              v-for="opt in extra.options"
                              :key="opt"
                              :value="opt"
                            >
                              {{ opt }}
                            </option>
                          </select>
                        </template>
                        <template v-else>
                          <input
                            :id="extra.key"
                            v-model="editForm[extra.key]"
                            :type="extra.type || 'text'"
                            :placeholder="extra.label"
                          />
                        </template>
                      </div>
                    </template>
                  </div>
                </div>

                <div
                  v-if="editFieldsRest && editFieldsRest.length"
                  class="grid two"
                >
                  <div
                    v-for="field in editFieldsRest"
                    :key="'cat-' + field.key"
                    class="field-group"
                  >
                    <label :for="field.key">{{ field.label }}</label>
                    <template
                      v-if="
                        field.type === 'select' || field.type === 'multiselect'
                      "
                    >
                      <select
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :multiple="field.type === 'multiselect'"
                      >
                        <option
                          v-if="field.type !== 'multiselect'"
                          disabled
                          value=""
                        >
                          Выберите {{ field.label.toLowerCase() }}
                        </option>
                        <option
                          v-for="opt in field.options"
                          :key="opt"
                          :value="opt"
                        >
                          {{ opt }}
                        </option>
                      </select>
                    </template>
                    <template v-else>
                      <input
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :type="field.type || 'text'"
                        :placeholder="field.label"
                      />
                    </template>
                  </div>
                </div>

                <div
                  v-if="editFloorExtraRest && editFloorExtraRest.length"
                  class="grid two"
                >
                  <div
                    v-for="field in editFloorExtraRest"
                    :key="'floor-rest-' + field.key"
                    class="field-group"
                  >
                    <label :for="field.key">{{ field.label }}</label>
                    <template
                      v-if="
                        field.type === 'select' || field.type === 'multiselect'
                      "
                    >
                      <select
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :multiple="field.type === 'multiselect'"
                      >
                        <option
                          v-if="field.type !== 'multiselect'"
                          disabled
                          value=""
                        >
                          Выберите {{ field.label.toLowerCase() }}
                        </option>
                        <option
                          v-for="opt in field.options"
                          :key="opt"
                          :value="opt"
                        >
                          {{ opt }}
                        </option>
                      </select>
                    </template>
                    <template v-else>
                      <input
                        :id="field.key"
                        v-model="editForm[field.key]"
                        :type="field.type || 'text'"
                        :placeholder="field.label"
                      />
                    </template>
                  </div>
                </div>
              </div>
              <!-- ============== конец спецификаций ============== -->
            </div>
          </div>

          <div class="field-group" style="margin-top: 1rem">
            <label>Фото (добавляй по очереди)</label>

            <ul class="images-existing" v-if="editImages.length > 0">
              <li
                v-for="(url, i) in editImages"
                :key="url + i"
                class="img-item"
              >
                <img :src="url" alt="" />
                <button
                  type="button"
                  class="btn-del"
                  @click.stop="removeImage(i)"
                  aria-label="Удалить изображение"
                >
                  Удалить
                </button>
                <button
                  type="button"
                  class="btn-move up"
                  @click.stop="moveUp(i)"
                  :disabled="i === 0"
                  aria-label="Передвинуть выше"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="btn-move down"
                  @click.stop="moveDown(i)"
                  :disabled="i === editImages.length - 1"
                  aria-label="Передвинуть ниже"
                >
                  ↓
                </button>
              </li>
            </ul>

            <input
              type="file"
              accept="image/*"
              multiple
              @change="handleEditFiles"
            />

            <ul class="images-new" v-if="newEditPreviews.length > 0">
              <li
                v-for="(url, i) in newEditPreviews"
                :key="url"
                class="img-item"
              >
                <img :src="url" alt="" />
                <button
                  type="button"
                  class="btn-del"
                  @click.stop="removeNewEditFile(i)"
                  aria-label="Удалить новое изображение"
                >
                  Удалить
                </button>
              </li>
            </ul>
          </div>

          <div class="card__actions">
            <Button :disabled="savingEdit" @click="saveEdit(editingId)">
              {{ savingEdit ? "Сохраняю…" : "Сохранить" }}
            </Button>
            <Button
              theme="secondary"
              :disabled="savingEdit"
              @click="cancelEdit"
            >
              Отмена
            </Button>
          </div>
        </div>
      </li>
    </ul>

    <div
      class="loadmore"
      v-if="limitedProducts.length < filteredProducts.length"
    >
      <Button @click="loadMoreProducts">Показать ещё</Button>
    </div>
  </div>
</template>

<style scoped lang="sass">
@import "../../assets/css/main.sass"

.page-title
  display: flex
  justify-content: center
.products-list
  display: grid
  gap: 1rem

.search
  width: min(420px, 100%)
  padding: .6rem .7rem
  border: 1px solid #e5e5e5
  border-radius: .5rem
  font-size: 1rem
  background: #fff

.cards
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 1rem
  list-style: none
  margin: 0
  padding: 0

@media (max-width: $small)
  .cards
    grid-template-columns: 1fr

.card
  background: #ffffffcc
  border: 1px solid #ececec
  border-radius: .75rem
  box-shadow: 0 1px 4px rgba(0,0,0,0.04)
  padding: 1rem

.card__head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 1rem

.card__title
  margin: 0
  font-weight: 800
  font-size: 1.2rem

.badges
  display: flex
  gap: .5rem
.badge
  padding: .2rem .5rem
  border: 1px solid #e5e5e5
  border-radius: .5rem
  font-size: .85rem
.badge--hit
  background: #fff6e5
  border-color: #ffda8a

.card__grid
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 1rem
  margin-top: .75rem
  @media (max-width: 780px)
    grid-template-columns: 1fr
    gap: .75rem

.card__images
  display: grid
  grid-template-columns: repeat(3, minmax(0,1fr))
  gap: .5rem
  @media (max-width: 520px)
    grid-template-columns: repeat(2, minmax(0,1fr))
  img
    width: 100%
    height: 100px
    object-fit: cover
    border-radius: .5rem
    border: 1px solid #eaeaea
    background: #fff

.card__meta
  display: grid
  gap: .35rem
  dt
    font-weight: 600
  dd
    margin: 0

.card__actions
  display: flex
  gap: .5rem
  flex-wrap: wrap

.edit-col
  display: grid
  gap: .75rem

.field-group
  display: grid
  gap: .35rem

.grid.two
  display: grid
  grid-template-columns: repeat(2, minmax(0,1fr))
  gap: 1rem
  @media (max-width: 720px)
    grid-template-columns: 1fr

input, select, textarea
  width: 100%
  padding: .6rem .7rem
  border: 1px solid #e5e5e5
  border-radius: .5rem
  font-size: 1rem
  background: #fff
  transition: border-color .15s ease, box-shadow .15s ease
  &:focus
    border-color: #8bb8ff
    box-shadow: 0 0 0 3px rgba(139,184,255,.25)

input[type="file"]
  padding: .4rem .5rem
  background: #fafafa
  border-style: dashed
  &:hover
    background: #f6f6f6

.images-existing,
.images-new
  display: flex
  flex-wrap: wrap
  gap: .75rem
  margin-top: .5rem

.img-item
  position: relative
  width: 110px
  aspect-ratio: 1 / 1
  border-radius: .5rem
  overflow: hidden
  border: 1px solid #eaeaea
  background: #fff
  box-shadow: 0 1px 3px rgba(0,0,0,.04)

  @media (max-width: 520px)
    width: 96px

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block

.btn-del
  position: absolute
  top: 6px
  right: 6px
  padding: 2px 6px
  font-size: 12px
  line-height: 1
  background: #ffffffee
  border: 1px solid #ddd
  border-radius: 6px
  cursor: pointer
  transition: border-color .15s ease, background .15s ease, opacity .15s ease
  &:hover
    border-color: #bdbdbd
    background: #fff
  &:focus-visible
    outline: 2px solid #8bb8ff
    outline-offset: 1px

.btn-move
  position: absolute
  left: 6px
  padding: 0 6px
  font-size: 12px
  line-height: 20px
  height: 22px
  border-radius: 6px
  background: #ffffffee
  border: 1px solid #ddd
  cursor: pointer
  transition: opacity .15s ease, border-color .15s ease, background .15s ease
  &.up
    top: 6px
  &.down
    top: 34px
  &:hover
    border-color: #bdbdbd
    background: #fff
  &:disabled
    opacity: .5
    cursor: default
    pointer-events: none
</style>
