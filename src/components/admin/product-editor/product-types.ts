import { GuideBlock, FitMode, BodyType } from '@/data/catalog';
import { DEFAULT_STOCK_NOTE } from '@/components/StockLine';

/** Сторона руля: у праворульных машин штатный разъём другой */
export const WHEEL_SIDES: { id: 'left' | 'right'; label: string }[] = [
  { id: 'left', label: 'Левый руль' },
  { id: 'right', label: 'Правый руль' },
];


export interface AdminProduct {
  id?: number;
  slug?: string;
  sku?: string;
  popularity?: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  /** Цена для дилеров — видна в админке и выгрузке */
  proPrice: number | null;
  ozonUrl: string;
  wbUrl: string;
  install: string;
  warranty: string;
  yearFrom: number;
  yearTo: number;
  badge: string | null;
  images: string[];
  /** Видео товара: файл на своём CDN или ссылка на YouTube/Rutube */
  videoUrl: string;
  description: string[];
  specs: [string, string][];
  kit: string[];
  /** Особенности и нюансы монтажа — блоки текста и фото */
  notes: GuideBlock[];
  /** Дополнительный раздел карточки со своим заголовком */
  extra: GuideBlock[];
  /** Заголовок дополнительного раздела — пустой прячет весь раздел */
  extraTitle: string;
  fits: Record<string, string[]>;
  /**
   * Как подбирается: 'vehicle' — по машине, 'universal' — подходит любой.
   * Пусто — берём умолчание категории.
   */
  fitMode?: '' | FitMode;
  /** Кузова, на которые встаёт проводка. Пусто — любой */
  wireBodies?: BodyType[];
  /** Сторона руля. Пусто — подходит любой */
  wireWheel?: '' | 'left' | 'right';
  /** Артикулы проводок, подходящих к этой рамке. Пусто — не размечено */
  frameWires?: string[];
  /** Проводка уже в коробке с рамкой — отдельно предлагать не надо */
  wireIncluded?: boolean;
  /** Что подключает — id из справочника признаков */
  wireFeatures?: string[];
  /** Подсказка к выбору проводки — пишется у рамки, видна покупателю */
  wireHint?: string;
  /** Текст про потерю функций — его видит покупатель */
  /** Сколько штук на складе. 0 — только под заказ */
  stock?: number;
  /** Что писать покупателю, когда склад пуст */
  stockNote?: string;
  sortOrder: number;
  isActive: boolean;
}

export const emptyProduct = (): AdminProduct => ({
  sku: '',
  popularity: 0,
  name: '',
  category: '',
  price: 0,
  oldPrice: null,
  proPrice: null,
  ozonUrl: '',
  wbUrl: '',
  install: '',
  warranty: '',
  yearFrom: 2015,
  yearTo: new Date().getFullYear(),
  badge: null,
  stock: 0,
  stockNote: DEFAULT_STOCK_NOTE,
  images: [],
  videoUrl: '',
  description: [''],
  specs: [],
  kit: [''],
  notes: [],
  extra: [],
  extraTitle: '',
  fits: {},
  fitMode: '',
  wireBodies: [],
  wireWheel: '',
  frameWires: [],
  wireIncluded: false,
  wireFeatures: [],
  wireHint: '',
  sortOrder: 100,
  isActive: true,
});

export type SetField = <K extends keyof AdminProduct>(
  key: K,
  value: AdminProduct[K],
) => void;

export const label = 'eyebrow block mb-1';
export const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';