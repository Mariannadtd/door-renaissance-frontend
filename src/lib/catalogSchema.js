export const fittingsGroups = [
  { value: "accessories", label: "Аксессуары для дверей" },
  { value: "locks", label: "Дверные замки и защелки" },
  { value: "hinges", label: "Дверные петли" },
  { value: "handles", label: "Дверные ручки" },
];
export const fittingsGroupOptions = fittingsGroups.map((g) => g.label);

export const fittingsSubtypesByGroup = {
  accessories: [
    "автопороги дверные",
    "доводчики",
    "ограничители",
    "фурнитура для дверей купе",
  ],
  locks: ["дверные замки", "задвижки", "защелки", "цилиндры"],
  hinges: [
    "петли накладные (бабочки)",
    "петли разъемные",
    "петли универсальные",
  ],
  handles: [
    "ручки на розетке",
    "ручки купе",
    "ручки с механизмом",
    "ручки стандарт",
  ],
};

export const colorOptions = [
  "хром",
  "никель",
  "матовый никель",
  "бронза",
  "латунь",
  "черный",
  "белый",
  "золото",
  "медь",
];

export const categoryFields = {
  interiors: [
    {
      key: "form",
      label: "Вид",
      type: "select",
      options: ["глухая", "с остеклением", "с зеркалом"],
    },
    { key: "cover", label: "Покрытие", type: "text" },
    { key: "thickness", label: "Толщина", type: "text" },
    { key: "soundproof", label: "Звукоизоляция", type: "text" },
    { key: "molding", label: "Тип погонажа", type: "text" },
    { key: "color", label: "Цвет/отделка", type: "text" },
    { key: "style", label: "Стиль/дизайн", type: "text" },
  ],
  exteriors: [
    {
      key: "form",
      label: "Вид",
      type: "select",
      options: ["с ковкой", "с ковкой / стеклопакетом", "с зеркалом"],
    },
    {
      key: "side",
      label: "Сторона открывания",
      type: "select",
      options: ["правая", "левая", "и правая и левая"],
    },
    {
      key: "latch",
      label: "Ночная задвижка",
      type: "select",
      options: ["есть", "нет"],
    },
    {
      key: "thermalbreak",
      label: "Терморазрыв",
      type: "select",
      options: ["да", "нет"],
    },
    {
      key: "peephole",
      label: "Глазок",
      type: "select",
      options: ["да", "нет"],
    },
    { key: "thickness", label: "Толщина полотна, мм", type: "text" },
    { key: "steelthickness", label: "Толщина стали, мм", type: "text" },
    { key: "insulation", label: "Утепление", type: "text" },
    { key: "locks", label: "Замки", type: "text" },
    { key: "exfinishing", label: "Внешняя отделка", type: "text" },
    { key: "infinishing", label: "Внутренняя отделка", type: "text" },
    { key: "weight", label: "Вес", type: "number" },
    { key: "box", label: "Тип коробки", type: "text" },
    { key: "seal", label: "Контур уплотнения", type: "text" },
    { key: "loops", label: "Петли", type: "text" },
    { key: "handle", label: "Ручка", type: "text" },
    { key: "soundproof", label: "Звукоизоляция", type: "text" },
    { key: "color", label: "Цвет/отделка", type: "text" },
    { key: "style", label: "Стиль/дизайн", type: "text" },
  ],
  floors: [
    {
      key: "form",
      label: "Вид",
      type: "select",
      options: ["ламинат", "кварц винил"],
    },
    {
      key: "class",
      label: "Класс износостойкости",
      type: "select",
      options: ["31", "32", "33", "34", "42", "43", "53"],
    },
    { key: "thickness", label: "Толщина", type: "text" },
    { key: "wideness", label: "Ширина", type: "text" },
    { key: "size", label: "Длина", type: "text" },
    { key: "quantity", label: "Штук в упаковке", type: "text" },
    { key: "metres", label: "Метров в упаковке", type: "text" },
    { key: "facet", label: "Фаска", type: "text" },
    { key: "pattern", label: "Тип рисунка", type: "text" },
    {
      key: "moistureresistance",
      label: "Влагостойкость",
      type: "select",
      options: ["да", "нет"],
    },
    {
      key: "herringbone",
      label: "Возможность укладки ёлочкой",
      type: "select",
      options: ["да", "нет"],
    },
    {
      key: "warmFloor",
      label: "Подходит для тёплого пола",
      type: "select",
      options: ["да", "нет"],
    },
    { key: "packPrice", label: "Цена за пачку", type: "number" },
    {
      key: "substrate",
      label: "Встроенная подложка",
      type: "select",
      options: ["да", "нет"],
    },
    {
      key: "installation",
      label: "Монтаж",
      type: "select",
      options: ["Клеится на основание", "Плавающий, замок", "Замковый"],
    },
    {
      key: "format",
      label: "Формат",
      type: "select",
      options: ["Плитка ", "доска", "ёлочка"],
    },
    {
      key: "surface",
      label: "Поверхность",
      type: "multiselect",
      options: [
        "матовая",
        "полуматовая",
        "глянцевая",
        "текстурная",
        "под дерево",
        "под камень",
      ],
    },
    { key: "color", label: "Цвет/отделка", type: "text" },
  ],
  fittings: [
    { key: "material", label: "Материал (общий)", type: "text" },
    {
      key: "color",
      label: "Цвет/отделка",
      type: "select",
      options: colorOptions,
    },
    { key: "style", label: "Стиль/дизайн", type: "text" },
  ],
};

export const floorFormFields = {
  ламинат: [
    {
      key: "type",
      label: "Тип планки",
      type: "select",
      options: ["1-полосный", "2-полосный", "3-полосный", "Мультиполосный"],
    },
    { key: "cover", label: "Покрытие", type: "text" },
  ],
  "кварц винил": [
    {
      key: "structure",
      label: "Тип кварц-винила",
      type: "select",
      options: [
        "LVT(кварц винил)",
        "SPC(Каменно-полимерная плитка)",
        "WPC(древесно-полимерная плитка)",
      ],
    },
    { key: "cover", label: "Покрытие", type: "text" },
  ],
};

export const fittingsFieldsBySubtype = {
  "автопороги дверные": [
    { key: "material", label: "Материал", type: "text" },
    { key: "color", label: "Цвет/покрытие", type: "text" },
    { key: "length", label: "Длина, мм", type: "number" },
  ],
  доводчики: [
    { key: "doorweight", label: "Вес двери, кг (до)", type: "number" },
    { key: "closingSpeed", label: "Скорость закрывания (класс)", type: "text" },
    {
      key: "installType",
      label: "Тип установки",
      type: "select",
      options: ["врезной", "накладной"],
    },
  ],
  ограничители: [
    {
      key: "mount",
      label: "Крепление",
      type: "select",
      options: ["напольный", "настенный"],
    },
    { key: "material", label: "Материал", type: "text" },
  ],
  "фурнитура для дверей купе": [
    { key: "set", label: "Комплект", type: "select", options: ["да", "нет"] },
    { key: "rollersCount", label: "Количество роликов", type: "number" },
  ],
  "дверные замки": [
    {
      key: "lockType",
      label: "Тип замка",
      type: "select",
      options: ["врезной", "накладной"],
    },
    {
      key: "latchMaterial",
      label: "Материал язычка",
      type: "select",
      options: ["магнитный", "металлический"],
    },
    { key: "securityClass", label: "Класс взломостойкости", type: "text" },
    { key: "backset", label: "Backset (мм)", type: "number" },
    {
      key: "purpose",
      label: "Назначение",
      type: "select",
      options: ["межкомнатный", "санузел", "входной"],
    },
    {
      key: "installType",
      label: "Тип установки",
      type: "select",
      options: ["врезной", "накладной"],
    },
  ],
  задвижки: [
    { key: "material", label: "Материал", type: "text" },
    { key: "color", label: "Цвет/отделка", type: "text" },
  ],
  защелки: [
    {
      key: "latchType",
      label: "Тип защелки",
      type: "select",
      options: ["магнитная", "механическая"],
    },
    {
      key: "installType",
      label: "Тип установки",
      type: "select",
      options: ["врезная", "накладная"],
    },
  ],
  цилиндры: [
    { key: "size", label: "Размер цилиндра", type: "text" },
    { key: "keys", label: "Количество ключей", type: "number" },
    {
      key: "protection",
      label: "Защита",
      type: "multiselect",
      options: ["от высверливания", "от бампинга", "от отмычек"],
    },
  ],
  "петли накладные (бабочки)": [
    { key: "size", label: "Размер", type: "text" },
    { key: "material", label: "Материал", type: "text" },
    { key: "color", label: "Цвет/отделка", type: "text" },
  ],
  "петли разъемные": [
    {
      key: "side",
      label: "Сторонность",
      type: "select",
      options: ["левая", "правая", "универсальная"],
    },
    {
      key: "bearing",
      label: "Подшипниковые",
      type: "select",
      options: ["да", "нет"],
    },
  ],
  "петли универсальные": [
    {
      key: "bearing",
      label: "Подшипниковые",
      type: "select",
      options: ["да", "нет"],
    },
    { key: "size", label: "Размер", type: "text" },
  ],
  "ручки на розетке": [
    {
      key: "baseShape",
      label: "Основание",
      type: "select",
      options: ["круглое", "квадратное"],
    },
    {
      key: "installType",
      label: "Тип установки",
      type: "select",
      options: ["врезная", "накладная"],
    },
    { key: "style", label: "Стиль/дизайн", type: "text" },
  ],
  "ручки купе": [
    {
      key: "installType",
      label: "Тип установки",
      type: "select",
      options: ["врезная", "накладная"],
    },
    { key: "material", label: "Материал", type: "text" },
    { key: "color", label: "Цвет/отделка", type: "text" },
  ],
  "ручки с механизмом": [
    {
      key: "mechanism",
      label: "Механизм",
      type: "select",
      options: ["WC", "EURO", "санузел"],
    },
    {
      key: "centerDistance",
      label: "Межосевое расстояние, мм",
      type: "number",
    },
    {
      key: "baseShape",
      label: "Основание",
      type: "select",
      options: ["круглое", "квадратное"],
    },
  ],
  "ручки стандарт": [
    {
      key: "rosette",
      label: "Розетка",
      type: "select",
      options: ["круглая", "квадратная"],
    },
    {
      key: "installType",
      label: "Тип установки",
      type: "select",
      options: ["врезная", "накладная"],
    },
  ],
};

export const fittingsExtrasByValue = {
  mechanism: {
    WC: [{ key: "turnType", label: "Тип фиксатора", type: "text" }],
  },
  latchType: {
    магнитная: [
      { key: "holdForce", label: "Сила удержания (Н)", type: "number" },
    ],
  },
};

export function initialForm() {
  return {
    name: "",
    category: "",
    description: "",
    price: null,
    isHit: "",

    manufacturer: "",
    manufacturerName: "",

    form: "",
    cover: "",
    thickness: "",
    soundproof: "",
    molding: "",
    steelthickness: "",
    insulation: "",
    locks: "",
    exfinishing: "",
    infinishing: "",
    weight: "",
    box: "",
    seal: "",
    side: "",
    loops: "",
    handle: "",
    latch: "",
    peephole: "",
    surface: [],
    wideness: "",
    size: "",
    quantity: "",
    metres: "",
    moistureresistance: "",
    substrate: "",
    facet: "",
    pattern: "",
    installation: "",
    format: "",
    thermalbreak: "",

    color: "",
    style: "",

    class: "",
    type: "",
    structure: "",

    fittingGroup: "",
    fittingSubtype: "",
    material: "",
  };
}

export const selectFirst = (arr = []) => {
  const sel = [];
  const other = [];
  for (const f of arr) {
    if (f?.type === "select" || f?.type === "multiselect") sel.push(f);
    else other.push(f);
  }
  return [...sel, ...other];
};

export function categoryLabel(key) {
  return (
    {
      interiors: "Межкомнатные двери",
      exteriors: "Входные двери",
      fittings: "Фурнитура",
      floors: "Напольные покрытия",
    }[key] || key
  );
}

export function formatPrice(val) {
  return Math.round(Number(val) || 0).toLocaleString("ru-RU");
}

export function formatDate(ts) {
  const d = ts?.toDate?.();
  return d ? d.toLocaleString("ru-RU") : "";
}
