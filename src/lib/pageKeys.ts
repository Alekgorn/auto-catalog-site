import { pageHash } from './pageHash';

/**
 * Отпечатки страниц: по ним видно, отличается ли товар в каталоге от
 * того, что попало в собранную для поисковиков версию.
 *
 * Файл общий для админки и сборщика статики (scripts/prerender.mjs
 * повторяет эти же правила). Раньше расчёт был написан в двух местах
 * по отдельности и однажды разъехался: сборщик учитывал описание, а
 * админка нет — и панель бодро показывала «всё актуально», хотя текст
 * на странице для поисковика остался старым.
 *
 * Что входит в отпечаток товара — всё, что реально попадает в
 * отдаваемую роботам страницу: название и цена (видны в выдаче),
 * описание и инструкция (текст страницы), характеристики и
 * совместимость (текст и разметка), обложка (превью в выдаче).
 * Порядок характеристик и марок покупателю важен, но при сохранении в
 * админке не всегда стабилен — сравниваем отсортированным, чтобы
 * переставленные местами поля не считались правкой.
 */

export interface KeyedProduct {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  description?: string[];
  install?: string;
  specs?: [string, string][];
  fits?: Record<string, string[]>;
  images?: string[];
}

export interface KeyedGuide {
  slug: string;
  title: string;
  excerpt?: string;
  blocks?: unknown[];
}

export interface KeyedArticle {
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  blocks?: unknown[];
}

const stableSpecs = (p: KeyedProduct) =>
  [...(p.specs ?? [])]
    .map(([k, v]) => `${k}:${v}`)
    .sort()
    .join(',');

const stableFits = (p: KeyedProduct) =>
  Object.entries(p.fits ?? {})
    .map(([brand, models]) => `${brand}=${[...(models ?? [])].sort().join(',')}`)
    .sort()
    .join(';');

export const productKey = (p: KeyedProduct) =>
  [
    p.id,
    p.name,
    p.price,
    p.oldPrice ?? '',
    p.stock ?? '',
    (p.description ?? []).join('\n'),
    p.install ?? '',
    stableSpecs(p),
    stableFits(p),
    (p.images ?? [])[0] ?? '',
  ].join(':');

export const guideKey = (g: KeyedGuide) =>
  [g.slug, g.title, g.excerpt, JSON.stringify(g.blocks ?? [])].join(':');

export const articleKey = (a: KeyedArticle) =>
  [
    a.slug,
    a.title,
    a.metaTitle,
    a.metaDescription,
    a.excerpt,
    JSON.stringify(a.blocks ?? []),
  ].join(':');

/** Отпечатки по каждой странице: адрес → короткая сумма. */
export const productHashes = (list: KeyedProduct[]): Record<string, string> =>
  Object.fromEntries(list.map((p) => [p.id, pageHash(productKey(p))]));

export const guideHashes = (list: KeyedGuide[]): Record<string, string> =>
  Object.fromEntries(list.map((g) => [g.slug, pageHash(guideKey(g))]));

export const articleHashes = (list: KeyedArticle[]): Record<string, string> =>
  Object.fromEntries(list.map((a) => [a.slug, pageHash(articleKey(a))]));

/**
 * Что разошлось между каталогом и собранными страницами.
 * Возвращает три списка: добавленные, изменённые и удалённые.
 */
export const diffHashes = (
  current: Record<string, string>,
  built: Record<string, string> | undefined,
) => {
  const added: string[] = [];
  const changed: string[] = [];
  const removed: string[] = [];
  if (!built) return { added, changed, removed };

  for (const [key, hash] of Object.entries(current)) {
    if (!(key in built)) added.push(key);
    else if (built[key] !== hash) changed.push(key);
  }
  for (const key of Object.keys(built)) {
    if (!(key in current)) removed.push(key);
  }
  return { added, changed, removed };
};
