import { useMemo } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { compareNames } from '@/lib/slug';

/**
 * Модели выбранной марки — по алфавиту.
 *
 * У Toyota их 95, у Nissan 64, поэтому порядок важен: алфавит привычнее
 * всего, глаз сам находит нужное место в списке.
 */
export const useBrandPicker = (brand?: string) => {
  const { brands } = useCatalog();

  const models = useMemo(() => {
    const list = brands.find((b) => b.name === brand)?.models ?? [];
    return [...list].sort(compareNames);
  }, [brands, brand]);

  return { models };
};
