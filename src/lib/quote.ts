import { formatPrice } from '@/data/catalog';
import { Vehicle } from '@/data/catalog';
import { isVehicle } from '@/lib/vehicle';

/**
 * Смета установщика: комплект с наценкой и своими работами.
 *
 * Мастеру нужно не «поделиться подборкой», а отправить клиенту цену — свою,
 * а не нашу. Поэтому здесь нет ни ссылок, ни названия магазина: клиент
 * получает чистый список работ и позиций от своего установщика.
 */

/** Позиция сметы: товар из каталога либо своя строка вроде «Установка» */
export interface QuoteLine {
  name: string;
  /** Цена за штуку — уже с наценкой, если она задана */
  price: number;
  qty: number;
  /** Дописана руками: в наценку не входит, её ставят сразу конечной */
  custom?: boolean;
}

export interface QuoteOptions {
  /** Наценка в процентах на товары каталога */
  markup: number;
  /** Показывать цену каждой позиции или только итог */
  perLine: boolean;
  vehicle: Vehicle | null;
  /** Заголовок сметы — имя мастера или его сервиса */
  title?: string;
}

/**
 * Округление наценённой цены до полусотни.
 *
 * «17 493 ₽» выглядит как машинный расчёт и вызывает желание торговаться,
 * «17 500 ₽» читается как названная цена. Копейки в смете вредят доверию.
 */
export const roundPrice = (value: number): number =>
  value >= 1000 ? Math.round(value / 50) * 50 : Math.round(value / 10) * 10;

/** Цена с наценкой: своим строкам наценку не добавляем */
export const withMarkup = (price: number, markup: number, custom = false) =>
  custom || !markup ? price : roundPrice(price * (1 + markup / 100));

export const quoteTotal = (lines: QuoteLine[]): number =>
  lines.reduce((sum, l) => sum + l.price * l.qty, 0);

/**
 * Смета обычным текстом — для отправки в мессенджер.
 *
 * Текст выбран основным форматом не случайно: он вставляется в переписку
 * одной кнопкой, читается с телефона и не требует ничего скачивать.
 */
export const quoteText = (lines: QuoteLine[], opts: QuoteOptions): string => {
  const head: string[] = [];
  if (opts.title?.trim()) head.push(opts.title.trim());
  if (isVehicle(opts.vehicle)) {
    const v = opts.vehicle;
    head.push(`${v.brand} ${v.model}, ${v.year} г.`);
  }

  const body = lines.map((l) => {
    const count = l.qty > 1 ? ` × ${l.qty}` : '';
    /* Без построчных цен смета превращается в состав работ: некоторые
       мастера намеренно не показывают, сколько стоит каждая железка */
    if (!opts.perLine) return `— ${l.name}${count}`;
    return `— ${l.name}${count} — ${formatPrice(l.price * l.qty)}`;
  });

  const total = `Итого: ${formatPrice(quoteTotal(lines))}`;
  return [...head, '', ...body, '', total].join('\n').trim();
};

/** Та же смета таблицей — для выгрузки в Excel */
export const quoteCsv = (lines: QuoteLine[], opts: QuoteOptions): string => {
  const rows: string[][] = [['Наименование', 'Кол-во', 'Цена', 'Сумма']];
  lines.forEach((l) => {
    rows.push([l.name, String(l.qty), String(l.price), String(l.price * l.qty)]);
  });
  rows.push(['', '', 'Итого', String(quoteTotal(lines))]);

  const head: string[][] = [];
  if (opts.title?.trim()) head.push([opts.title.trim()]);
  if (isVehicle(opts.vehicle)) {
    const v = opts.vehicle;
    head.push([`${v.brand} ${v.model}, ${v.year} г.`]);
  }
  if (head.length) head.push([]);

  /* Точка с запятой и BOM — иначе русский Excel откроет файл одной
     колонкой и в кракозябрах */
  const escape = (cell: string) =>
    /[";\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
  const body = [...head, ...rows]
    .map((r) => r.map(escape).join(';'))
    .join('\r\n');
  return `\uFEFF${body}`;
};

/** Скачивание готового файла без похода на сервер */
export const downloadFile = (name: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/** Имя файла со сметой: «Смета Kia Rio 2015.csv» */
export const quoteFileName = (vehicle: Vehicle | null, ext: string): string => {
  const car = isVehicle(vehicle)
    ? ` ${vehicle.brand} ${vehicle.model} ${vehicle.year}`
    : '';
  return `Смета${car}.${ext}`.replace(/\s+/g, ' ');
};
