import { Product, productSku, productSpecs } from '@/data/catalog';
import { screenSize } from '@/lib/kit-filter';
import { withoutAllMark } from '@/lib/fits-match';

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
  /* Метку «вся марка» в текст выдачи не пускаем: справочника здесь нет,
     поэтому просто убираем её — останется название марки без моделей,
     что для описания достаточно и честно */
  const entries = Object.entries(p.fits ?? {})
    .filter(([, models]) => Array.isArray(models))
    .map(([brand, models]) => [brand, withoutAllMark(models)] as [string, string[]]);
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
/**
 * Чем товар отличается от одноимённого соседа.
 *
 * У проводок названия совпадают дословно — «Переходник для Nissan
 * 2004+», — а различаются они начинкой: одна с камерой, другая с
 * усилителем. В выдаче две одинаковые строки поисковик считает
 * дублем и показывает лишь одну. Берём короткую примету из
 * характеристик, чтобы заголовки разошлись.
 */
const distinctTag = (p: Product): string => {
  const rows = (p.specs ?? []) as unknown as [string, string][];
  const find = (re: RegExp) =>
    rows.find(([k]) => re.test(String(k)))?.[1] ?? '';

  const feats = String(find(/особенност/i));
  const conn = String(find(/подключен/i));

  // Порядок — от самого заметного покупателю к общему
  if (/360/.test(conn) || /360/.test(feats)) return 'для кругового обзора';
  if (/камер/i.test(conn) || /камер/i.test(feats)) return 'со штатной камерой';
  if (/усилител/i.test(conn) || /усилител/i.test(feats)) return 'с усилителем';
  if (/парктрон/i.test(conn)) return 'с парктрониками';
  if (/руле/i.test(conn)) return 'с кнопками на руле';
  /* CAN-адаптер — последняя примета: часто это единственное, чем
     различаются две одинаково названные проводки */
  if (/can\s*адаптер/i.test(feats)) return 'с CAN-адаптером';
  return '';
};

export const seoTitle = (p: Product): string => {
  const base = p.name.trim();
  const years = yearsText(p);

  // Годы в названии часто уже есть — второй раз не пишем
  const hasYears = /(19|20)\d{2}/.test(base);
  const head = years && !hasYears ? `${base}, ${years}` : base;

  /* Примету добавляем, только если её ещё нет в названии — иначе
     получилось бы «...с камерой, со штатной камерой» */
  const tag = distinctTag(p);
  const withTag =
    tag && !new RegExp(tag.split(' ').pop() ?? '', 'i').test(head)
      ? `${head}, ${tag}`
      : head;

  const tail = ' — купить в ШТАТНО';
  if (withTag.length + tail.length <= 65) return withTag + tail;
  return `${withTag} — ШТАТНО`;
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

  /*
   * Набираем предложениями, пока помещаемся в 160 знаков, которые
   * показывает поисковик. Обрезка «по живому» оставляла хвосты вроде
   * «Материал: ABS-плас…» — лучше опустить фразу целиком.
   */
  let text = '';
  for (const part of parts) {
    const next = text ? `${text} ${part}` : part;
    if (next.length > 160) break;
    text = next;
  }
  return (text || parts[0]).replace(/\s+/g, ' ').trim();
};

/** Артикул — им дополняем заголовок, когда названия совпадают */
export const seoSku = (p: Product): string => productSku(p);