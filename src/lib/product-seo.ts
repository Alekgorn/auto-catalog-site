import { Product, productSku, productSpecs } from '@/data/catalog';
import { screenSize } from '@/lib/kit-filter';

/**
 * Заголовок и краткое описание товара для поисковой выдачи.
 *
 * Собираются из того, что уже есть в карточке: марка, модель, годы,
 * размер экрана, цена, наличие. Никаких новых фактов — только
 * перестановка своих же данных, поэтому соврать здесь нечем.
 *
 * Задача — развести похожие товары. Описания у рамок начинаются
 * одинаково («Установочная рамка для замены штатной магнитолы...»),
 * а в выдаче видно как раз начало: полторы сотни рамок выглядели
 * одним и тем же товаром. Здесь машина и размер идут первыми.
 */

/** Год «по», если он в будущем, читается как «и новее» */
const NOW = new Date().getFullYear();

/**
 * Самый ранний год, который означает реальное ограничение.
 * 1989 в карточках стоит как «подходит всем» — писать «с 1989 года»
 * про видеорегистратор бессмысленно и выглядит ошибкой.
 */
const YEAR_ANY = 1990;

/** Годы: «2012–2016», «с 2018», «до 2010» */
export const yearsText = (p: Product): string => {
  const [from, to] = p.years ?? [0, 0];
  if (!from && !to) return '';
  // Диапазон «от начала времён и до наших дней» ничего не сообщает.
  // Нижнюю границу проверяем саму по себе: 1989 в карточке означает
  // «подходит всем», и «с 1989 года» читается как ошибка в данных
  if (from <= YEAR_ANY) return to && to < NOW - 1 ? `до ${to}` : '';
  const open = to >= NOW;
  if (from && open) return `с ${from} года`;
  if (from && to) return from === to ? `${from} года` : `${from}–${to}`;
  return from ? `с ${from} года` : `до ${to}`;
};

/**
 * Машины товара одной строкой: «Toyota Camry, Corolla».
 * Больше двух марок не перечисляем — в выдачу всё равно не влезет,
 * а хвост из десятка названий выглядит спамом.
 */
export const vehicleText = (p: Product, maxBrands = 2): string => {
  const entries = Object.entries(p.fits ?? {}).filter(
    ([, models]) => Array.isArray(models),
  );
  if (!entries.length) return '';

  const parts = entries.slice(0, maxBrands).map(([brand, models]) => {
    // «Mazda 3 (Axela), Axela» — второе название лишнее: убираем модели,
    // которые уже упомянуты в скобках у предыдущей
    const seen: string[] = [];
    for (const m of models) {
      const norm = m.toLowerCase().replace(/[()]/g, ' ').replace(/\s+/g, ' ');
      const dup = seen.some((s) => {
        const prev = s.toLowerCase().replace(/[()]/g, ' ').replace(/\s+/g, ' ');
        return prev.includes(norm) || norm.includes(prev);
      });
      if (!dup) seen.push(m);
      if (seen.length === 3) break;
    }
    const list = seen.join(', ');
    return list ? `${brand} ${list}` : brand;
  });

  const rest = entries.length - maxBrands;
  return parts.join(', ') + (rest > 0 ? ` и ещё ${rest} марок` : '');
};

/** Размер экрана из характеристик или названия: «10 дюймов», «12,3 дюйма» */
export const sizeText = (p: Product): string => {
  const n = screenSize(p);
  if (n === null) return '';
  const num = String(n).replace('.', ',');
  // Дробные читаются как «12,3 дюйма», целые — «10 дюймов»
  if (!Number.isInteger(n)) return `${num} дюйма`;
  const last = n % 10;
  const teen = n % 100 >= 11 && n % 100 <= 14;
  if (!teen && last === 1) return `${num} дюйм`;
  if (!teen && last >= 2 && last <= 4) return `${num} дюйма`;
  return `${num} дюймов`;
};

/** Цена прописью для выдачи: «от 3 100 ₽» */
const priceText = (p: Product): string =>
  p.price > 0 ? `${p.price.toLocaleString('ru-RU')} ₽` : '';

/**
 * Заголовок страницы товара.
 *
 * Название уже содержит и марку, и размер, поэтому не повторяем их,
 * а добавляем то, чего в нём нет: годы и артикул. Держимся 60–65
 * знаков — длиннее поисковик обрезает многоточием.
 */
export const seoTitle = (p: Product): string => {
  const base = p.name.trim();
  const years = yearsText(p);

  // Годы в названии часто уже есть — второй раз не пишем
  const hasYears = /(19|20)\d{2}/.test(base);
  const head = years && !hasYears ? `${base}, ${years}` : base;

  const tail = ' — купить в ШТАТНО';
  if (head.length + tail.length <= 65) return head + tail;
  return `${head} — ШТАТНО`;
};

/**
 * Краткое описание для выдачи (meta description).
 *
 * Собираем из своих данных в порядке важности для покупателя:
 * что это и на какую машину, размер, годы, цена, наличие. Первым
 * идёт то, что отличает товар от соседнего, — иначе полторы сотни
 * рамок выглядят одинаково.
 */
export const seoDescription = (p: Product): string => {
  const parts: string[] = [];

  const vehicle = vehicleText(p);
  const size = sizeText(p);
  const years = yearsText(p);

  // Первое предложение: товар и машина — самое различающее
  const what = p.subcategory || p.category;
  if (vehicle) {
    parts.push(`${what} для ${vehicle}${years ? ` ${years}` : ''}.`);
  } else {
    parts.push(`${what}${years ? `, ${years}` : ''}.`);
  }

  if (size) parts.push(`Размер: ${size}.`);

  // Пара характеристик — но не тех, что уже сказали
  const said = /размер|диагональ|типоразмер|год|категор/i;
  const specs = productSpecs(p)
    .filter(([k, v]) => k && v && !said.test(k))
    .slice(0, 2)
    // В названиях характеристик часто уже стоит двоеточие («Материал:»),
    // без чистки в выдаче вылезало «Материал:: ABS-пластик»
    .map(([k, v]) => `${k.trim().replace(/[:：\s]+$/, '')}: ${v.trim()}`);
  if (specs.length) parts.push(`${specs.join('. ')}.`);

  const price = priceText(p);
  if (price) parts.push(`Цена ${price}.`);

  parts.push(
    (p.stock ?? 0) > 0 ? 'В наличии, отправка сегодня.' : 'Доставка по России.',
  );

  const text = parts.join(' ').replace(/\s+/g, ' ').trim();

  // Поисковик показывает около 160 знаков — режем по границе предложения
  if (text.length <= 160) return text;
  const cut = text.slice(0, 160);
  const dot = cut.lastIndexOf('.');
  return dot > 90 ? cut.slice(0, dot + 1) : `${cut.trim()}…`;
};

/** Артикул — им дополняем заголовок, когда названия совпадают */
export const seoSku = (p: Product): string => productSku(p);