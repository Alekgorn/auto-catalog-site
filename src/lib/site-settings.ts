export interface SiteContacts {
  phone: string;
  email: string;
  address: string;
  hours: string;
  telegram: string;
  whatsapp: string;
  /** Профиль в мессенджере MAX — туда же присылают фото торпедо */
  max: string;
}

/**
 * Реквизиты продавца.
 *
 * Для дистанционной торговли их обязан показывать каждый магазин, а без
 * них не пройти модерацию в Директе, на Маркете и Авито для бизнеса.
 * Держим одной структурой: в футере идёт короткая строка, на странице
 * контактов — полный состав.
 */
export interface SellerDetails {
  /** «Индивидуальный предприниматель Иванов Иван Иванович» */
  legalName: string;
  /** Короткое имя для футера: «ИП Иванов И. И.» */
  shortName: string;
  inn: string;
  ogrnip: string;
  /** БИК обслуживающего банка */
  bik: string;
}

export const SELLER: SellerDetails = {
  legalName: 'Индивидуальный предприниматель Горностай Алексей Дмитриевич',
  shortName: 'ИП Горностай А. Д.',
  inn: '780416076049',
  ogrnip: '325784700223981',
  bik: '044525104',
};

/**
 * Счётчики Яндекса. Номер Метрики и код подтверждения Вебмастера
 * хранятся в настройках, чтобы их можно было менять без правки кода.
 */
export interface SiteAnalytics {
  /** Номер счётчика Яндекс.Метрики — только цифры */
  metrika: string;
  /** Код из мета-тега подтверждения прав в Яндекс.Вебмастере */
  webmaster: string;
  /** Вебвизор: запись действий посетителей */
  webvisor: boolean;
}

export const DEFAULT_ANALYTICS: SiteAnalytics = {
  metrika: '',
  webmaster: '',
  webvisor: true,
};

/**
 * Из вставленного кода вытаскиваем сам номер счётчика: в админку часто
 * копируют весь скрипт целиком, а не голые цифры.
 */
export const metrikaId = (value: string) => {
  const v = String(value ?? '').trim();
  if (/^\d+$/.test(v)) return v;
  const m = v.match(/ym\((\d{5,})/) || v.match(/watch\/(\d{5,})/);
  return m ? m[1] : '';
};

/**
 * Код подтверждения Вебмастера. Принимаем и готовый мета-тег целиком,
 * и одно значение content — руками его выковыривать не должны.
 */
export const webmasterCode = (value: string) => {
  const v = String(value ?? '').trim();
  if (!v) return '';
  const m = v.match(/content=["']([^"']+)["']/i);
  return (m ? m[1] : v).trim();
};

export interface FaqItem {
  q: string;
  a: string;
}

export const DEFAULT_CONTACTS: SiteContacts = {
  phone: '8 800 333-44-55',
  email: 'zakaz@shtatno.ru',
  address: 'Москва, Кировоградская, 24, стр. 3',
  hours: 'Пн–Сб, 09:00 — 20:00',
  telegram: 'https://t.me/Alekgorn',
  whatsapp: '',
  max: '+79119639671',
};

/**
 * Ссылка на мессенджер MAX. Открыть диалог по одному номеру телефона там
 * нельзя — в отличие от WhatsApp такой ссылки в MAX не существует.
 * Поэтому ссылку делаем только из готового адреса или никнейма,
 * а голый номер отдаём как номер (его показываем для поиска в приложении).
 */
export const maxHref = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (/^max\.ru\//i.test(v)) return `https://${v}`;
  // Только цифры — это телефон, рабочей ссылки из него не собрать
  if (/^[\d\s+()-]+$/.test(v)) return '';
  return `https://max.ru/${v.replace(/^@/, '')}`;
};

/** Номер для поиска в MAX, если вместо ссылки указан телефон. */
export const maxPhone = (value: string) => {
  const v = value.trim();
  return !v || maxHref(v) ? '' : v;
};

/** Ссылка на Telegram: принимаем и «@имя», и полный адрес. */
export const tgHref = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://t.me/${v.replace(/^@/, '')}`;
};

export const DEFAULT_FAQ: FaqItem[] = [
  {
    q: 'Что будет с заводской гарантией на автомобиль?',
    a: 'Останется. Штатную проводку не режем: подключение идёт через переходной жгут в заводскую фишку и CAN-адаптер. Всё обратимо — при желании возвращается к стоку за полчаса.',
  },
  {
    q: 'В каталоге нет моей модели — что делать?',
    a: 'Оставьте заявку с маркой, моделью и годом. Часть позиций мы возим под заказ: срок 3–10 дней. Если под вашу машину заводского решения нет, честно скажем об этом, а не предложим «универсальное».',
  },
  {
    q: 'Какая гарантия на само оборудование?',
    a: 'От 1 года на расходные материалы до 2 лет на магнитолы, камеры и регистраторы. Срок указан в карточке каждой позиции.',
  },
  {
    q: 'Можно поставить самому?',
    a: 'Да, большинство позиций ставятся без пайки. В комплекте идут переходной жгут, рамка и схема подключения по цветам — остаётся снять панель и состыковать разъёмы.',
  },
  {
    q: 'Сохранятся ли кнопки на руле?',
    a: 'Да, если в комплекте или отдельно взят CAN-адаптер под вашу модель. Он же передаёт скорость, заднюю передачу и данные штатных парктроников на магнитолу.',
  },
  {
    q: 'Как оформить возврат?',
    a: 'Товар без следов монтажа принимаем обратно в течение 14 дней. Если позиция не подошла по нашей ошибке в подборе — обмен и доставку берём на себя.',
  },
  {
    q: 'Работаете с установщиками и СТО?',
    a: 'Да. Для сервисов и частных установщиков есть оптовые цены, расходка со склада, схемы подключения по моделям и документы для юрлица. Напишите — пришлём прайс.',
  },
];

/** Поля фильтра, которые можно скрыть из боковой панели каталога. */
export const FILTER_BLOCKS = [
  { key: 'categories', label: 'Категории' },
  { key: 'price', label: 'Цена' },
  { key: 'badges', label: 'Хиты и скидки' },
  { key: 'warranties', label: 'Гарантия' },
] as const;

export type FilterBlockKey = (typeof FILTER_BLOCKS)[number]['key'];

export const DEFAULT_FILTER_BLOCKS: FilterBlockKey[] = [
  'categories',
  'price',
  'badges',
  'warranties',
];

/** Кнопка-якорь под слоганом на главной. */
export interface HeroShortcut {
  /** Подпись на кнопке */
  label: string;
  /** Категория каталога, на которую ведёт кнопка. Пусто — весь каталог */
  category: string;
  /** Название иконки или ссылка на картинку */
  icon: string;
}

/**
 * Направления ассортимента под слоганом. Это не полный список категорий,
 * а укрупнённые группы: посетитель должен за секунду понять, что здесь
 * автоэлектроника, а не запчасти и механика.
 */
export const DEFAULT_SHORTCUTS: HeroShortcut[] = [
  { label: 'Магнитолы', category: 'Android магнитолы', icon: 'Radio' },
  {
    label: 'Рамки и переходники',
    category: 'Переходные рамки для магнитол',
    icon: 'Frame',
  },
  {
    label: 'Проводка и разъёмы',
    category: 'Переходники для подключения магнитол',
    icon: 'Cable',
  },
  { label: 'Камеры и парковка', category: 'Камеры заднего вида', icon: 'Camera' },
  { label: 'Шумоизоляция', category: 'Шумоизоляция', icon: 'Volume2' },
  { label: 'Весь каталог', category: '', icon: 'LayoutGrid' },
];

/** Активная точка на схеме автомобиля в первом экране. */
export interface HeroHotspot {
  /** Постоянный код точки — задаёт её место на схеме */
  key: string;
  /** Подпись рядом с точкой */
  label: string;
  /** Куда ведёт: путь сайта (/search?q=…) или внешний адрес */
  href: string;
}

/** Места на схеме, которые можно подписать и связать со ссылкой. */
export const HOTSPOT_SLOTS: { key: string; title: string }[] = [
  { key: 'headunit', title: 'Магнитола (центр панели)' },
  { key: 'dvr', title: 'Видеорегистратор (лобовое стекло)' },
  { key: 'camera', title: 'Камера (задняя часть)' },
  { key: 'parking', title: 'Парктроники (передний бампер)' },
  { key: 'frame', title: 'Рамка и жгут (низ панели)' },
  { key: 'car', title: 'Вся машина (клик по кузову)' },
];

export const DEFAULT_HOTSPOTS: HeroHotspot[] = [
  {
    key: 'headunit',
    label: 'Android-магнитола',
    href: '/search?q=Android%20магнитолы',
  },
  {
    key: 'dvr',
    label: 'Видеорегистратор',
    href: '/search?q=Видеорегистраторы',
  },
  {
    key: 'camera',
    label: 'Камера заднего вида',
    href: '/search?q=Камеры заднего вида',
  },
  { key: 'parking', label: 'Парктроники', href: '/search?q=Парктроники' },
  {
    key: 'frame',
    label: 'Рамка и жгут',
    href: '/search?q=Переходные рамки для магнитол',
  },
  { key: 'car', label: 'Подобрать по машине', href: '/#select' },
];

/** Ссылка для звонка из человекочитаемого номера. */
export const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, '')}`;