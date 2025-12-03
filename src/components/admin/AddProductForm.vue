<script setup>
import { ref, computed, watch, watchEffect } from "vue";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
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

const emit = defineEmits(["created"]);
const form = ref(initialForm());
const files = ref([]);
const previews = ref([]);
const loading = ref(false);
const message = ref("");

const addBaseFields = computed(() => categoryFields[form.value.category] || []);
const addFormField = computed(() =>
  addBaseFields.value.find((f) => f.key === "form")
);
const addFieldsRest = computed(() =>
  selectFirst(addBaseFields.value.filter((f) => f.key !== "form"))
);
const addFloorExtraTop = computed(() =>
  form.value.category === "floors"
    ? (floorFormFields[form.value.form] || []).filter(
        (f) => f.key === "structure"
      )
    : []
);
const addFloorExtraRest = computed(() =>
  form.value.category === "floors"
    ? (floorFormFields[form.value.form] || []).filter(
        (f) => f.key !== "structure"
      )
    : []
);
const addFittingsSubtypeField = computed(() => {
  if (form.value.category !== "fittings" || !form.value.fittingGroup)
    return null;
  const group = fittingsGroups.find((g) => g.label === form.value.fittingGroup);
  const opts = group ? fittingsSubtypesByGroup[group.value] || [] : [];
  return { key: "fittingSubtype", label: "Тип", type: "select", options: opts };
});
const addFittingsDynamicFields = computed(() =>
  form.value.category === "fittings" && form.value.fittingSubtype
    ? fittingsFieldsBySubtype[form.value.fittingSubtype] || []
    : []
);

function handleFiles(e) {
  const arr = Array.from(e.target.files || []);
  if (!arr.length) return;
  files.value.push(...arr);
  previews.value.push(...arr.map((f) => URL.createObjectURL(f)));
  e.target.value = "";
}

function removeFile(i) {
  const url = previews.value[i];
  if (url) URL.revokeObjectURL(url);
  previews.value.splice(i, 1);
  files.value.splice(i, 1);
}

/* ===========================
   СЖАТИЕ ПЕРЕД ЗАГРУЗКОЙ
   =========================== */

/**
 * Рендерит изображение в canvas с заданным масштабом/качеством и возвращает Blob.
 * По умолчанию — JPEG. Для PNG с альфой кладём белую подложку, чтобы не было серых ореолов.
 */
async function downscaleImage(
  fileOrBlob,
  { maxLongSide, quality = 0.82, mime = "image/jpeg" } = {}
) {
  // createImageBitmap -> fallback через <img> для Safari/старых браузеров
  const bitmap =
    "createImageBitmap" in window
      ? await createImageBitmap(fileOrBlob)
      : await new Promise((resolve, reject) => {
          const url = URL.createObjectURL(fileOrBlob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
          };
          img.src = url;
        });

  const srcW = bitmap.width;
  const srcH = bitmap.height;

  // Если maxLongSide не задан — сохраняем исходное разрешение (scale=1)
  const scale = maxLongSide
    ? Math.min(1, maxLongSide / Math.max(srcW, srcH))
    : 1;
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // Белая подложка для прозрачности (PNG/WebP с альфой) → корректный JPEG
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob = await new Promise((res) => canvas.toBlob(res, mime, quality));
  if (!blob) throw new Error("toBlob returned null");
  return blob;
}

const LIMIT_BYTES = 7 * 1024 * 1024; // 7 MiB

/**
 * Готовит файл к отправке в Cloudinary, если он > 7 MiB.
 * 1) Сначала пробует перекодировать в JPEG без изменения размеров (часто достаточно).
 * 2) Если всё ещё > лимита — уменьшает длинную сторону ступенчато и подбирает качество.
 * Возвращает File (image/jpeg) без EXIF.
 */
async function prepareForCloudinary(file) {
  if (file.size <= LIMIT_BYTES) return file;

  // Шаг 1: перекод в JPEG без ресайза (качество чуть выше среднего)
  let blob = await downscaleImage(file, {
    maxLongSide: undefined,
    quality: 0.85,
    mime: "image/jpeg",
  });

  // Шаг 2: ступенчатое снижение, если всё ещё крупно
  const steps = [
    { side: 2400, q: 0.83 },
    { side: 2048, q: 0.8 },
    { side: 1920, q: 0.78 },
    { side: 1600, q: 0.75 },
    { side: 1400, q: 0.72 },
    { side: 1280, q: 0.7 },
  ];

  for (const s of steps) {
    if (blob.size <= LIMIT_BYTES) break;
    blob = await downscaleImage(blob, {
      maxLongSide: s.side,
      quality: s.q,
      mime: "image/jpeg",
    });
  }

  // Safety-финал
  if (blob.size > LIMIT_BYTES) {
    blob = await downscaleImage(blob, {
      maxLongSide: 1100,
      quality: 0.68,
      mime: "image/jpeg",
    });
  }

  return new File(
    [blob],
    (file.name?.replace(/\.[^.]+$/, "") || "image") + ".jpg",
    { type: "image/jpeg", lastModified: Date.now() }
  );
}

async function addProduct() {
  loading.value = true;
  try {
    const id = String(Date.now());

    // сжимаем перед upload (только если > 7 MiB по логике prepareForCloudinary)
    const images = files.value.length
      ? await Promise.all(
          files.value.map(async (f) => {
            const ready = await prepareForCloudinary(f);
            return uploadToCloudinary(ready);
          })
        )
      : [];

    previews.value.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    previews.value = [];
    files.value = [];

    const normalizedIsHit =
      form.value.isHit === "да"
        ? "да"
        : form.value.isHit === "нет"
        ? "нет"
        : "";
    const normalizedIsExhibit =
      form.value.isExhibit === "да"
        ? "да"
        : form.value.isExhibit === "нет"
        ? "нет"
        : "";

    const payload = {
      ...form.value,
      isHit: normalizedIsHit,
      isExhibit: normalizedIsExhibit,
      createdAt: serverTimestamp(),
      images,
    };

    await setDoc(doc(collection(db, "products"), id), payload);
    form.value = initialForm();
    message.value = "Товар успешно добавлен";
    emit("created");
  } catch (e) {
    console.error(e);
    message.value = "Ошибка при добавлении товара";
  } finally {
    loading.value = false;
    setTimeout(() => (message.value = ""), 2500);
  }
}

watch(
  () => form.value.category,
  (cat) => {
    if (cat !== "floors") {
      form.value.type = "";
      form.value.structure = "";
    }
    if (cat !== "fittings") {
      form.value.fittingGroup = "";
      form.value.fittingSubtype = "";
    }
  }
);

watch(
  () => form.value.form,
  () => {
    if (form.value.category !== "floors") return;
    const top = (floorFormFields[form.value.form] || []).find(
      (f) => f.key === "structure"
    );
    if (top && !form.value.structure) {
      form.value.structure = "";
    }
  }
);

watch(
  () => form.value.fittingGroup,
  (label) => {
    if (!label) {
      form.value.fittingSubtype = "";
      return;
    }
    const group = fittingsGroups.find((g) => g.label === label);
    const opts = group ? fittingsSubtypesByGroup[group.value] || [] : [];
    if (!opts.includes(form.value.fittingSubtype))
      form.value.fittingSubtype = "";
  }
);

watch(
  () => form.value.fittingSubtype,
  () => {
    // сбрасываем возможные доп.значения от прошлого выбора
    Object.values(fittingsFieldsBySubtype)
      .flat()
      .forEach((f) => {
        if (f?.key) form.value[f.key] = "";
      });
  }
);

watchEffect(() => {
  addFittingsDynamicFields.value.forEach((f) => {
    if (!(f.key in form.value))
      form.value[f.key] = f.type === "multiselect" ? [] : "";
  });
  addFieldsRest.value.forEach((f) => {
    if (!(f.key in form.value))
      form.value[f.key] = f.type === "multiselect" ? [] : "";
  });
  (fittingsFieldsBySubtype[form.value.fittingSubtype] || []).forEach((f) => {
    if (!(f.key in form.value))
      form.value[f.key] = f.type === "multiselect" ? [] : "";
  });

  addFieldsRest.value.forEach((f) => {
    if (!f?.key) return;
    const extras = fittingsExtrasByValue[f.key]?.[form.value[f.key]] || [];
    extras.forEach((extra) => {
      if (!(extra.key in form.value))
        form.value[extra.key] = extra.type === "multiselect" ? [] : "";
    });
  });
});
</script>

<template>
  <div>
    <h1 class="page-title">Добавить товар</h1>

    <form @submit.prevent="addProduct" class="product-form">
      <div class="form-section">
        <div class="section-header">
          <h3>Основные характеристики</h3>
          <div class="section-line"></div>
        </div>

        <div class="field-group required">
          <label for="name">Здесь надо придумать название</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            placeholder="Название"
          />
          <small class="hint">Коротко и по делу: серия/модель.</small>
        </div>

        <div class="grid two">
          <div class="field-group">
            <label for="manufacturerName">Производитель (бренд)</label>
            <input
              id="manufacturerName"
              v-model="form.manufacturerName"
              type="text"
              placeholder="Напр.: Tandor / Torex"
              class="red"
            />
          </div>

          <div class="field-group">
            <label for="manufacturer">Название товара у производителя</label>
            <input
              id="manufacturer"
              v-model="form.manufacturer"
              type="text"
              placeholder="Внутр. наименование, как этот товар называет сам производитель."
              class="red"
            />
          </div>
        </div>

        <div class="grid two">
          <div class="field-group required">
            <label for="category">Категория</label>
            <select id="category" v-model="form.category" required>
              <option disabled value="">Выберите категорию</option>
              <option value="interiors">Межкомнатные двери</option>
              <option value="exteriors">Входные двери</option>
              <option value="fittings">Фурнитура</option>
              <option value="floors">Напольные покрытия</option>
            </select>
          </div>

          <div class="field-group required">
            <label for="price">Цена (₽)</label>
            <input
              id="price"
              v-model.number="form.price"
              type="number"
              required
              placeholder="Цена"
            />
            <small class="hint">Только цифры, без пробелов.</small>
          </div>
        </div>

        <div class="field-group">
          <label for="description">Описание</label>
          <textarea
            id="description"
            v-model="form.description"
            placeholder="Описание"
            rows="3"
          />
        </div>

        <div class="grid two">
          <div class="field-group">
            <label for="isHit">Хит продаж</label>
            <select id="isHit" v-model="form.isHit">
              <option disabled value="">Выберите</option>
              <option value="да">да</option>
              <option value="нет">нет</option>
            </select>
          </div>

          <div class="field-group">
            <label for="isExhibit">Выставочный экземпляр</label>
            <select id="isExhibit" v-model="form.isExhibit">
              <option disabled value="">Выберите</option>
              <option value="да">да</option>
              <option value="нет">нет</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h3>Фото</h3>
          <div class="section-line"></div>
        </div>
        <div class="field-group">
          <label for="images">Файлы</label>
          <input
            id="images"
            type="file"
            multiple
            @change="handleFiles"
            accept="image/*"
          />
          <small class="hint">Можно выбрать несколько изображений сразу.</small>

          <ul class="images-new" v-if="previews.length">
            <li v-for="(url, i) in previews" :key="url" class="img-item">
              <img :src="url" alt="" />
              <button type="button" class="btn-del" @click="removeFile(i)">
                Удалить
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h3>Спецификации</h3>
          <div class="section-line"></div>
        </div>

        <div v-if="addFormField" class="field-group">
          <label :for="addFormField.key">{{ addFormField.label }}</label>
          <select :id="addFormField.key" v-model="form[addFormField.key]">
            <option disabled value="">
              Выберите {{ addFormField.label.toLowerCase() }}
            </option>
            <option v-for="opt in addFormField.options" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>

        <div
          v-if="addFloorExtraTop && addFloorExtraTop.length"
          class="grid two"
        >
          <div
            v-for="field in addFloorExtraTop"
            :key="'floor-top-' + field.key"
            class="field-group"
          >
            <label :for="field.key">{{ field.label }}</label>
            <template
              v-if="field.type === 'select' || field.type === 'multiselect'"
            >
              <select
                :id="field.key"
                v-model="form[field.key]"
                :multiple="field.type === 'multiselect'"
              >
                <option v-if="field.type !== 'multiselect'" disabled value="">
                  Выберите {{ field.label.toLowerCase() }}
                </option>
                <option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </template>
            <template v-else>
              <input
                :id="field.key"
                v-model="form[field.key]"
                :type="field.type || 'text'"
                :placeholder="field.label"
              />
            </template>
          </div>
        </div>

        <div v-if="form.category === 'fittings'" class="grid two">
          <div class="field-group required">
            <label for="fittingGroup">Подвид</label>
            <select id="fittingGroup" v-model="form.fittingGroup" required>
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

        <div v-if="addFittingsSubtypeField" class="field-group required">
          <label :for="addFittingsSubtypeField.key">{{
            addFittingsSubtypeField.label
          }}</label>
          <select
            :id="addFittingsSubtypeField.key"
            v-model="form[addFittingsSubtypeField.key]"
            required
          >
            <option disabled value="">Выберите тип</option>
            <option
              v-for="opt in addFittingsSubtypeField.options"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>
        </div>

        <div
          v-if="addFittingsDynamicFields && addFittingsDynamicFields.length"
          class="grid two"
        >
          <div
            v-for="field in addFittingsDynamicFields"
            :key="'fit-dyn-' + field.key"
            class="field-group"
          >
            <label :for="field.key">{{ field.label }}</label>
            <template
              v-if="field.type === 'select' || field.type === 'multiselect'"
            >
              <select
                :id="field.key"
                v-model="form[field.key]"
                :multiple="field.type === 'multiselect'"
              >
                <option v-if="field.type !== 'multiselect'" disabled value="">
                  Выберите {{ field.label.toLowerCase() }}
                </option>
                <option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </template>
            <template v-else>
              <input
                :id="field.key"
                v-model="form[field.key]"
                :type="field.type || 'text'"
                :placeholder="field.label"
              />
            </template>

            <template
              v-for="extra in fittingsExtrasByValue[field.key]?.[
                form[field.key]
              ] || []"
              :key="'fit-extra-' + extra.key"
            >
              <div class="field-group">
                <label :for="extra.key">{{ extra.label }}</label>
                <template
                  v-if="extra.type === 'select' || extra.type === 'multiselect'"
                >
                  <select
                    :id="extra.key"
                    v-model="form[extra.key]"
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
                    v-model="form[extra.key]"
                    :type="extra.type || 'text'"
                    :placeholder="extra.label"
                  />
                </template>
              </div>
            </template>
          </div>
        </div>

        <div v-if="addFieldsRest && addFieldsRest.length" class="grid two">
          <div
            v-for="field in addFieldsRest"
            :key="'cat-' + field.key"
            class="field-group"
          >
            <label :for="field.key">{{ field.label }}</label>
            <template
              v-if="field.type === 'select' || field.type === 'multiselect'"
            >
              <select
                :id="field.key"
                v-model="form[field.key]"
                :multiple="field.type === 'multiselect'"
              >
                <option v-if="field.type !== 'multiselect'" disabled value="">
                  Выберите {{ field.label.toLowerCase() }}
                </option>
                <option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </template>
            <template v-else>
              <input
                :id="field.key"
                v-model="form[field.key]"
                :type="field.type || 'text'"
                :placeholder="field.label"
              />
            </template>
          </div>
        </div>

        <div
          v-if="addFloorExtraRest && addFloorExtraRest.length"
          class="grid two"
        >
          <div
            v-for="field in addFloorExtraRest"
            :key="'floor-rest-' + field.key"
            class="field-group"
          >
            <label :for="field.key">{{ field.label }}</label>
            <template
              v-if="field.type === 'select' || field.type === 'multiselect'"
            >
              <select
                :id="field.key"
                v-model="form[field.key]"
                :multiple="field.type === 'multiselect'"
              >
                <option v-if="field.type !== 'multiselect'" disabled value="">
                  Выберите {{ field.label.toLowerCase() }}
                </option>
                <option v-for="opt in field.options" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </template>
            <template v-else>
              <input
                :id="field.key"
                v-model="form[field.key]"
                :type="field.type || 'text'"
                :placeholder="field.label"
              />
            </template>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <Button type="submit" :disabled="loading">
          {{ loading ? "Сохраняю..." : "Добавить товар" }}
        </Button>
      </div>

      <p v-if="message" class="status">{{ message }}</p>
    </form>
  </div>
</template>

<style scoped lang="sass">
.page-title
  display: flex
  justify-content: center

.product-form
  display: grid
  gap: 1.25rem

.form-section
  padding: 1rem
  background: #ffffffcc
  border: 1px solid #ececec
  border-radius: .75rem
  box-shadow: 0 1px 4px rgba(0,0,0,0.04)

.section-header
  display: flex
  align-items: center
  gap: 1rem
  margin-bottom: .75rem
  h3
    font-size: 1.2rem
    margin: 0
    font-weight: 800
  .section-line
    flex: 1
    height: 1px
    background: #e9e9e9

.field-group
  display: grid
  gap: .35rem
  margin-bottom: .75rem

.field-group.required label::after
  content: " *"
  color: #c33

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
  transition: border-color .15s ease
  &:focus
    border-color: #8bb8ff

.hint
  color: #7a7a7a

.form-actions
  width: 60rem
  max-width: 100%
  margin: .5rem auto 0
  display: flex
  justify-content: center

.images-new
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: .5rem;

.images-new .img-item
  position: relative;
  width: 110px;

.images-new img
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #eaeaea;

.images-new .btn-del
  position: absolute;
  top: 6px;
  right: 6px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 12px;
  cursor: pointer;

.images-new .btn-del:hover
  border-color: #bbb;

.dropzone
  margin-top: .5rem
  padding: 1rem
  border: 1px dashed #cfcfcf
  border-radius: .5rem
  background: #fafafa
  text-align: center
  font-size: .95rem
  color: #666
  transition: background .15s ease, border-color .15s ease
  &:hover
    background: #f6f6f6
    border-color: #bdbdbd

.images-existing,
.images-new
  display: flex
  flex-wrap: wrap
  gap: .75rem
  margin-top: .75rem

.img-item
  position: relative
  width: 110px
  aspect-ratio: 1 / 1
  border-radius: .5rem
  overflow: hidden
  border: 1px solid #eaeaea
  background: #fff
  box-shadow: 0 1px 3px rgba(0,0,0,.04)

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
  transition: border-color .15s ease, background .15s ease
  &:hover
    border-color: #bdbdbd
    background: #fff


.field-group input[type="file"]
  display: block
  max-width: 420px

.red
  border: 2px solid var(--third-color)

@media (max-width: 720px)
  .img-item
    width: 96px
</style>
