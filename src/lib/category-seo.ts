import { Product, formatPrice } from '@/data/catalog';
import { plural, screenSize } from '@/lib/kit-filter';

/**
 * Заголовок и краткое описание раздела каталога для поисковой выдачи.
 *
 * Раньше все разделы описывались одной фразой с подставленным названием:
 * «N позиций в наличии, подбор по марке и модели». Для поиска это один
 * и тот же текст — разделы конкурировали друг с другом вместо того,
 * чтобы каждый ловить свой запрос.
 *
 * Здесь описание собирается из самого раздела: сколько позиций, вилка
 * цен, какие марки и размеры внутри. Ничего не выдумываем — только
 * считаем по своим же товарам.
 */

/** Сколько марок и размеров перечислять — дальше строка не влезет в выдачу */
const MAX_BRANDS = 4;
const MAX_SIZES = 4;

/** Самые представленные марки раздела: те, под что тут реально есть товар */
export const topBrands = (items: Product[], limit = MAX_BRANDS): string[] => {
  const count = new Map<string, number>();
  items.forEach((p) => {
    Object.keys(p.fits ?? {}).forEach((b) => {
      count.set(b, (count.get(b) ?? 0) + 1);
    });
  });
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'))
    .slice(0, limit)
    .map(([name]) => name);
};

/** Размеры экрана, которые есть в разделе: «9, 10, 12,3 дюйма» */
export const sizesText = (items: Product[]): string => {
  const set = new Set<number>();
  items.forEach((p) => {
    const s = screenSize(p);
    if (s) set.add(s);
  });
  if (set.size < 2) return '';
  const list = [...set].sort((a, b) => a - b).slice(0, MAX_SIZES);
  return list.map((n) => String(n).replace('.', ',')).join(', ');
};

/** Вилка цен раздела: «от 464 ₽ до 48 533 ₽» */
export const priceRange = (items: Product[]): string => {
  const prices = items.map((p) => p.price).filter((n) => n > 0);
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min);
  // Вилка говорит больше, чем одно «от»: видно и порог входа, и потолок
  return `от ${formatPrice(min)} до ${formatPrice(max)}`;
};

/** Сколько позиций словами: «1384 товара» */
const countText = (n: number): string =>
  `${n} ${plural(n, 'товар', 'товара', 'товаров')}`;

/**
 * Заголовок страницы раздела.
 *
 * К названию добавляем то, что отличает раздел от соседнего: количество
 * позиций и нижнюю границу цены. «Купить» и город оставляем в конце —
 * это общие слова, они не должны съедать начало строки.
 */
export const categoryTitle = (category: string, items: Product[]): string => {
  const prices = items.map((p) => p.price).filter((n) => n > 0);
  const min = prices.length ? Math.min(...prices) : 0;

  // Раздел пока пустой — цифру не показываем: «0 товаров» в выдаче
  // отпугивает сильнее, чем отсутствие количества
  const head = !items.length
    ? `${category} — купить с доставкой`
    : min
      ? `${category} — ${countText(items.length)} от ${formatPrice(min)}`
      : `${category} — ${countText(items.length)}`;

  const tail = ' | ШТАТНО';
  // Длинные названия разделов уже занимают всю строку — тогда без хвоста
  return head.length + tail.length <= 70 ? head + tail : head;
};

/**
 * Краткое описание раздела для выдачи.
 *
 * Порядок: что за раздел и сколько внутри, вилка цен, под какие марки,
 * какие размеры. Первым идёт самое различающее — цифры, а не общие
 * слова про доставку.
 */
export const categoryDescription = (
  category: string,
  items: Product[],
): string => {
  const parts: string[] = [];

  const range = priceRange(items);
  if (!items.length) {
    // Пустой раздел: обещать нечего, зато честно зовём в подбор
    parts.push(`${category}. Подберём под вашу машину — напишите нам.`);
    parts.push('Доставка по России, оплата при получении.');
    return parts.join(' ');
  }
  // «цены от 464 ₽ до 48 533 ₽» — вилка, «цена 100 ₽» — все по одной
  const priceLine = range
    ? `${range.startsWith('от') ? 'цены' : 'цена'} ${range}`
    : '';
  parts.push(
    priceLine
      ? `${category}: ${countText(items.length)}, ${priceLine}.`
      : `${category}: ${countText(items.length)}.`,
  );

  const brands = topBrands(items);
  if (brands.length >= 2) {
    parts.push(`Есть на ${brands.join(', ')} и другие марки.`);
  }

  const sizes = sizesText(items);
  if (sizes) parts.push(`Размеры: ${sizes} дюйма.`);

  // Общие слова — в самый конец, они одинаковы у всех разделов
  parts.push('Подбор по марке и модели, доставка по России.');

  const text = parts.join(' ').replace(/\s+/g, ' ').trim();

  // Поисковик показывает около 160 знаков — режем по границе предложения
  if (text.length <= 160) return text;
  const cut = text.slice(0, 160);
  const dot = cut.lastIndexOf('.');
  return dot > 90 ? cut.slice(0, dot + 1) : `${cut.trim()}…`;
};