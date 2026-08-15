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

export const DEFAULT_SHORTCUTS: HeroShortcut[] = [
  { label: 'Магнитолы', category: 'Android-магнитолы', icon: 'Radio' },
  { label: 'Проводка', category: 'Жгуты и адаптеры', icon: 'Cable' },
  { label: 'Камеры', category: 'Камеры и парктроники', icon: 'Camera' },
  { label: 'Регистраторы', category: 'Видеорегистраторы', icon: 'Video' },
  { label: 'Весь каталог', category: '', icon: 'LayoutGrid' },
];

/** Ссылка для звонка из человекочитаемого номера. */
export const telHref = (phone: string) => `tel:+${phone.replace(/\D/g, '')}`;