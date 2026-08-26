import { Product, productImages } from '@/data/catalog';

/**
 * Догрузка остальных фотографий товара.
 *
 * В общем файле каталога у товара лежит только обложка: все ссылки разом
 * весили 963 КБ, и это скачивал каждый, кто открыл главную. Остальные
 * снимки нужны в трёх местах — галерея товара, быстрый просмотр и
 * сравнение, — поэтому лежат отдельным файлом и подтягиваются, когда
 * человек действительно захотел их посмотреть.
 *
 * Файл берётся один раз за визит и остаётся в памяти вкладки.
 */

const IMG_PREFIX = 'https://cdn.poehali.dev/projects/';

type PhotoMap = Record<string, string[]>;

interface Win {
  __PHOTOS__?: PhotoMap;
  __PHOTOS_AT__?: number;
}

/** Один общий запрос на вкладку: второй вызов ждёт первый, а не шлёт свой */
let pending: Promise<PhotoMap> | null = null;

const win = (): Win =>
  (typeof window === 'undefined' ? {} : window) as unknown as Win;

const expand = (u: string) => (u.startsWith('~') ? IMG_PREFIX + u.slice(1) : u);

/** Уже загруженный словарь, если он есть */
export const photosReady = (): PhotoMap | null => win().__PHOTOS__ ?? null;

/**
 * Загружает файл с остальными фото. Повторные вызовы бесплатны.
 *
 * Ошибку наружу не отдаём: не догрузились дополнительные снимки — товар
 * просто останется с одной обложкой, это лучше пустой страницы.
 */
export const loadPhotos = (): Promise<PhotoMap> => {
  const w = win();
  if (w.__PHOTOS__) return Promise.resolve(w.__PHOTOS__);
  if (pending) return pending;

  pending = new Promise<PhotoMap>((resolve) => {
    if (typeof document === 'undefined') return resolve({});

    /* Номер сборки тот же, что у каталога — иначе подтянем фото от старой */
    const at = w.__PHOTOS_AT__;
    if (!at) return resolve({});

    const el = document.createElement('script');
    el.src = `/catalog-photos-${at}.js`;
    el.async = true;
    el.onload = () => resolve(w.__PHOTOS__ ?? {});
    el.onerror = () => {
      pending = null;
      resolve({});
    };
    document.head.appendChild(el);
  });

  return pending;
};

/**
 * Все фото товара: обложка из каталога плюс догруженные, если они уже есть.
 * Пока файл не подъехал, вернётся одна обложка — вызывающий код перерисуется.
 */
export const allPhotos = (p: Product | null | undefined): string[] => {
  if (!p) return [];
  const cover = productImages(p);
  const rest = photosReady()?.[p.id];
  if (!rest?.length) return cover;
  /* У товара без своих снимков обложка — картинка категории, её не мешаем */
  if (!p.images?.length) return cover;

  /*
   * Свежий каталог из админки приходит целиком, со всеми снимками сразу —
   * тогда догруженный словарь повторяет то, что уже есть, и в галерее
   * фото двоились. Оставляем только те кадры, которых ещё нет.
   */
  return [...new Set([...cover, ...rest.map(expand)])];
};