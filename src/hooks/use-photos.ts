import { useEffect, useState } from 'react';
import { Product } from '@/data/catalog';
import { allPhotos, loadPhotos, photosReady } from '@/lib/product-photos';

/**
 * Все фотографии товара с догрузкой.
 *
 * Сначала отдаёт обложку — она есть сразу и уже нарисована в списке,
 * поэтому подмены картинки человек не замечает. Следом подтягивает
 * остальные снимки и возвращает полный набор.
 */
export const usePhotos = (product: Product | null | undefined): string[] => {
  const [shots, setShots] = useState<string[]>(() => allPhotos(product));

  useEffect(() => {
    let alive = true;
    setShots(allPhotos(product));
    if (!product) return;

    /* Словарь уже в памяти — второй раз за ним не идём */
    if (photosReady()) return;

    loadPhotos().then(() => {
      if (alive) setShots(allPhotos(product));
    });

    return () => {
      alive = false;
    };
  }, [product]);

  return shots;
};
