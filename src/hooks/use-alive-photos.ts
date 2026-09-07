import { useCallback, useMemo, useState } from 'react';

/**
 * Отсев фотографий, которые не открылись.
 *
 * У части товаров снимки лежат на сайте поставщика, и он периодически
 * отдаёт ошибку вместо картинки. Браузер рисует на её месте сломанный
 * значок, а в ленте миниатюр остаётся пустая клетка — товар выглядит
 * заброшенным. Такие ссылки убираем из набора сразу, как только браузер
 * сообщил об ошибке: лучше три фото вместо пяти, чем две дырки.
 *
 * Если не открылось вообще ничего, оставляем первый кадр как есть —
 * пустая галерея сломала бы вёрстку сильнее, чем один битый снимок.
 */
export const useAlivePhotos = (images: string[]) => {
  const [broken, setBroken] = useState<string[]>([]);

  const alive = useMemo(() => {
    const left = images.filter((src) => !broken.includes(src));
    return left.length > 0 ? left : images.slice(0, 1);
  }, [images, broken]);

  const markBroken = useCallback((src: string) => {
    setBroken((prev) => (prev.includes(src) ? prev : [...prev, src]));
  }, []);

  return { photos: alive, markBroken };
};
