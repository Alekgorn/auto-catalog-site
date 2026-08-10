import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BRANDS as FALLBACK_BRANDS,
  Brand,
  Guide,
  PRODUCTS as FALLBACK_PRODUCTS,
  Product,
} from '@/data/catalog';
import { CATALOG_URL } from '@/lib/api';
import { compareNames } from '@/lib/slug';
import {
  DEFAULT_CONTACTS,
  DEFAULT_FAQ,
  DEFAULT_FILTER_BLOCKS,
  DEFAULT_SHORTCUTS,
  HeroShortcut,
  FaqItem,
  FilterBlockKey,
  SiteContacts,
} from '@/lib/site-settings';

export interface PrerenderData {
  products?: Product[];
  brands?: Brand[];
  categories?: string[];
  categorySpecs?: Record<string, string[]>;
  guides?: Guide[];
  settings?: {
    card_fields?: string[];
    contacts?: Partial<SiteContacts>;
    faq?: FaqItem[];
    filter_blocks?: FilterBlockKey[];
    shortcuts?: HeroShortcut[];
    shortcuts_hidden?: boolean;
  };
}

interface CatalogValue {
  products: Product[];
  brands: Brand[];
  guides: Guide[];
  categories: string[];
  categorySpecs: Record<string, string[]>;
  cardFields: string[];
  contacts: SiteContacts;
  faq: FaqItem[];
  filterBlocks: FilterBlockKey[];
  shortcuts: HeroShortcut[];
  shortcutsHidden: boolean;
  loading: boolean;
  reload: () => void;
}

const CatalogContext = createContext<CatalogValue | null>(null);

const DEFAULT_CARD_FIELDS = ['warranty'];

/** Данные, вшитые в HTML на этапе сборки, чтобы первый экран не ждал сеть. */
const bootData = (): PrerenderData | null => {
  if (typeof window === 'undefined') return null;
  const raw = (window as unknown as { __CATALOG__?: PrerenderData }).__CATALOG__;
  return raw && typeof raw === 'object' ? raw : null;
};

export const CatalogProvider = ({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: PrerenderData;
}) => {
  const seed = initialData ?? bootData();
  const isPrerender = typeof window === 'undefined';

  const [products, setProducts] = useState<Product[]>(
    seed?.products?.length ? seed.products : FALLBACK_PRODUCTS,
  );
  const [brands, setBrands] = useState<Brand[]>(
    seed?.brands?.length ? seed.brands : FALLBACK_BRANDS,
  );
  const [guides, setGuides] = useState<Guide[]>(seed?.guides ?? []);
  const [cardFields, setCardFields] = useState<string[]>(
    seed?.settings?.card_fields?.length
      ? seed.settings.card_fields
      : DEFAULT_CARD_FIELDS,
  );
  const [contacts, setContacts] = useState<SiteContacts>({
    ...DEFAULT_CONTACTS,
    ...(seed?.settings?.contacts ?? {}),
  });
  const [faq, setFaq] = useState<FaqItem[]>(
    seed?.settings?.faq?.length ? seed.settings.faq : DEFAULT_FAQ,
  );
  const [filterBlocks, setFilterBlocks] = useState<FilterBlockKey[]>(
    seed?.settings?.filter_blocks?.length
      ? seed.settings.filter_blocks
      : DEFAULT_FILTER_BLOCKS,
  );
  const [shortcuts, setShortcuts] = useState<HeroShortcut[]>(
    seed?.settings?.shortcuts?.length ? seed.settings.shortcuts : DEFAULT_SHORTCUTS,
  );
  const [shortcutsHidden, setShortcutsHidden] = useState<boolean>(
    seed?.settings?.shortcuts_hidden === true,
  );
  const [catalogCategories, setCatalogCategories] = useState<string[]>(
    seed?.categories ?? [],
  );
  const [categorySpecs, setCategorySpecs] = useState<Record<string, string[]>>(
    seed?.categorySpecs ?? {},
  );
  const [loading, setLoading] = useState(!seed && !isPrerender);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isPrerender) return;
    let cancelled = false;
    setLoading(true);
    fetch(CATALOG_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.products) && data.products.length) {
          setProducts(data.products);
        }
        if (Array.isArray(data.brands) && data.brands.length) {
          // Марки и модели — по алфавиту, чтобы работала прокрутка по буквам
          setBrands(
            [...data.brands]
              .sort((a, b) => compareNames(a.name, b.name))
              .map((b) => ({
                ...b,
                models: [...(b.models ?? [])].sort(compareNames),
              })),
          );
        }
        if (Array.isArray(data.guides)) {
          setGuides(data.guides);
        }
        if (Array.isArray(data.categories)) {
          setCatalogCategories(data.categories);
        }
        if (data.categorySpecs && typeof data.categorySpecs === 'object') {
          setCategorySpecs(data.categorySpecs);
        }
        if (Array.isArray(data.settings?.card_fields)) {
          setCardFields(data.settings.card_fields);
        }
        if (data.settings?.contacts && typeof data.settings.contacts === 'object') {
          setContacts({ ...DEFAULT_CONTACTS, ...data.settings.contacts });
        }
        if (Array.isArray(data.settings?.faq) && data.settings.faq.length) {
          setFaq(data.settings.faq);
        }
        if (Array.isArray(data.settings?.filter_blocks)) {
          setFilterBlocks(data.settings.filter_blocks);
        }
        if (Array.isArray(data.settings?.shortcuts) && data.settings.shortcuts.length) {
          setShortcuts(data.settings.shortcuts);
        }
        setShortcutsHidden(data.settings?.shortcuts_hidden === true);
      })
      .catch(() => {
        /* остаёмся на встроенных данных */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick, isPrerender]);

  // Порядок категорий задаётся в админке; товары без категории тоже показываем
  const categories = useMemo(() => {
    const set = [...catalogCategories];
    products.forEach((p) => {
      if (p.category && !set.includes(p.category)) set.push(p.category);
    });
    return set;
  }, [products, catalogCategories]);

  const value: CatalogValue = {
    products,
    brands,
    guides,
    categories,
    categorySpecs,
    cardFields,
    contacts,
    faq,
    filterBlocks,
    shortcuts,
    shortcutsHidden,
    loading,
    reload: () => setTick((t) => t + 1),
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = (): CatalogValue => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
};