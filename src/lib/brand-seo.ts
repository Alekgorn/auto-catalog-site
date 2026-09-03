import { Product, formatPrice } from '@/data/catalog';
import { plural } from '@/lib/kit-filter';

/**
 * Заголовок и краткое описание страницы марки для поисковой выдачи.
 *
 * Раньше у всех марок стоял один текст с подставленным названием:
 * «Автоэлектроника для X — магнитолы, камеры, жгуты». Для поиска это
 * одна и та же страница, размноженная шестьдесят раз, — марки мешали
 * друг другу вместо того, чтобы каждая ловила свой запрос.
 *
 * Здесь всё считается по товарам самой марки: сколько позиций, какие
 * модели, вилка цен, какие разделы каталога представлены.
 */

/** Сколько моделей и разделов перечислять — дальше строка не влезет */
const MAX_MODELS = 4;
const MAX_CATS = 2;

/**
 * Модели марки, под которые больше всего товара.
 *
 * Берём по количеству позиций, а не по алфавиту: в выдаче должны
 * стоять ходовые Camry и RAV4, а не первая попавшаяся модель.
 */
export const topModels = (
  items: Product[],
  brand: string,
  limit = MAX_MODELS,
): string[] => {
  const count = new Map<string, number>();
  items.forEach((p) => {
    (p.fits?.[brand] ?? []).forEach((m) => {
      const name = m.trim();
      if (name) count.set(name, (count.get(name) ?? 0) + 1);
    });
  });
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'))
    .slice(0, limit)
    .map(([name]) => name);
};

/** Разделы каталога, где есть товар под марку: «рамки, переходники» */
export const topCategories = (items: Product[], limit = MAX_CATS): string[] => {
  const count = new Map<string, number>();
  items.forEach((p) => {
    if (p.category) count.set(p.category, (count.get(p.category) ?? 0) + 1);
  });
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name.toLowerCase());
};

/** Вилка цен: «от 200 ₽ до 69 874 ₽» */
export const brandPriceRange = (items: Product[]): string => {
  const prices = items.map((p) => p.price).filter((n) => n > 0);
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min);
  return `от ${formatPrice(min)} до ${formatPrice(max)}`;
};

/** Сколько позиций словами: «368 товаров» */
const countText = (n: number): string =>
  `${n} ${plural(n, 'товар', 'товара', 'товаров')}`;

/**
 * Заголовок страницы марки.
 *
 * Марка первой — по ней и ищут. Дальше то, что отличает страницу от
 * соседней: количество позиций и нижняя граница цены.
 */
export const brandTitle = (brand: string, items: Product[]): string => {
  if (!items.length) return `Оборудование для ${brand} | ШТАТНО`;

  const prices = items.map((p) => p.price).filter((n) => n > 0);
  const min = prices.length ? Math.min(...prices) : 0;

  const head = min
    ? `${brand} — ${countText(items.length)} для магнитолы от ${formatPrice(min)}`
    : `${brand} — ${countText(items.length)} для магнитолы`;

  const tail = ' | ШТАТНО';
  return head.length + tail.length <= 70 ? head + tail : head;
};

/**
 * Краткое описание марки для выдачи.
 *
 * Порядок: сколько позиций и вилка цен, под какие модели, что именно
 * есть. Модели идут вторыми — по ним ищут не реже, чем по марке.
 */
export const brandDescription = (
  brand: string,
  items: Product[],
): string => {
  if (!items.length) {
    return `Оборудование для ${brand}. Подберём магнитолу, рамку и переходники под вашу модель — напишите нам. Доставка по России.`;
  }

  const parts: string[] = [];

  const range = brandPriceRange(items);
  const priceLine = range
    ? `${range.startsWith('от') ? 'цены' : 'цена'} ${range}`
    : '';
  parts.push(
    priceLine
      ? `${brand}: ${countText(items.length)}, ${priceLine}.`
      : `${brand}: ${countText(items.length)}.`,
  );

  const models = topModels(items, brand);
  if (models.length) {
    parts.push(`Для ${models.join(', ')} и других моделей.`);
  }

  const cats = topCategories(items);
  if (cats.length) parts.push(`Есть ${cats.join(', ')}.`);

  parts.push('Совместимость проверена по штатным разъёмам.');

  /*
   * Собираем предложение за предложением, пока помещаемся в 160 знаков.
   * Обрезка «по живому» давала хвосты вроде «переходники для подключения
   * магни…» — лучше не взять фразу целиком, чем оборвать её посреди слова.
   */
  let text = '';
  for (const part of parts) {
    const next = text ? `${text} ${part}` : part;
    if (next.length > 160) break;
    text = next;
  }
  return (text || parts[0]).replace(/\s+/g, ' ').trim();
};