import { useEffect, useState } from 'react';
import { Product } from '@/data/catalog';
import { loadTexts, textsReady, withText } from '@/lib/product-texts';

/**
 * Товар с полным описанием и характеристиками.
 *
 * Сначала отдаёт то, что пришло со списком — название, цену, обложку и
 * первые характеристики. Их видно сразу, поэтому страница не мигает
 * заглушкой. Следом подтягивает описание и остальную таблицу.
 */
export const useProductText = <T extends Product | null | undefined>(
  product: T,
): T => {
  const [full, setFull] = useState<T>(() => withText(product));

  useEffect(() => {
    let alive = true;
    setFull(withText(product));
    if (!product) return;

    /* Словарь уже в памяти — второй раз за ним не идём */
    if (textsReady()) return;

    loadTexts().then(() => {
      if (alive) setFull(withText(product));
    });

    return () => {
      alive = false;
    };
  }, [product]);

  return full;
};

/**
 * То же самое для списка товаров — нужно в сравнении, где таблицу
 * строят сразу по нескольким карточкам.
 */
export const useProductTexts = (products: Product[]): Product[] => {
  const [full, setFull] = useState<Product[]>(() => products.map(withText));

  useEffect(() => {
    let alive = true;
    setFull(products.map(withText));
    if (!products.length || textsReady()) return;

    loadTexts().then(() => {
      if (alive) setFull(products.map(withText));
    });

    return () => {
      alive = false;
    };
  }, [products]);

  return full;
};