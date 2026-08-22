import { useMemo } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import {
  brandCount,
  buildBrandStats,
  modelCount,
  topBrands,
} from '@/lib/brand-stats';

/**
 * Данные для выбора авто: сколько товаров под каждую марку и модель,
 * какие марки показать плитками сверху и в каком порядке идут модели.
 *
 * Считается один раз на весь каталог и переиспользуется всеми формами
 * подбора — на главной, в фильтре над списком и на странице сценария.
 */
export const useBrandPicker = (brand?: string) => {
  const { products, brands } = useCatalog();

  const stats = useMemo(() => buildBrandStats(products), [products]);

  const popular = useMemo(() => topBrands(brands, stats, 8), [brands, stats]);

  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    brands.forEach((b) => {
      map[b.name] = brandCount(stats, b.name);
    });
    return map;
  }, [brands, stats]);

  /**
   * Модели марки: сначала те, под которые есть оборудование. У Toyota их 95,
   * и алфавит прятал бы ходовые модели в середину списка.
   */
  const models = useMemo(() => {
    const list = brands.find((b) => b.name === brand)?.models ?? [];
    if (!brand) return list;
    return [...list].sort((a, b) => {
      const na = modelCount(stats, brand, a);
      const nb = modelCount(stats, brand, b);
      if (na !== nb) return nb - na;
      return a.localeCompare(b, 'ru');
    });
  }, [brands, brand, stats]);

  const modelCounts = useMemo(() => {
    if (!brand) return {};
    const map: Record<string, number> = {};
    models.forEach((m) => {
      map[m] = modelCount(stats, brand, m);
    });
    return map;
  }, [models, brand, stats]);

  return { popular, brandCounts, models, modelCounts };
};
