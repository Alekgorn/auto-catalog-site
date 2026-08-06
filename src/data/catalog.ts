export type Category = string;

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  oldPrice?: number;
  mount: string;
  install: string;
  warranty: string;
  fits: Record<string, string[]>; // марка -> модели
  years: [number, number];
  badge?: string;
  images?: string[];
  description?: string[];
  specs?: [string, string][];
  kit?: string[];
  guides?: string[];
}

export type GuideBlock =
  | { type: 'text'; text: string }
  | { type: 'step'; title: string; text: string; image?: string }
  | { type: 'image'; image: string; caption?: string }
  | { type: 'note'; text: string };

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
}

export const BRANDS: Brand[] = [
  { name: 'Lada', models: ['Vesta SW Cross', 'Granta', 'Niva Travel', 'Largus', 'XRAY'] },
  { name: 'Toyota', models: ['RAV4', 'Camry', 'Land Cruiser Prado', 'Corolla'] },
  { name: 'Kia', models: ['Rio', 'Sportage', 'Seltos', 'Ceed'] },
  { name: 'Hyundai', models: ['Creta', 'Solaris', 'Tucson', 'Santa Fe'] },
  { name: 'Volkswagen', models: ['Polo', 'Tiguan', 'Touareg', 'Teramont'] },
  { name: 'Renault', models: ['Duster', 'Logan', 'Arkana', 'Kaptur'] },
];

export const YEARS: number[] = Array.from({ length: 17 }, (_, i) => 2026 - i);

export const CATEGORIES: Category[] = [
  'Фаркопы',
  'Багажники',
  'Пороги',
  'Защита',
  'Салон',
  'Электроника',
];

const ALL = (models: string[]) => models;

export const PRODUCTS: Product[] = [
  {
    id: 'tow-01',
    name: 'Фаркоп съёмный, шар типа A',
    category: 'Фаркопы',
    price: 14900,
    oldPrice: 17400,
    mount: '6 штатных точек лонжерона',
    install: '2,5 часа',
    warranty: '5 лет',
    years: [2015, 2026],
    badge: 'Хит',
    fits: {
      Lada: ALL(['Vesta SW Cross', 'Granta', 'Niva Travel', 'Largus']),
      Kia: ['Rio', 'Sportage', 'Seltos'],
      Hyundai: ['Creta', 'Solaris', 'Tucson'],
      Renault: ['Duster', 'Logan', 'Kaptur'],
    },
  },
  {
    id: 'tow-02',
    name: 'Фаркоп усиленный, нагрузка 2000 кг',
    category: 'Фаркопы',
    price: 23400,
    mount: '8 штатных точек рамы',
    install: '3 часа',
    warranty: '5 лет',
    years: [2012, 2026],
    fits: {
      Toyota: ['Land Cruiser Prado', 'RAV4'],
      Volkswagen: ['Tiguan', 'Touareg', 'Teramont'],
      Hyundai: ['Santa Fe', 'Tucson'],
    },
  },
  {
    id: 'tow-03',
    name: 'Розетка фаркопа 7-pin с блоком согласования',
    category: 'Электроника',
    price: 4800,
    mount: 'штатный разъём проводки',
    install: '1 час',
    warranty: '2 года',
    years: [2014, 2026],
    fits: {
      Lada: ['Vesta SW Cross', 'Granta', 'Niva Travel', 'Largus', 'XRAY'],
      Kia: ['Rio', 'Sportage', 'Seltos', 'Ceed'],
      Toyota: ['RAV4', 'Camry', 'Corolla'],
      Hyundai: ['Creta', 'Solaris'],
      Volkswagen: ['Polo', 'Tiguan'],
      Renault: ['Duster', 'Logan', 'Arkana', 'Kaptur'],
    },
  },
  {
    id: 'rail-01',
    name: 'Рейлинги продольные, алюминий',
    category: 'Багажники',
    price: 11200,
    oldPrice: 13000,
    mount: '4 штатных точки в крыше',
    install: '1,5 часа',
    warranty: '3 года',
    years: [2016, 2026],
    badge: 'Акция',
    fits: {
      Lada: ['Vesta SW Cross', 'Niva Travel', 'Largus', 'XRAY'],
      Renault: ['Duster', 'Kaptur'],
      Hyundai: ['Creta', 'Tucson'],
      Kia: ['Sportage', 'Seltos'],
    },
  },
  {
    id: 'rail-02',
    name: 'Поперечины на рейлинги, замок',
    category: 'Багажники',
    price: 7600,
    mount: 'на рейлинг, без сверления',
    install: '30 минут',
    warranty: '3 года',
    years: [2010, 2026],
    fits: {
      Lada: ['Vesta SW Cross', 'Niva Travel', 'Largus'],
      Toyota: ['RAV4', 'Land Cruiser Prado'],
      Volkswagen: ['Tiguan', 'Touareg', 'Teramont'],
      Kia: ['Sportage', 'Seltos', 'Ceed'],
      Hyundai: ['Creta', 'Tucson', 'Santa Fe'],
      Renault: ['Duster', 'Kaptur', 'Arkana'],
    },
  },
  {
    id: 'rail-03',
    name: 'Бокс на крышу 430 л, двустороннее открытие',
    category: 'Багажники',
    price: 32900,
    mount: 'на поперечины',
    install: '20 минут',
    warranty: '3 года',
    years: [2010, 2026],
    fits: {
      Lada: ['Vesta SW Cross', 'Niva Travel', 'Largus'],
      Toyota: ['RAV4', 'Land Cruiser Prado', 'Camry'],
      Volkswagen: ['Tiguan', 'Touareg', 'Teramont'],
      Kia: ['Sportage', 'Seltos'],
      Hyundai: ['Creta', 'Tucson', 'Santa Fe'],
      Renault: ['Duster', 'Kaptur'],
    },
  },
  {
    id: 'step-01',
    name: 'Пороги-подножки Ø60, нержавейка',
    category: 'Пороги',
    price: 15800,
    mount: '6 штатных точек порога',
    install: '2 часа',
    warranty: '5 лет',
    years: [2014, 2026],
    fits: {
      Toyota: ['RAV4', 'Land Cruiser Prado'],
      Volkswagen: ['Tiguan', 'Touareg', 'Teramont'],
      Kia: ['Sportage', 'Seltos'],
      Hyundai: ['Tucson', 'Santa Fe', 'Creta'],
      Renault: ['Duster', 'Kaptur'],
      Lada: ['Niva Travel'],
    },
  },
  {
    id: 'step-02',
    name: 'Накладки на пороги с подсветкой',
    category: 'Салон',
    price: 3900,
    mount: 'штатный проём двери',
    install: '40 минут',
    warranty: '1 год',
    years: [2015, 2026],
    fits: {
      Lada: ['Vesta SW Cross', 'Granta', 'XRAY', 'Largus'],
      Kia: ['Rio', 'Ceed', 'Seltos'],
      Hyundai: ['Solaris', 'Creta'],
      Volkswagen: ['Polo', 'Tiguan'],
    },
  },
  {
    id: 'prot-01',
    name: 'Защита картера, сталь 2 мм',
    category: 'Защита',
    price: 6700,
    oldPrice: 8100,
    mount: '4 штатных точки подрамника',
    install: '1 час',
    warranty: '3 года',
    years: [2012, 2026],
    badge: 'Акция',
    fits: {
      Lada: ['Vesta SW Cross', 'Granta', 'Niva Travel', 'Largus', 'XRAY'],
      Kia: ['Rio', 'Sportage', 'Seltos', 'Ceed'],
      Hyundai: ['Creta', 'Solaris', 'Tucson'],
      Volkswagen: ['Polo', 'Tiguan'],
      Renault: ['Duster', 'Logan', 'Arkana', 'Kaptur'],
      Toyota: ['RAV4', 'Camry', 'Corolla'],
    },
  },
  {
    id: 'prot-02',
    name: 'Защита картера композит, 5 кг',
    category: 'Защита',
    price: 12400,
    mount: '4 штатных точки подрамника',
    install: '1 час',
    warranty: '3 года',
    years: [2018, 2026],
    fits: {
      Toyota: ['RAV4', 'Camry'],
      Volkswagen: ['Tiguan', 'Teramont'],
      Kia: ['Seltos', 'Sportage'],
      Hyundai: ['Tucson', 'Santa Fe'],
    },
  },
  {
    id: 'int-01',
    name: 'Коврики 3D с бортом, полиуретан',
    category: 'Салон',
    price: 5400,
    mount: 'штатные пистоны крепления',
    install: '10 минут',
    warranty: '2 года',
    years: [2012, 2026],
    badge: 'Хит',
    fits: {
      Lada: ['Vesta SW Cross', 'Granta', 'Niva Travel', 'Largus', 'XRAY'],
      Toyota: ['RAV4', 'Camry', 'Corolla', 'Land Cruiser Prado'],
      Kia: ['Rio', 'Sportage', 'Seltos', 'Ceed'],
      Hyundai: ['Creta', 'Solaris', 'Tucson', 'Santa Fe'],
      Volkswagen: ['Polo', 'Tiguan', 'Touareg', 'Teramont'],
      Renault: ['Duster', 'Logan', 'Arkana', 'Kaptur'],
    },
  },
  {
    id: 'int-02',
    name: 'Органайзер в багажник по размеру ниши',
    category: 'Салон',
    price: 4300,
    mount: 'штатная ниша багажника',
    install: '5 минут',
    warranty: '1 год',
    years: [2014, 2026],
    fits: {
      Lada: ['Vesta SW Cross', 'Largus', 'Niva Travel'],
      Kia: ['Rio', 'Seltos'],
      Hyundai: ['Creta', 'Solaris'],
      Renault: ['Duster', 'Arkana'],
    },
  },
  {
    id: 'el-01',
    name: 'Парктроник задний, 4 датчика',
    category: 'Электроника',
    price: 8900,
    mount: 'бампер + штатная проводка',
    install: '2 часа',
    warranty: '2 года',
    years: [2010, 2026],
    fits: {
      Lada: ['Vesta SW Cross', 'Granta', 'Niva Travel', 'Largus', 'XRAY'],
      Kia: ['Rio', 'Ceed'],
      Hyundai: ['Solaris'],
      Renault: ['Duster', 'Logan'],
      Volkswagen: ['Polo'],
    },
  },
  {
    id: 'el-02',
    name: 'Камера заднего вида в штатную ручку',
    category: 'Электроника',
    price: 6300,
    oldPrice: 7500,
    mount: 'штатное место подсветки номера',
    install: '1,5 часа',
    warranty: '2 года',
    years: [2013, 2026],
    badge: 'Акция',
    fits: {
      Lada: ['Vesta SW Cross', 'Granta', 'XRAY'],
      Kia: ['Rio', 'Ceed', 'Sportage'],
      Hyundai: ['Solaris', 'Creta'],
      Volkswagen: ['Polo', 'Tiguan'],
      Toyota: ['Camry', 'Corolla'],
      Renault: ['Logan', 'Duster'],
    },
  },
  {
    id: 'el-03',
    name: 'Автозапуск с подогревом по таймеру',
    category: 'Электроника',
    price: 19700,
    mount: 'штатная CAN-шина',
    install: '4 часа',
    warranty: '3 года',
    years: [2016, 2026],
    fits: {
      Toyota: ['RAV4', 'Camry', 'Corolla', 'Land Cruiser Prado'],
      Kia: ['Sportage', 'Seltos', 'Ceed'],
      Hyundai: ['Creta', 'Tucson', 'Santa Fe'],
      Volkswagen: ['Tiguan', 'Teramont', 'Touareg'],
      Lada: ['Vesta SW Cross'],
    },
  },
  {
    id: 'prot-03',
    name: 'Брызговики по форме арки, комплект',
    category: 'Защита',
    price: 2600,
    mount: 'штатные отверстия арки',
    install: '30 минут',
    warranty: '1 год',
    years: [2010, 2026],
    fits: {
      Lada: ['Vesta SW Cross', 'Granta', 'Niva Travel', 'Largus', 'XRAY'],
      Kia: ['Rio', 'Sportage', 'Seltos', 'Ceed'],
      Hyundai: ['Creta', 'Solaris', 'Tucson', 'Santa Fe'],
      Volkswagen: ['Polo', 'Tiguan', 'Touareg', 'Teramont'],
      Renault: ['Duster', 'Logan', 'Arkana', 'Kaptur'],
      Toyota: ['RAV4', 'Camry', 'Corolla', 'Land Cruiser Prado'],
    },
  },
];

const CDN = 'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files';

export const CATEGORY_IMAGE: Record<string, string> = {
  Фаркопы: `${CDN}/fcf688e9-5495-4909-be55-168c2564db75.jpg`,
  Багажники: `${CDN}/4bd3a1e3-6cdb-45c5-acb8-fd0a9f503bc5.jpg`,
  Пороги: `${CDN}/3022b2c3-6f89-48b6-b0ce-b9977c4ef7db.jpg`,
  Защита: `${CDN}/d0077366-191f-49c5-b2b3-f6fce4e87c4d.jpg`,
  Салон: `${CDN}/e38bb980-05fa-4ea9-a5f5-7dd8c8832c79.jpg`,
  Электроника: `${CDN}/080bcf61-fb74-4ef1-9fd2-ba14e17e180d.jpg`,
};

export const MOUNT_IMAGE = `${CDN}/f2b8d406-8103-4372-93fb-79a0bef9cd0b.jpg`;

export const PLACEHOLDER_IMAGE = MOUNT_IMAGE;

export const productImages = (p: Product): string[] =>
  p.images && p.images.length
    ? p.images
    : [CATEGORY_IMAGE[p.category] ?? PLACEHOLDER_IMAGE, MOUNT_IMAGE];

export const productDescription = (p: Product): string[] =>
  p.description && p.description.length
    ? p.description
    : [
        `${p.name} — позиция из категории «${p.category.toLowerCase()}». Изделие рассчитано под конкретный кузов: геометрия повторяет заводские размеры, поэтому установка идёт в ${p.mount} без сверления и вмешательства в силовые элементы.`,
        `Комплект поставляется с крепежом и инструкцией. Среднее время работ в нашем сервисе — ${p.install}. После установки выдаём отметку в заказ-наряде, гарантия на изделие и работы — ${p.warranty}.`,
        'Перед отправкой каждая позиция проверяется по контрольному образцу кузова, а совместимость с вашей машиной мы подтверждаем по VIN при подтверждении заказа.',
      ];

export const productSpecs = (p: Product): [string, string][] =>
  p.specs && p.specs.length
    ? p.specs
    : [
        ['Категория', p.category],
        ['Точки крепления', p.mount],
        ['Годы выпуска авто', `${p.years[0]}—${p.years[1]}`],
        ['Время установки', p.install],
        ['Гарантия', p.warranty],
        ['Сверление кузова', 'не требуется'],
        ['Артикул', p.id.toUpperCase()],
        ['Наличие', 'на складе'],
      ];

export const productKit = (p: Product): string[] =>
  p.kit && p.kit.length
    ? p.kit
    : [
        p.name,
        'Крепёжный комплект под штатные точки',
        'Инструкция по установке',
        'Гарантийный талон',
      ];

export const productsByCategory = (
  p: Product,
  all: Product[] = PRODUCTS,
  limit = 3,
): Product[] => all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, limit);

export interface Vehicle {
  brand: string;
  model: string;
  year: number;
}

export const isCompatible = (product: Product, v: Vehicle | null): boolean => {
  if (!v) return true;
  const models = product.fits[v.brand];
  if (!models || !models.includes(v.model)) return false;
  return v.year >= product.years[0] && v.year <= product.years[1];
};

export const formatPrice = (n: number): string =>
  n.toLocaleString('ru-RU') + ' ₽';