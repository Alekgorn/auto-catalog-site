import { findFitModels, hasFitModel } from '@/lib/fits-match';

export type Category = string;

/** Как товар подбирают покупателю */
export type FitMode = 'vehicle' | 'universal';

/** Тип кузова автомобиля */
export type BodyType =
  | 'sedan'
  | 'hatchback'
  | 'liftback'
  | 'wagon'
  | 'suv'
  | 'crossover'
  | 'jeep'
  | 'pickup'
  | 'minivan'
  | 'van'
  | 'coupe'
  | 'cabrio';

/** Названия кузовов для покупателя и админки */
export const BODY_TYPES: { id: BodyType; label: string }[] = [
  { id: 'sedan', label: 'Седан' },
  { id: 'hatchback', label: 'Хэтчбек' },
  { id: 'liftback', label: 'Лифтбек' },
  { id: 'wagon', label: 'Универсал' },
  { id: 'crossover', label: 'Кроссовер' },
  { id: 'suv', label: 'Внедорожник' },
  { id: 'jeep', label: 'Джип' },
  { id: 'pickup', label: 'Пикап' },
  { id: 'minivan', label: 'Минивэн' },
  { id: 'van', label: 'Фургон' },
  { id: 'coupe', label: 'Купе' },
  { id: 'cabrio', label: 'Кабриолет' },
];

export const bodyTypeLabel = (id: string): string =>
  BODY_TYPES.find((b) => b.id === id)?.label ?? id;

export interface Product {
  id: string;
  sku?: string;
  popularity?: number;
  /** Когда товар добавили — по нему собираем блок новинок */
  createdAt?: string | null;
  name: string;
  category: Category;
  /** Подраздел внутри категории — например, тип регистратора */
  subcategory?: string;
  price: number;
  oldPrice?: number;
  /** Цена для дилеров — показывается в дилерском режиме */
  proPrice?: number | null;
  /** Ссылка на товар в Ozon */
  ozonUrl?: string;
  /** Ссылка на товар в Wildberries */
  wbUrl?: string;
  /** Сколько штук на складе. 0 — только под заказ */
  stock?: number;
  /** Что писать, когда товара нет на складе */
  stockNote?: string;
  install: string;
  warranty: string;
  fits: Record<string, string[]>; // марка -> модели
  /**
   * Как товар подбирают покупателю:
   *  'vehicle'   — делается под конкретную машину, решают марка, модель и год;
   *  'universal' — подойдёт любой машине, список моделей ему не нужен.
   * Приходит с сервера уже с учётом умолчания категории.
   */
  fitMode?: FitMode;
  /** Кузова, на которые встаёт проводка. Пусто — подходит любому */
  wireBodies?: BodyType[];
  /** Сторона руля: left | right. Пусто — подходит любой */
  wireWheel?: 'left' | 'right' | '';
  /** Проводки, подходящие к этой рамке — по ним работает подбор */
  frameWires?: string[];
  /** Проводка уже в комплекте рамки — шаг подключения пропускаем */
  wireIncluded?: boolean;
  /** Что подключает — id из справочника признаков */
  wireFeatures?: string[];
  /** Подсказка к выбору проводки — пишется у рамки, видна покупателю */
  wireHint?: string;
  years: [number, number];
  badge?: string;
  images?: string[];
  /** Видео товара: файл на своём CDN или ссылка на YouTube/Rutube */
  videoUrl?: string;
  description?: string[];
  specs?: [string, string][];
  kit?: string[];
  /** Особенности и нюансы монтажа — блоки текста и фото */
  notes?: GuideBlock[];
  /**
   * Дополнительный раздел карточки с произвольным заголовком:
   * скриншоты экрана, примеры работы, фото в салоне. Пустой —
   * на сайте не показывается вовсе.
   */
  extra?: GuideBlock[];
  /** Заголовок этого раздела — магазин пишет его сам */
  extraTitle?: string;
  guides?: string[];
}

export type GuideBlock =
  | { type: 'text'; text: string }
  | { type: 'step'; title: string; text: string; image?: string }
  | { type: 'image'; image: string; caption?: string }
  | { type: 'note'; text: string }
  /* Свой файл на CDN или ссылка на YouTube/Rutube — что именно,
     определяет parseVideo по самой ссылке (src/lib/video.ts) */
  | { type: 'video'; video: string; caption?: string };

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  duration: string;
  difficulty: string;
  tools: string[];
  blocks: GuideBlock[];
  products: string[];
}

export interface Brand {
  name: string;
  models: string[];
  /** Тип кузова каждой модели: { "Rio": ["sedan", "hatchback"] } */
  modelBodies?: Record<string, BodyType[]>;
}

/** Какие кузова бывают у этой модели */
export const modelBodyTypes = (
  brands: Brand[],
  brand: string,
  model: string,
): BodyType[] => {
  const b = brands.find((x) => x.name === brand);
  return b?.modelBodies?.[model] ?? [];
};

export const BRANDS: Brand[] = [
  { name: "Lada", models: ["Vesta SW Cross", "Granta", "Niva Travel", "Largus", "XRAY"] },
  { name: "Toyota", models: ["RAV4", "Camry", "Land Cruiser Prado", "Corolla"] },
  { name: "Kia", models: ["Rio", "Sportage", "Seltos", "Ceed"] },
  { name: "Hyundai", models: ["Creta", "Solaris", "Tucson", "Santa Fe"] },
  { name: "Volkswagen", models: ["Polo", "Tiguan", "Touareg", "Teramont"] },
  { name: "Renault", models: ["Duster", "Logan", "Arkana", "Kaptur"] },
];

/** Годы выпуска: с 2026 до 1989, от новых к старым. */
export const YEARS: number[] = Array.from(
  { length: 2026 - 1989 + 1 },
  (_, i) => 2026 - i,
);

export const CATEGORIES: Category[] = [
  "Android-магнитолы",
  "Камеры и парктроники",
  "Видеорегистраторы",
  "Жгуты и адаптеры",
  "Комплектующие для установщиков",
  "Акустика и шумоизоляция",
];

export const PRODUCTS: Product[] = [
  {
    id: "gu-mazda-2din",
    sku: "GU-MZ-2D",
    name: "Android-магнитола 2DIN под Mazda 6, 4/64 ГБ",
    category: "Android-магнитолы",
    price: 24900,
    oldPrice: 28900,
    install: "",
    warranty: "2 года",
    years: [2012, 2019],
    badge: "Хит",
    popularity: 95,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/2fd32ca6-a108-470d-afae-04abcea23f71.jpg"],
    description: ["Головное устройство под штатную рамку Mazda 6 GJ. Ставится в заводскую шахту без подрезки панели, штатные кнопки на руле подхватываются через CAN-адаптер из комплекта.", "Процессор 8 ядер, 4 ГБ оперативной и 64 ГБ постоянной памяти. Экран IPS 2.5D с антибликовым покрытием, слот под SIM и модуль Wi-Fi 5 ГГц.", "Разъём ISO 104-pin совместим со штатной косой, отдельный выход питания на камеру заднего вида и вход для микрофона."],
    specs: [["Платформа", "Android 13"], ["Процессор", "8 ядер, UIS7862"], ["Память", "4 ГБ RAM / 64 ГБ ROM"], ["Экран", "10.1\", IPS 1280x720"], ["Разъёмы", "ISO 104-pin, USB 2.0 x2, AUX"], ["Функции", "CAN-bus, кнопки на руле, выход питания на камеру"], ["Связь", "Wi-Fi 2.4/5 ГГц, Bluetooth 5.0, 4G (слот SIM)"], ["Питание", "12 В, ток покоя < 5 мА"], ["Типоразмер", "2DIN, штатная рамка"], ["Артикул", "GU-MZ-2D"]],
    kit: ["Головное устройство", "Переходная рамка", "Жгут ISO с CAN-модулем", "GPS-антенна", "Микрофон", "Инструкция"],
    fits: {"Mazda": ["6", "CX-5", "3"]},
  },
  {
    id: "gu-univ-1din",
    sku: "GU-U-1D",
    name: "Android-магнитола 1DIN с выдвижным экраном 7\"",
    category: "Android-магнитолы",
    price: 18900,
    install: "",
    warranty: "2 года",
    years: [2005, 2026],
    popularity: 80,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/2fd32ca6-a108-470d-afae-04abcea23f71.jpg"],
    description: ["Универсальное устройство в шахту 1DIN с выдвижным поворотным экраном. Подходит для машин, где штатное место рассчитано только на однослотовую магнитолу.", "Экран убирается в корпус при выключении, угол наклона регулируется. Есть выход на усилитель и вход камеры заднего вида."],
    specs: [["Платформа", "Android 12"], ["Процессор", "4 ядра"], ["Память", "2 ГБ RAM / 32 ГБ ROM"], ["Экран", "7\", выдвижной поворотный"], ["Разъёмы", "ISO 2x8, RCA 4 канала, вход камеры"], ["Функции", "Кнопки на руле (аналоговый вход), Bluetooth-звонки"], ["Связь", "Wi-Fi 2.4 ГГц, Bluetooth 5.0"], ["Питание", "12 В, предохранитель 10 А"], ["Типоразмер", "1DIN, глубина 165 мм"], ["Артикул", "GU-U-1D"]],
    kit: ["Головное устройство", "Жгут ISO", "GPS-антенна", "Микрофон", "Крепёжные салазки"],
    fits: {"Lada": ["Granta", "Niva Travel", "Largus"], "Renault": ["Logan", "Duster"]},
  },
  {
    id: "cam-dynamic-01",
    sku: "CAM-DYN-01",
    name: "Камера заднего вида с динамической разметкой, 1080p",
    category: "Камеры и парктроники",
    price: 4900,
    oldPrice: 6200,
    install: "",
    warranty: "2 года",
    years: [2010, 2026],
    badge: "Хит",
    popularity: 98,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/46089fe7-2fee-47e8-8865-5e427ff516b7.jpg"],
    description: ["Камера заднего вида с траекторией, которая поворачивается вместе с рулём. Разметка строится по данным угла поворота с CAN-шины, поэтому линии показывают реальный коридор движения.", "Матрица CMOS с подсветкой в ночном режиме, стекло объектива с антизапотевающим покрытием. Корпус залит компаундом, класс защиты IP68."],
    specs: [["Тип матрицы", "CMOS 1/3\""], ["Разрешение", "1920x1080, ночное видение"], ["Угол обзора", "170°"], ["Разметка", "Динамическая (поворачивается с рулём)"], ["Освещённость", "0.1 люкс"], ["Защита", "IP68, рабочая от -30 до +70 °C"], ["Питание", "12 В, потребление 120 мА"], ["Кабель", "6 м видеокабель + провод питания"], ["Артикул", "CAM-DYN-01"]],
    kit: ["Камера", "Видеокабель 6 м", "Провод питания", "Крепёжная рамка", "Гермовводы"],
    fits: {"Kia": ["Rio", "Sportage", "Seltos"], "Mazda": ["6", "CX-5"], "Hyundai": ["Creta", "Solaris", "Tucson"]},
  },
  {
    id: "cam-front-01",
    sku: "CAM-FR-01",
    name: "Камера переднего вида в решётку радиатора",
    category: "Камеры и парктроники",
    price: 5400,
    install: "",
    warranty: "2 года",
    years: [2012, 2026],
    popularity: 60,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/46089fe7-2fee-47e8-8865-5e427ff516b7.jpg"],
    description: ["Камера переднего вида для парковки в упор и выезда из закрытого двора. Ставится в решётку радиатора или под эмблему, включается кнопкой или автоматически при скорости ниже 20 км/ч."],
    specs: [["Тип матрицы", "CMOS 1/4\""], ["Разрешение", "1280x720"], ["Угол обзора", "150°"], ["Разметка", "Статическая, отключаемая"], ["Защита", "IP67"], ["Питание", "12 В, 90 мА"], ["Кабель", "4 м"], ["Артикул", "CAM-FR-01"]],
    kit: ["Камера", "Видеокабель 4 м", "Кронштейн", "Кнопка включения"],
    fits: {"Kia": ["Sportage", "Seltos"], "Toyota": ["Camry", "RAV4"], "Volkswagen": ["Polo", "Tiguan"]},
  },
  {
    id: "park-8-01",
    sku: "PARK-8",
    name: "Парктроник на 8 датчиков с врезкой в бампер",
    category: "Камеры и парктроники",
    price: 6800,
    oldPrice: 8400,
    install: "",
    warranty: "1 год",
    years: [2005, 2026],
    popularity: 55,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/46089fe7-2fee-47e8-8865-5e427ff516b7.jpg"],
    description: ["Парковочная система на 8 датчиков: 4 сзади и 4 спереди. Блок определяет расстояние до препятствия и выводит его на дисплей, звук нарастает по мере приближения.", "Датчики красятся в цвет кузова, комплект фрез для врезки идёт в комплекте."],
    specs: [["Датчики", "8 шт, диаметр 22 мм"], ["Дальность", "0.3–2.5 м"], ["Точность", "±10 см"], ["Индикация", "LED-дисплей + зуммер"], ["Разъёмы", "Штекерные, влагозащищённые"], ["Питание", "12 В, от заднего хода и габаритов"], ["Артикул", "PARK-8"]],
    kit: ["Блок управления", "8 датчиков", "Дисплей", "Жгут проводки", "Фреза 22 мм"],
    fits: {"Kia": ["Rio"], "Lada": ["Vesta SW Cross", "Granta"], "Hyundai": ["Solaris", "Creta"], "Renault": ["Duster", "Logan"]},
  },
  {
    id: "reg-combo-01",
    sku: "REG-CMB-01",
    name: "Комбо-регистратор с радар-детектором и GPS",
    category: "Видеорегистраторы",
    price: 12900,
    oldPrice: 15400,
    install: "",
    warranty: "2 года",
    years: [2005, 2026],
    badge: "Хит",
    popularity: 92,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/56ab39af-5770-47be-9951-32e75585b6df.jpg"],
    description: ["Три устройства в одном корпусе: видеорегистратор, радар-детектор и GPS-информер по камерам. Питание берётся от штатной цепи зеркала, провод убирается под потолок.", "Сигнатурный модуль отсекает ложные срабатывания от автоматических дверей и парктроников других машин."],
    specs: [["Разрешение видео", "2560x1440 @30 к/с"], ["Матрица", "Sony IMX335"], ["Угол обзора", "160°"], ["Радар-модуль", "Сигнатурный, X/K/Ka/Laser"], ["GPS-база", "Камеры РФ, обновляемая"], ["Экран", "2.4\" IPS"], ["Питание", "12/24 В, разъём mini-USB"], ["Память", "microSD до 256 ГБ"], ["Артикул", "REG-CMB-01"]],
    kit: ["Регистратор", "Кронштейн 3M", "Кабель питания 4 м", "Съёмник обшивки"],
    fits: {"Kia": ["Sportage"], "Lada": ["Vesta SW Cross"], "Mazda": ["6", "CX-5"], "Toyota": ["Camry", "RAV4"]},
  },
  {
    id: "reg-mirror-01",
    sku: "REG-MIR-01",
    name: "Регистратор-зеркало с камерой заднего вида",
    category: "Видеорегистраторы",
    price: 9400,
    install: "",
    warranty: "1 год",
    years: [2005, 2026],
    popularity: 70,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/56ab39af-5770-47be-9951-32e75585b6df.jpg"],
    description: ["Зеркало заднего вида со встроенным экраном и двумя камерами. Задняя камера работает и как парковочная: при включении задней передачи картинка выводится на всё зеркало."],
    specs: [["Экран", "10\" сенсорный, стрим-режим"], ["Передняя камера", "1920x1080"], ["Задняя камера", "1280x720, IP67"], ["Угол обзора", "140° / 120°"], ["Крепление", "Резинки на штатное зеркало"], ["Питание", "12 В, прикуриватель или врезка"], ["Память", "microSD до 128 ГБ"], ["Артикул", "REG-MIR-01"]],
    kit: ["Зеркало-регистратор", "Задняя камера", "Кабель 6 м", "Крепёжные резинки"],
    fits: {"Lada": ["Granta", "Largus"], "Renault": ["Logan", "Duster"], "Volkswagen": ["Polo"]},
  },
  {
    id: "zhgut-mazda-can",
    sku: "ZH-MZ-CAN",
    name: "Жгут проводки ISO с CAN-модулем для Mazda",
    category: "Жгуты и адаптеры",
    price: 3900,
    install: "",
    warranty: "2 года",
    years: [2012, 2022],
    popularity: 88,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/7987888d-f38b-4e62-b990-ab6339f65c33.jpg"],
    description: ["Переходной жгут для установки Android-магнитолы без резки штатной проводки. Один конец — штатный разъём Mazda (JAE), другой — ISO 104-pin под головное устройство.", "Встроенный CAN-модуль передаёт нажатия кнопок на руле, сигнал зажигания и данные парктроника. Отдельная жила выдаёт +12 В на камеру заднего хода."],
    specs: [["Совместимость", "Android 10+, RAM 4 ГБ"], ["Разъёмы", "ISO 104-pin, штатный разъём Mazda (JAE)"], ["Функции", "Поддержка кнопок на руле, CAN-bus, выдача питания на камеру"], ["Длина кабеля", "1.2 м"], ["Сечение силовых жил", "1.0 мм²"], ["Ток по линии камеры", "до 1 А"], ["Прошивка", "Обновляемая по USB"], ["Артикул", "ZH-MZ-CAN"]],
    kit: ["Жгут с CAN-модулем", "Переходник антенны", "Инструкция по прописке"],
    fits: {"Mazda": ["6", "CX-5", "3"]},
  },
  {
    id: "ramka-2din-kia",
    sku: "RAM-KIA-2D",
    name: "Переходная рамка 2DIN под Kia Rio",
    category: "Жгуты и адаптеры",
    price: 2400,
    install: "",
    warranty: "1 год",
    years: [2017, 2023],
    popularity: 45,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/2fd32ca6-a108-470d-afae-04abcea23f71.jpg"],
    description: ["Рамка под штатную панель Kia Rio 4. Литой ABS-пластик под цвет заводской отделки, посадочные уши совпадают с заводскими точками — подрезка не нужна."],
    specs: [["Типоразмер", "2DIN, 178x102 мм"], ["Материал", "ABS, шагрень под оригинал"], ["Крепление", "4 штатных уха"], ["Комплект", "Рамка + салазки"], ["Артикул", "RAM-KIA-2D"]],
    kit: ["Рамка", "Салазки", "Саморезы"],
    fits: {"Kia": ["Rio", "Seltos"]},
  },
  {
    id: "pin-set-01",
    sku: "PIN-SET-01",
    name: "Набор пинов и фишек для ремонта разъёмов, 240 шт",
    category: "Комплектующие для установщиков",
    price: 2900,
    oldPrice: 3600,
    install: "",
    warranty: "—",
    years: [2005, 2026],
    badge: "Акция",
    popularity: 75,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/d4c74ba7-cb75-41d4-80bd-dfc13b2911a4.jpg"],
    description: ["Набор контактов и колодок для восстановления штатных разъёмов. В кейсе 240 позиций: мама и папа под сечения 0.5–2.5 мм², колодки на 2, 4, 6 и 8 контактов.", "Расходник для установщика: пригодится, когда штатная фишка рассыпалась или нужно нарастить косу."],
    specs: [["Количество", "240 шт в кейсе"], ["Сечения", "0.5 / 1.0 / 1.5 / 2.5 мм²"], ["Колодки", "2, 4, 6, 8 контактов"], ["Материал контакта", "Луженая медь"], ["Ток на контакт", "до 15 А"], ["Кейс", "Пластиковый, 12 секций"], ["Артикул", "PIN-SET-01"]],
    kit: ["Кейс", "Контакты 240 шт", "Колодки", "Съёмник контактов"],
    fits: {},
  },
  {
    id: "termo-set-01",
    sku: "TERMO-01",
    name: "Термоусадка с клеевым слоем, набор 320 шт",
    category: "Комплектующие для установщиков",
    price: 1400,
    install: "",
    warranty: "—",
    years: [2005, 2026],
    popularity: 50,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/d4c74ba7-cb75-41d4-80bd-dfc13b2911a4.jpg"],
    description: ["Термоусадочные трубки с внутренним клеевым слоем: при нагреве клей заполняет полость и даёт герметичное соединение. Подходит для наружной проводки и подкапотного пространства."],
    specs: [["Количество", "320 шт, 8 диаметров"], ["Диаметры", "1.6–13 мм"], ["Коэффициент усадки", "3:1"], ["Клеевой слой", "Есть"], ["Рабочая температура", "-55 до +125 °C"], ["Напряжение", "до 600 В"], ["Артикул", "TERMO-01"]],
    kit: ["Кейс", "Трубки 320 шт"],
    fits: {},
  },
  {
    id: "dinamiki-165",
    sku: "DIN-165",
    name: "Динамики коаксиальные 16.5 см, 2 полосы",
    category: "Акустика и шумоизоляция",
    price: 4200,
    oldPrice: 5100,
    install: "",
    warranty: "1 год",
    years: [2005, 2026],
    popularity: 65,
    images: ["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/5d2e44a7-5298-48dd-8cd7-0d6bdab1d25d.jpg"],
    description: ["Коаксиальная пара в штатное место передних дверей. Диффузор из полипропилена с резиновым подвесом, шёлковый твитер. Работают от штатной магнитолы без усилителя."],
    specs: [["Типоразмер", "16.5 см (6.5\")"], ["Мощность", "60 Вт RMS / 180 Вт пик"], ["Сопротивление", "4 Ом"], ["Чувствительность", "91 дБ"], ["Диапазон", "65–20000 Гц"], ["Глубина посадки", "52 мм"], ["Артикул", "DIN-165"]],
    kit: ["Пара динамиков", "Проставочные кольца", "Решётки", "Крепёж"],
    fits: {"Kia": ["Rio"], "Lada": ["Vesta SW Cross", "Granta", "Largus"], "Hyundai": ["Solaris"], "Renault": ["Logan", "Duster"]},
  },
];

const CDN = 'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files';

export const CATEGORY_IMAGE: Record<string, string> = {
  'Android-магнитолы': `${CDN}/2fd32ca6-a108-470d-afae-04abcea23f71.jpg`,
  'Камеры и парктроники': `${CDN}/46089fe7-2fee-47e8-8865-5e427ff516b7.jpg`,
  Видеорегистраторы: `${CDN}/56ab39af-5770-47be-9951-32e75585b6df.jpg`,
  'Жгуты и адаптеры': `${CDN}/7987888d-f38b-4e62-b990-ab6339f65c33.jpg`,
  'Комплектующие для установщиков': `${CDN}/d4c74ba7-cb75-41d4-80bd-dfc13b2911a4.jpg`,
  'Акустика и шумоизоляция': `${CDN}/5d2e44a7-5298-48dd-8cd7-0d6bdab1d25d.jpg`,
};

export const PLACEHOLDER_IMAGE = `${CDN}/7987888d-f38b-4e62-b990-ab6339f65c33.jpg`;

export const productImages = (p: Product): string[] =>
  p.images && p.images.length
    ? p.images
    : [CATEGORY_IMAGE[p.category] ?? PLACEHOLDER_IMAGE];

export const productDescription = (p: Product): string[] =>
  p.description && p.description.length
    ? p.description
    : [
        `${p.name} — позиция из категории «${p.category.toLowerCase()}». Подключение идёт в штатные разъёмы: заводскую проводку резать не нужно.`,
        `В комплекте переходники и схема подключения. Гарантия — ${p.warranty}.`,
        'Каждая позиция проверяется на стенде перед отправкой, а совместимость с вашей машиной подтверждаем по VIN при обработке заявки.',
      ];

export const productSku = (p: Product): string => p.sku || p.id.toUpperCase();

export const productSpecs = (p: Product): [string, string][] =>
  p.specs && p.specs.length
    ? p.specs
    : [
        ['Категория', p.category],
        ['Годы выпуска авто', `${p.years[0]}—${p.years[1]}`],
        ['Гарантия', p.warranty],
        ['Артикул', productSku(p)],
        ['Наличие', 'на складе'],
      ];

export const CARD_FIELDS: { key: string; label: string; get: (p: Product) => string }[] = [
  { key: 'sku', label: 'Артикул', get: (p) => productSku(p) },
  { key: 'warranty', label: 'Гарантия', get: (p) => p.warranty },
  { key: 'category', label: 'Категория', get: (p) => p.category },
  { key: 'years', label: 'Годы авто', get: (p) => `${p.years[0]}—${p.years[1]}` },
];

export const searchProducts = (products: Product[], query: string): Product[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);

  const scored = products.map((p) => {
    const models = Object.entries(p.fits ?? {})
      .map(([b, m]) => `${b} ${m.join(' ')}`)
      .join(' ');
    const haystack = `${p.name} ${p.category} ${productSku(p)} ${models}`.toLowerCase();

    if (productSku(p).toLowerCase() === q) return { p, score: 1000 };

    const hits = words.filter((w) => haystack.includes(w)).length;
    if (hits === 0) return { p, score: 0 };

    let score = hits * 10;
    if (p.name.toLowerCase().includes(q)) score += 50;
    if (hits === words.length) score += 25;
    score += (p.popularity ?? 0) / 100;
    return { p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p);
};

export const productKit = (p: Product): string[] =>
  p.kit && p.kit.length
    ? p.kit
    : [
        p.name,
        'Переходники и крепёж',
        'Схема подключения',
        'Гарантийный талон',
      ];

/**
 * Похожее оборудование: тот же раздел плюс совпадение по сути товара.
 *
 * Раньше брались первые попавшиеся позиции раздела, и к рамке на Honda
 * предлагались рамки на Audi и BMW — формально та же категория, а купить
 * нечего. Теперь сначала идут те, что встают на те же машины, потом —
 * близкие по цене, и только затем остальные из раздела.
 *
 * Отдельно требуем пересечение по авто, если оно у товара задано: для
 * рамок и переходников марка решает всё. Универсальные позиции (без
 * списка машин) считаем подходящими всем.
 */
export const productsByCategory = (
  p: Product,
  all: Product[] = PRODUCTS,
  limit = 3,
): Product[] => {
  const own = Object.entries(p.fits ?? {});
  const ownKeys = new Set(
    own.flatMap(([b, ms]) => ms.map((m) => `${b.toLowerCase()}|${String(m).toLowerCase()}`)),
  );

  /** Сколько машин у товара общих с исходным */
  const shared = (x: Product): number => {
    if (!ownKeys.size) return 0;
    const keys = Object.entries(x.fits ?? {}).flatMap(([b, ms]) =>
      ms.map((m) => `${b.toLowerCase()}|${String(m).toLowerCase()}`),
    );
    if (!keys.length) return 0;
    return keys.filter((k) => ownKeys.has(k)).length;
  };

  const near = (x: Product): number =>
    p.price > 0 ? Math.abs(x.price - p.price) / p.price : 0;

  return all
    .filter((x) => x.category === p.category && x.id !== p.id)
    .map((x) => ({ x, common: shared(x), gap: near(x) }))
    // Товар привязан к машинам — предлагаем только то, что встаёт на те же
    .filter((r) => !ownKeys.size || r.common > 0 || !Object.keys(r.x.fits ?? {}).length)
    .sort((a, b) => b.common - a.common || a.gap - b.gap)
    .slice(0, limit)
    .map((r) => r.x);
};

/**
 * «С этим товаром покупают»: позиции из ДРУГИХ разделов, которые встают
 * на ту же машину. К магнитоле это рамка и проводка — то, без чего
 * покупка не поедет, а не ещё одна магнитола.
 */
export const productsWithThis = (
  p: Product,
  all: Product[] = PRODUCTS,
  limit = 8,
): Product[] => {
  const own = Object.entries(p.fits ?? {});
  const ownKeys = new Set(
    own.flatMap(([b, ms]) => ms.map((m) => `${b.toLowerCase()}|${String(m).toLowerCase()}`)),
  );
  if (!ownKeys.size) return [];

  const shared = (x: Product): number => {
    const keys = Object.entries(x.fits ?? {}).flatMap(([b, ms]) =>
      ms.map((m) => `${b.toLowerCase()}|${String(m).toLowerCase()}`),
    );
    return keys.filter((k) => ownKeys.has(k)).length;
  };

  const byCategory = new Map<string, Product[]>();
  all
    .filter((x) => x.category !== p.category && x.id !== p.id)
    .map((x) => ({ x, common: shared(x) }))
    .filter((r) => r.common > 0)
    .sort((a, b) => b.common - a.common || a.x.price - b.x.price)
    .forEach((r) => {
      const list = byCategory.get(r.x.category) ?? [];
      list.push(r.x);
      byCategory.set(r.x.category, list);
    });

  /* Берём по кругу из каждого раздела: иначе весь блок займут рамки,
     которых в каталоге на порядок больше, чем всего остального */
  const out: Product[] = [];
  const lists = [...byCategory.values()];
  for (let i = 0; out.length < limit; i += 1) {
    const before = out.length;
    lists.forEach((l) => {
      if (l[i] && out.length < limit) out.push(l[i]);
    });
    if (out.length === before) break;
  }
  return out;
};

export interface Vehicle {
  brand: string;
  model: string;
  year: number;
}

/**
 * В товаре не отмечена ни одна марка — значит ограничений по авто нет.
 * Такую позицию честно показываем как подходящую всем машинам, даже
 * когда покупатель уже выбрал свою.
 */
export const fitsAll = (product: Product): boolean =>
  Object.keys(product.fits ?? {}).length === 0;

/**
 * Незаконченный выбор авто: марка есть, модель и год — не обязательно.
 * Нужен для каталога, который сужается на каждом шаге, а не только
 * после полностью заполненной формы.
 */
export interface PartialVehicle {
  brand: string;
  model?: string;
  year?: number;
}

/**
 * Подходит ли товар под то, что уже выбрано. Незаполненные шаги не
 * ограничивают: указана только марка — проверяем марку, добавили модель —
 * проверяем марку с моделью, и так далее.
 */
export const matchesPartial = (
  product: Product,
  v: PartialVehicle | null,
  /** Показывать товары без привязки к авто — они подходят всем машинам */
  withUniversal = true,
): boolean => {
  if (!v?.brand) return true;
  if (fitsAll(product)) return withUniversal;
  const models = findFitModels(product.fits, v.brand);
  if (!models) return false;
  if (v.model && !hasFitModel(models, v.model)) return false;
  if (v.year && (v.year < product.years[0] || v.year > product.years[1]))
    return false;
  return true;
};

export const isCompatible = (product: Product, v: Vehicle | null): boolean => {
  if (!v) return true;
  const models = findFitModels(product.fits, v.brand);
  if (!models || !hasFitModel(models, v.model)) return false;
  return v.year >= product.years[0] && v.year <= product.years[1];
};

/**
 * Универсальный товар — подходит любой машине: регистраторы, камеры,
 * шумоизоляция, расходка, магнитолы. При подборе по авто такие не
 * отбрасываем, но показываем ниже профильных.
 *
 * Раньше это вычислялось догадкой «марок не указано или указано больше 80%
 * всех». Порог был взят с потолка: товар на 43 марки считался универсальным,
 * на 42 — уже нет. Теперь у товара есть явное поле, а 80% остались лишь
 * запасным вариантом на случай старых данных без него.
 */
export const isUniversal = (product: Product, totalBrands: number): boolean => {
  if (product.fitMode) return product.fitMode === 'universal';
  const brands = Object.keys(product.fits ?? {}).length;
  if (!brands) return true;
  if (!totalBrands) return false;
  return brands / totalBrands >= 0.8;
};

/**
 * Подходит ли товар машине с учётом универсальных позиций.
 * Возвращает 'exact' — прямое совпадение, 'universal' — подходит как
 * универсальный, null — не подходит.
 */
export const matchVehicle = (
  product: Product,
  v: Vehicle | null,
  totalBrands: number,
): 'exact' | 'universal' | null => {
  if (!v) return 'exact';
  if (isCompatible(product, v)) return 'exact';
  if (isUniversal(product, totalBrands)) return 'universal';
  return null;
};

/**
 * Делит подборку на точные попадания и универсальные позиции.
 * Покупателю важно видеть сначала то, что гарантированно встанет на его
 * машину, а «подойдёт почти всем» — отдельным блоком ниже, чтобы он не
 * принял расходник за подобранную под авто деталь.
 */
export const splitByFit = <T,>(
  items: T[],
  getProduct: (item: T) => Product,
  vehicle: Vehicle | null,
  /**
   * Проверка «встанет на эту машину» помимо списка совместимости.
   * Нужна магнитолам: они не привязаны к марке, но упираются в размер
   * рамки — под Solaris есть рамки 9″ и 12,3″, значит десятидюймовую
   * ставить некуда. Без неё магнитолы целиком считаются универсальными
   * и пропадают, стоит покупателю скрыть «подходящее всем».
   */
  alsoFits?: (product: Product) => boolean,
): { exact: T[]; universal: T[] } => {
  if (!vehicle) return { exact: items, universal: [] };
  const exact: T[] = [];
  const universal: T[] = [];
  items.forEach((item) => {
    const p = getProduct(item);
    if (isCompatible(p, vehicle) || alsoFits?.(p)) exact.push(item);
    else universal.push(item);
  });
  return { exact, universal };
};

export const formatPrice = (n: number): string =>
  n.toLocaleString('ru-RU') + ' ₽';
/**
 * Признак подключения из справочника (настройки админки).
 * ask — задавать ли по нему вопрос покупателю при подборе.
 */
export interface WireFeature {
  id: string;
  label: string;
  ask?: boolean;
}
