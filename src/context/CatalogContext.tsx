import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BRANDS as FALLBACK_BRANDS,
  Brand,
  PRODUCTS as FALLBACK_PRODUCTS,
  Product,
} from '@/data/catalog';
import { CATALOG_URL } from '@/lib/api';

interface CatalogValue {
  products: Product[];
  brands: Brand[];
  categories: string[];
  loading: boolean;
  reload: () => void;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export const CatalogProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
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
  }, [tick]);

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
    categories,
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
