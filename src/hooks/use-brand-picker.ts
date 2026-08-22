import { useMemo } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { compareNames } from '@/lib/slug';
import { brandCount, buildBrandStats, modelCount } from '@/lib/brand-stats';

/**
 * Данные для выбора авто: сколько товаров есть под каждую марку и модель.
 * Списки идут по алфавиту, число рядом подсказывает, где выбор богаче.
 *
 * Считается один раз на весь каталог и переиспользуется всеми формами
 * подбора — на главной, в фильтре над списком и на странице сценария.
 */
export const useBrandPicker = (brand?: string) => {
  const { products, brands } = useCatalog();

  const stats = useMemo(() => buildBrandStats(products), [products]);

  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    brands.forEach((b) => {
      map[b.name] = brandCount(stats, b.name);
    });
    return map;
  }, [brands, stats]);

  /** Модели марки по алфавиту — так привычнее всего искать глазами */
  const models = useMemo(() => {
    const list = brands.find((b) => b.name === brand)?.models ?? [];
    return [...list].sort(compareNames);
  }, [brands, brand]);

  const modelCounts = useMemo(() => {
    if (!brand) return {};
    const map: Record<string, number> = {};
    models.forEach((m) => {
      map[m] = modelCount(stats, brand, m);
    });
    return map;
  }, [models, brand, stats]);

  return { brandCounts, models, modelCounts };
};