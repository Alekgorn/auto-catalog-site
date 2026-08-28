import { Vehicle } from '@/data/catalog';
import { isVehicle } from '@/lib/vehicle';
import { SITE_URL } from '@/lib/seo';

/**
 * Ссылка на собранный комплект.
 *
 * Состав кладём прямо в адрес, а не в базу: ссылка не протухает, работает
 * без нашего участия и не требует ничего хранить. Цены в неё не пишем —
 * получатель увидит те, что действуют на момент открытия, иначе пересылка
 * старой ссылки обещала бы вчерашнюю стоимость.
 */

/** Позиция в ссылке: товар и сколько штук */
export interface ShareLine {
  id: string;
  qty: number;
}

/** Адрес страницы, которая разворачивает ссылку обратно в комплект */
export const SHARE_PATH = '/sborka';

/** Состав: «id*2,id,id*3». Одна штука пишется без хвоста — короче */
const packLines = (lines: ShareLine[]): string =>
  lines
    .filter((l) => l.id && l.qty > 0)
    .map((l) => (l.qty > 1 ? `${l.id}*${l.qty}` : l.id))
    .join(',');

const unpackLines = (raw: string | null): ShareLine[] => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((chunk) => {
      const [id, count] = chunk.split('*');
      const qty = Number(count ?? 1);
      return { id: id.trim(), qty: Number.isFinite(qty) && qty > 0 ? Math.min(qty, 99) : 1 };
    })
    .filter((l) => !!l.id);
};

/** Машина одной строкой: «Kia|Rio|2015» */
const packVehicle = (v: Vehicle | null): string =>
  isVehicle(v) ? `${v.brand}|${v.model}|${v.year}` : '';

const unpackVehicle = (raw: string | null): Vehicle | null => {
  if (!raw) return null;
  const [brand, model, year] = raw.split('|');
  const parsed = { brand, model, year: Number(year) };
  return isVehicle(parsed) ? parsed : null;
};

interface ShareData {
  lines: ShareLine[];
  vehicle: Vehicle | null;
  /** Сценарий, в котором собирали — получатель сможет продолжить сборку */
  slug?: string;
}

/** Адрес для пересылки: полный, с доменом — его вставляют в мессенджер */
export const buildShareUrl = ({ lines, vehicle, slug }: ShareData): string => {
  const params = new URLSearchParams();
  params.set('p', packLines(lines));
  const car = packVehicle(vehicle);
  if (car) params.set('car', car);
  if (slug) params.set('s', slug);

  /*
   * Всегда боевой домен, а не адрес текущей вкладки.
   *
   * Раньше сюда подставлялся window.location.origin — и ссылка уносила
   * с собой тот адрес, где сборку делали. Из редактора уходила ссылка на
   * черновой домен, с локального запуска — на localhost, который у
   * получателя ведёт в никуда. Хуже того, Telegram молча выбрасывает
   * такой адрес как невалидный: окно открывалось, а поле сообщения
   * оставалось пустым.
   */
  return `${SITE_URL}${SHARE_PATH}?${params.toString()}`;
};

/** Разбор адреса обратно в состав комплекта */
export const readShareParams = (search: string): ShareData => {
  const params = new URLSearchParams(search);
  return {
    lines: unpackLines(params.get('p')),
    vehicle: unpackVehicle(params.get('car')),
    slug: params.get('s') ?? undefined,
  };
};

/**
 * Подпись к ссылке в сообщении.
 *
 * Голая ссылка в переписке выглядит как спам, и по ней не переходят.
 * Короткая строка о том, что внутри, снимает этот вопрос за получателя.
 */
export const shareText = (count: number, vehicle: Vehicle | null): string => {
  const car = isVehicle(vehicle)
    ? ` для ${vehicle.brand} ${vehicle.model} ${vehicle.year} г.`
    : '';
  const what = count === 1 ? 'Товар' : `Комплект из ${count} позиций`;
  return `${what}${car} — посмотрите состав и цены:`;
};