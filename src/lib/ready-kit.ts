import { Product } from '@/data/catalog';
import {
  FRAMES_CATEGORY,
  HEADUNITS_CATEGORY,
  WIRES_CATEGORY,
  screenSize,
} from '@/lib/kit-filter';

/**
 * Готовый комплект «под ключ»: рамка + магнитола + проводка.
 *
 * Основа — рамка: она определяет и машину, и размер экрана. Магнитолу
 * подбираем по размеру, проводку берём из привязанных к рамке. Своей цены
 * и остатка у комплекта нет: всё считается из входящих товаров, поэтому
 * правка цены рамки или магнитолы сразу видна и в комплекте.
 */

/** Рамки, для которых комплект уже показывается. Пока — пилот на одной */
export const READY_KIT_FRAMES = ['perehodnaya-ramka-kia-rio-2011-2017-9-dyuymov'];

export const isReadyKitFrame = (id: string): boolean =>
  READY_KIT_FRAMES.includes(id);

export const readyKitPath = (frameId: string): string => `/komplekt/${frameId}`;

const inStock = (p: Product): boolean => (p.stock ?? 0) > 0;

/** Допуск в полдюйма: производители округляют 12,3 и 12,1 по-разному */
const sameSize = (a: number, b: number): boolean => Math.abs(a - b) <= 0.5;

/**
 * Магнитолы под размер рамки: сначала в наличии, внутри — от дешёвой.
 * Если в наличии нет ни одной, список всё равно не пустой — комплект
 * идёт под заказ.
 */
export const headunitsFor = (frame: Product, all: Product[]): Product[] => {
  const size = screenSize(frame);
  if (!size) return [];
  return all
    .filter((p) => p.category === HEADUNITS_CATEGORY)
    .filter((p) => {
      const s = screenSize(p);
      return !!s && sameSize(s, size);
    })
    .sort((a, b) =>
      inStock(a) !== inStock(b) ? (inStock(a) ? -1 : 1) : a.price - b.price,
    );
};

/**
 * Проводки для комплекта — только основные переходники, привязанные к
 * рамке. Антенные и USB-переходники тоже лежат в привязке, но без них
 * магнитола работает, а без основной проводки — нет. Поэтому в «простую
 * проводку» они не годятся: иначе для Kia Rio выбирался переходник на
 * антенну за 180 ₽, у которого просто меньше всего функций.
 *
 * Порядок: сначала самая простая (меньше функций), при равенстве — в
 * наличии, затем дешёвая.
 */
export const wiresFor = (frame: Product, all: Product[]): Product[] => {
  const ids = frame.frameWires ?? [];
  return ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is Product => !!p && p.category === WIRES_CATEGORY)
    .sort((a, b) => {
      const fa = (a.wireFeatures ?? []).length;
      const fb = (b.wireFeatures ?? []).length;
      if (fa !== fb) return fa - fb;
      if (inStock(a) !== inStock(b)) return inStock(a) ? -1 : 1;
      return a.price - b.price;
    });
};

/** Допы из привязки рамки — антенна, USB: предлагаем, но не навязываем */
export const extrasFor = (frame: Product, all: Product[]): Product[] =>
  (frame.frameWires ?? [])
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is Product => !!p && p.category !== WIRES_CATEGORY);

export interface ReadyKit {
  frame: Product;
  headunits: Product[];
  wires: Product[];
  extras: Product[];
  /** Проводка уже входит в рамку — отдельную не добавляем */
  wireIncluded: boolean;
}

/** Собрать комплект по рамке. null — если из неё комплект не собрать */
export const buildReadyKit = (
  frameId: string,
  all: Product[],
): ReadyKit | null => {
  const frame = all.find((p) => p.id === frameId);
  if (!frame || frame.category !== FRAMES_CATEGORY) return null;
  const headunits = headunitsFor(frame, all);
  const wireIncluded = !!frame.wireIncluded;
  const wires = wireIncluded ? [] : wiresFor(frame, all);
  if (!headunits.length) return null;
  if (!wireIncluded && !wires.length) return null;
  return {
    frame,
    headunits,
    wires,
    extras: extrasFor(frame, all),
    wireIncluded,
  };
};

/** Машина рамки строкой: «Kia Rio 2011–2017» */
export const kitVehicleTitle = (frame: Product): string => {
  const [brand, models] = Object.entries(frame.fits ?? {})[0] ?? [];
  const model = (models ?? [])[0]?.split(' (')[0];
  const [from, to] = frame.years ?? [];
  const now = new Date().getFullYear();
  const years =
    from && to ? (to >= now ? `${from}+` : `${from}–${to}`) : '';
  return [brand, model, years].filter(Boolean).join(' ');
};
