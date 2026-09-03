import { GuideBlock, FitMode } from '@/data/catalog';
import { DEFAULT_STOCK_NOTE } from '@/components/StockLine';

/** yes — для машин с этим, no — для машин без, any — не влияет на подбор */
export type WireTechValue = 'yes' | 'no' | 'any';
/** Насколько полно проводка сохраняет штатные функции */
export type WireLevel = 'full' | 'basic' | 'limited';

/** С чем проводка умеет работать — по этому отсеиваем неподходящее */
export const WIRE_TECH: { id: string; label: string }[] = [
  { id: 'power', label: 'Питание' },
  { id: 'sound', label: 'Акустика' },
  { id: 'wheel', label: 'Кнопки на руле' },
  { id: 'amp', label: 'Штатный усилитель' },
  { id: 'camera', label: 'Штатная камера' },
  { id: 'can', label: 'CAN-шина' },
];

/** Что останется работать у клиента после установки */
export const WIRE_KEEPS: { id: string; label: string }[] = [
  { id: 'climate', label: 'Климат-контроль на экране' },
  { id: 'wheel', label: 'Кнопки на руле' },
  { id: 'camera', label: 'Штатная камера' },
  { id: 'amp', label: 'Штатный усилитель' },
  { id: 'parktronic', label: 'Парктроники' },
];

export const WIRE_LEVELS: { id: WireLevel; label: string; hint: string }[] = [
  { id: 'full', label: 'Полная', hint: 'Сохраняет всё нужное' },
  { id: 'basic', label: 'Базовая', hint: 'Часть функций теряется' },
  { id: 'limited', label: 'Ограниченная', hint: 'Существенные ограничения' },
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
  /**
   * Подбор проводки. Два блока, и путать их нельзя:
   * wireTech — для каких машин проводка (фильтр, прячет неподходящее),
   * wireKeeps — что останется работать у клиента (объясняет цену).
   */
  wireTech?: Record<string, WireTechValue>;
  wireKeeps?: Record<string, boolean>;
  wireLevel?: '' | WireLevel;
  /** Текст про потерю функций — его видит покупатель */
  wireNote?: string;
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
  wireTech: {},
  wireKeeps: {},
  wireLevel: '',
  wireNote: '',
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