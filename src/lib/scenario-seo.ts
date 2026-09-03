import { Product, formatPrice } from '@/data/catalog';
import { plural } from '@/lib/kit-filter';

/**
 * Заголовок и краткое описание страницы сценария подбора.
 *
 * Заголовки были из одной фразы покупателя — «Спокойствие за рулём»,
 * «Боюсь не заметить столб». Живо, но поиску нечего показать: в такой
 * строке нет ни товара, ни цены, и по запросу «камера заднего вида»
 * страница не находится.
 *
 * Здесь к живой фразе добавляются цифры сценария: сколько товаров
 * подходит и от какой цены. Описание тоже начинается с сути, а не
 * с художественного вступления, которое обрывалось на полуслове.
 */

const MAX_CATS = 2;

/** Разделы, из которых собран сценарий: «камеры, переходные рамки» */
const topCategories = (items: Product[], limit = MAX_CATS): string[] => {
  const count = new Map<string, number>();
  items.forEach((p) => {
    if (p.category) count.set(p.category, (count.get(p.category) ?? 0) + 1);
  });
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name.toLowerCase());
};

/** Вилка цен сценария */
export const scenarioPriceRange = (items: Product[]): string => {
  const prices = items.map((p) => p.price).filter((n) => n > 0);
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min);
  return `от ${formatPrice(min)} до ${formatPrice(max)}`;
};

const countText = (n: number): string =>
  `${n} ${plural(n, 'товар', 'товара', 'товаров')}`;

/**
 * Заголовок страницы сценария.
 *
 * Живую фразу оставляем — она и есть запрос покупателя своими словами.
 * Добавляем количество и цену: по ним страница попадает в выдачу по
 * товарным запросам, а не только по эмоциональным.
 */
export const scenarioTitle = (heading: string, items: Product[]): string => {
  const base = heading.trim();
  if (!items.length) return `${base} · ШТАТНО`;

  const prices = items.map((p) => p.price).filter((n) => n > 0);
  const min = prices.length ? Math.min(...prices) : 0;

  const head = min
    ? `${base} — ${countText(items.length)} от ${formatPrice(min)}`
    : `${base} — ${countText(items.length)}`;

  const tail = ' · ШТАТНО';
  return head.length + tail.length <= 70 ? head + tail : head;
};

/**
 * Краткое описание сценария для выдачи.
 *
 * Первое предложение вводного текста берём целиком — оно написано
 * человеком и объясняет задачу лучше любой сборки. Дальше цифры:
 * сколько позиций, вилка цен, из чего собрано.
 */
export const scenarioDescription = (
  intro: string,
  items: Product[],
): string => {
  const parts: string[] = [];

  // Первая фраза вступления — законченная мысль, а не обрезок
  const first = (intro ?? '').trim().split(/(?<=[.!?])\s+/)[0] ?? '';
  if (first && first.length <= 120) parts.push(first);

  if (items.length) {
    const range = scenarioPriceRange(items);
    const priceLine = range
      ? `${range.startsWith('от') ? 'цены' : 'цена'} ${range}`
      : '';
    parts.push(
      priceLine
        ? `${countText(items.length)}, ${priceLine}.`
        : `${countText(items.length)}.`,
    );

    const cats = topCategories(items);
    if (cats.length) parts.push(`Есть ${cats.join(', ')}.`);
  }

  parts.push('Подбор по марке и модели, доставка по России.');

  /*
   * Набираем предложениями, пока помещаемся в 160 знаков, которые
   * показывает поисковик. Раньше текст резался по счётчику символов
   * и обрывался посреди слова — «только совмести…».
   */
  let text = '';
  for (const part of parts) {
    const next = text ? `${text} ${part}` : part;
    if (next.length > 160) break;
    text = next;
  }
  return (text || parts[0]).replace(/\s+/g, ' ').trim();
};
