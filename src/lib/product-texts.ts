import { Product } from '@/data/catalog';

/**
 * Догрузка описаний и полных характеристик товара.
 *
 * В общем файле каталога у товара лежат только первые три характеристики —
 * ровно то, что показывает карточка в списке. Описание и остальные строки
 * таблицы весили 1,1 МБ из 2,1, и это скачивал каждый посетитель любой
 * страницы и поисковый робот на каждом из полутора тысяч адресов. Читают
 * их в трёх местах — страница товара, быстрый просмотр и сравнение, —
 * поэтому лежат отдельным файлом и подтягиваются по требованию.
 *
 * Файл берётся один раз за визит и остаётся в памяти вкладки.
 */

/** Что докладываем товару поверх урезанного варианта из каталога */
export interface ProductText {
  description?: string[];
  install?: string;
  specs?: [string, string][];
}

type TextMap = Record<string, ProductText>;

interface Win {
  __TEXTS__?: TextMap;
  __TEXTS_AT__?: number;
}

/** Один общий запрос на вкладку: второй вызов ждёт первый, а не шлёт свой */
let pending: Promise<TextMap> | null = null;

const win = (): Win =>
  (typeof window === 'undefined' ? {} : window) as unknown as Win;

/** Уже загруженный словарь, если он есть */
export const textsReady = (): TextMap | null => win().__TEXTS__ ?? null;

/**
 * Загружает файл с описаниями. Повторные вызовы бесплатны.
 *
 * Ошибку наружу не отдаём: не догрузилось описание — товар покажет то,
 * что пришло с каталогом, это лучше пустой страницы.
 */
export const loadTexts = (): Promise<TextMap> => {
  const w = win();
  if (w.__TEXTS__) return Promise.resolve(w.__TEXTS__);
  if (pending) return pending;

  pending = new Promise<TextMap>((resolve) => {
    if (typeof document === 'undefined') return resolve({});

    /* Номер сборки тот же, что у каталога — иначе подтянем тексты от старой */
    const at = w.__TEXTS_AT__;
    if (!at) return resolve({});

    const el = document.createElement('script');
    el.src = `/catalog-texts-${at}.js`;
    el.async = true;
    el.onload = () => resolve(w.__TEXTS__ ?? {});
    el.onerror = () => {
      pending = null;
      resolve({});
    };
    document.head.appendChild(el);
  });

  return pending;
};

/**
 * Товар с полным описанием, если оно уже подъехало.
 *
 * Пока файл в пути, возвращаем товар как есть — вызывающий код
 * перерисуется, когда данные придут.
 */
export const withText = <T extends Product | null | undefined>(p: T): T => {
  if (!p) return p;
  const extra = textsReady()?.[p.id];
  if (!extra) return p;
  /*
   * Свежий каталог из админки приходит целиком, вместе с описаниями —
   * тогда своё поле у товара уже заполнено и подменять его не нужно.
   */
  return {
    ...p,
    description: p.description?.length ? p.description : extra.description,
    install: p.install || extra.install,
    specs:
      extra.specs && extra.specs.length > (p.specs?.length ?? 0)
        ? extra.specs
        : p.specs,
  } as T;
};
