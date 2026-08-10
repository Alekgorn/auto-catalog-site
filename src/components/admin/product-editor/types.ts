export interface AdminProduct {
  id?: number;
  slug?: string;
  sku?: string;
  popularity?: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  /** Цена для дилеров */
  proPrice: number | null;
  install: string;
  warranty: string;
  yearFrom: number;
  yearTo: number;
  badge: string | null;
  images: string[];
  description: string[];
  specs: [string, string][];
  kit: string[];
  fits: Record<string, string[]>;
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
  install: '',
  warranty: '',
  yearFrom: 2015,
  yearTo: new Date().getFullYear(),
  badge: null,
  images: [],
  description: [''],
  specs: [],
  kit: [''],
  fits: {},
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
