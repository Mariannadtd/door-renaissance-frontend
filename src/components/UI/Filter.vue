<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps({
  filters: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["update:modelValue"]);

const state = ref({ ...props.modelValue });

let syncingFromParent = false;

watch(
  () => props.modelValue,
  (v) => {
    syncingFromParent = true;
    state.value = { ...v };
    nextTick(() => {
      syncingFromParent = false;
    });
  },
  { deep: false }
);

watch(
  () => state.value,
  (v) => {
    if (syncingFromParent) return;
    emit("update:modelValue", { ...v });
  },
  { deep: true }
);

const norm = (v) =>
  (v ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/ё/g, "е")
    .trim();

const openKey = ref(null);
const rootRef = ref(null);
function toggle(key) {
  openKey.value = openKey.value === key ? null : key;
}
function closeAll() {
  openKey.value = null;
}
function onOutside(e) {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(e.target)) closeAll();
}
onMounted(() => document.addEventListener("click", onOutside));
onBeforeUnmount(() => document.removeEventListener("click", onOutside));

function selectSingle(key, value) {
  state.value[key] = value;
  closeAll();
}
function toggleMulti(key, value) {
  const arr = Array.isArray(state.value[key]) ? [...state.value[key]] : [];
  const idx = arr.indexOf(value);
  if (idx === -1) arr.push(value);
  else arr.splice(idx, 1);
  state.value[key] = arr;
}
function clearKey(key) {
  state.value[key] = Array.isArray(state.value[key]) ? [] : "";
}

const labelFor = (f) => {
  const v = state.value[f.key];
  if (f.type === "multiselect") {
    if (!Array.isArray(v) || v.length === 0) return f.label;
    if (v.length === 1) return `${f.label}: ${v[0]}`;
    return `${f.label}: ${v.length}`;
  }
  return v ? `${f.label}: ${v}` : f.label;
};
</script>

<template>
  <div class="filters-inline" ref="rootRef">
    <div v-for="f in filters" :key="f.key" class="filter-block">
      <div v-if="f.type === 'select' || f.type === 'sort'" class="psd">
        <button class="psd__toggle" type="button" @click="toggle(f.key)">
          {{ labelFor(f) }}
          <span class="psd__arrow">▾</span>
        </button>

        <ul v-if="openKey === f.key" class="psd__menu">
          <li
            class="psd__option"
            :class="{ 'psd__option--active': norm(state[f.key]) === '' }"
            @click="selectSingle(f.key, '')"
          >
            Все
          </li>
          <li
            v-for="opt in f.options"
            :key="typeof opt === 'string' ? opt : opt.value ?? opt.label"
            class="psd__option"
            :class="{
              'psd__option--active':
                norm(state[f.key]) ===
                norm(typeof opt === 'string' ? opt : opt.value ?? opt.label),
            }"
            @click="
              selectSingle(
                f.key,
                typeof opt === 'string' ? opt : opt.value ?? opt.label
              )
            "
          >
            {{ typeof opt === "string" ? opt : opt.label }}
          </li>
        </ul>
      </div>

      <div v-else-if="f.type === 'multiselect'" class="psd">
        <button class="psd__toggle" type="button" @click="toggle(f.key)">
          {{ labelFor(f) }}
          <span class="psd__arrow">▾</span>
        </button>

        <ul v-if="openKey === f.key" class="psd__menu">
          <li class="psd__option" @click="clearKey(f.key)">Сбросить</li>
          <li
            v-for="opt in f.options"
            :key="opt"
            class="psd__option psd__option--check"
            @click.stop="toggleMulti(f.key, opt)"
          >
            <input
              type="checkbox"
              :checked="
                Array.isArray(state[f.key]) && state[f.key].includes(opt)
              "
              @change="toggleMulti(f.key, opt)"
            />
            <span>{{ opt }}</span>
          </li>
        </ul>
      </div>

      <div v-else class="field">
        <label class="field__label">{{ f.label }}</label>
        <input
          class="field__input"
          v-model="state[f.key]"
          :type="f.type || 'text'"
          :placeholder="f.label"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.filters-inline
  display: inline-flex
  flex-wrap: wrap
  gap: .6rem
  justify-content: center
  align-items: stretch
  width: 100%

.filter-block
  display: inline-flex
  position: relative
  flex: 0 0 auto

.psd__toggle
  padding: .7rem 1rem
  border: none
  border-radius: .5rem
  background: white
  cursor: pointer
  display: inline-flex
  align-items: center
  justify-content: space-between
  min-width: 12rem
  font-size: 1.05rem
  font-family: "Gidole", sans-serif
  color: gray
  outline: none
  box-shadow: none

.psd__arrow
  margin-left: .5rem

.psd__menu
  position: absolute
  top: 100%
  left: 0
  margin-top: .4rem
  background: white
  border: .1rem solid var(--third-color)
  border-radius: .5rem
  box-shadow: 0 4px 12px rgba(0,0,0,.1)
  list-style: none
  padding: 0
  margin: 0
  z-index: 20
  width: 100%
  font-family: "Gidole", sans-serif
  font-size: 1.05rem

.psd__option
  padding: .7rem 1rem
  cursor: pointer
  color: gray
  display: flex
  align-items: center
  gap: .5rem
  &:hover
    background: var(--third-color)
    color: white

.psd__option--active
  font-weight: 600
  background: rgba(0,0,0,.05)
  color: var(--third-color)

.psd__option--check input[type="checkbox"]
  pointer-events: none

.field__label
  font-size: .9rem
  margin-left: .125rem
  color: gray

.field__input
  padding: .7rem 1rem
  border: .1rem solid var(--third-color)
  border-radius: .5rem
  background: white
  min-width: 12rem
  font-size: 1.05rem
  color: gray
  outline: none
  box-shadow: none
</style>
