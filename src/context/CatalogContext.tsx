import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BRANDS as FALLBACK_BRANDS,
  Brand,
  Guide,
  PRODUCTS as FALLBACK_PRODUCTS,
  Product,
} from '@/data/catalog';
import { CATALOG_URL } from '@/lib/api';

export interface PrerenderData {
  products?: Product[];
  brands?: Brand[];
  guides?: Guide[];
  settings?: { card_fields?: string[] };
}

interface CatalogValue {
  products: Product[];
  brands: Brand[];
  guides: Guide[];
  categories: string[];
  cardFields: string[];
  loading: boolean;
  reload: () => void;
}

const CatalogContext = createContext<CatalogValue | null>(null);

const DEFAULT_CARD_FIELDS = ['mount', 'warranty'];

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
          setBrands(data.brands);
        }
        if (Array.isArray(data.guides)) {
          setGuides(data.guides);
        }
        if (Array.isArray(data.settings?.card_fields)) {
          setCardFields(data.settings.card_fields);
        }
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

  const categories = useMemo(() => {
    const set: string[] = [];
    products.forEach((p) => {
      if (!set.includes(p.category)) set.push(p.category);
    });
    return set;
  }, [products]);

  const value: CatalogValue = {
    products,
    brands,
    guides,
    categories,
    cardFields,
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
