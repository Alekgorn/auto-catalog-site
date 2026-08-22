import { Brand, Product } from '@/data/catalog';
import { fitKey } from '@/lib/fits-match';

/**
 * Сколько товаров подходит каждой марке и каждой модели.
 *
 * Нужно, чтобы в выборе авто сверху показывать востребованные марки, а не
 * ровный алфавит на 54 позиции. Универсальные позиции («подойдёт всем»)
 * здесь не считаем: они есть у любой машины и уравняли бы все марки.
 */
export interface BrandStats {
  /** Марка → сколько товаров заявлено под неё */
  byBrand: Record<string, number>;
  /** «марка|модель» в виде отпечатка → сколько товаров */
  byModel: Record<string, number>;
}

/** Ключ модели внутри марки — по отпечаткам, т.к. поставщики пишут по-разному */
export const modelKey = (brand: string, model: string): string =>
  `${fitKey(brand)}|${fitKey(model)}`;

export const buildBrandStats = (products: Product[]): BrandStats => {
  const byBrand: Record<string, number> = {};
  const byModel: Record<string, number> = {};

  products.forEach((p) => {
    const fits = p.fits ?? {};
    Object.entries(fits).forEach(([brand, models]) => {
      const bKey = fitKey(brand);
      if (!bKey) return;
      byBrand[bKey] = (byBrand[bKey] ?? 0) + 1;
      (models ?? []).forEach((m) => {
        const key = modelKey(brand, m);
        byModel[key] = (byModel[key] ?? 0) + 1;
      });
    });
  });

  return { byBrand, byModel };
};

/** Сколько товаров под марку — по названию из справочника */
export const brandCount = (stats: BrandStats, brand: string): number =>
  stats.byBrand[fitKey(brand)] ?? 0;

/** Сколько товаров под конкретную модель марки */
export const modelCount = (
  stats: BrandStats,
  brand: string,
  model: string,
): number => stats.byModel[modelKey(brand, model)] ?? 0;

/**
 * Марки, которые стоит показать первыми: у кого больше всего товаров.
 * Марки без единого товара в «популярные» не попадают никогда.
 */
export const topBrands = (
  brands: Brand[],
  stats: BrandStats,
  limit = 8,
): string[] =>
  brands
    .map((b) => ({ name: b.name, n: brandCount(stats, b.name) }))
    .filter((b) => b.n > 0)
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'ru'))
    .slice(0, limit)
    .map((b) => b.name);
