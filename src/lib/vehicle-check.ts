import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { findFitModels, hasFitModel, isAllModels } from '@/lib/fits-match';

const WIRE_CATEGORY = 'Переходники для подключения магнитол';
const FRAME_CATEGORY = 'Переходные рамки для магнитол';

/** Машина, которую проверяем: как её вводит покупатель */
export interface CheckVehicle {
  brand: string;
  model: string;
  year: number;
}

/** Почему товар выглядит подозрительно в этом подборе */
export type Flag =
  | 'no-features'
  | 'all-models'
  | 'name-mismatch'
  | 'no-frame-wires';

export const FLAG_TITLES: Record<Flag, string> = {
  'no-features': 'Не отмечено, что подключает',
  'all-models': 'Совместимость «вся марка»',
  'name-mismatch': 'В названии другая марка',
  'no-frame-wires': 'К рамке не привязана проводка',
};

export const FLAG_HINTS: Record<Flag, string> = {
  'no-features':
    'Подбор не знает, тянет ли товар камеру, усилитель и CAN. Такой товар после ответа покупателя уезжает в «может не подойти», хотя он просто не размечен.',
  'all-models':
    'Выбрана вся марка целиком, а в названии — конкретная модель или годы. Товар вылезет на все машины этой марки.',
  'name-mismatch':
    'Марка машины не упомянута в названии товара. Часто нормально для универсальных позиций, но у переходника под конкретное авто — повод проверить.',
  'no-frame-wires':
    'У рамки не отмечено, какие проводки к ней подходят. Подбор проводки по такой рамке работает вслепую.',
};

export interface CheckRow {
  product: AdminProduct;
  flags: Flag[];
}

export interface VehicleCheck {
  /** Что выйдет на шаге проводки */
  wires: CheckRow[];
  /** Что выйдет на шаге рамки */
  frames: CheckRow[];
  /** Строки с замечаниями — их и надо смотреть */
  issues: number;
}

/** Совместим ли товар с машиной — та же логика, что на сайте */
const fitsVehicle = (p: AdminProduct, v: CheckVehicle): boolean => {
  const models = findFitModels(p.fits ?? {}, v.brand);
  if (!models || !hasFitModel(models, v.model)) return false;
  const from = Number(p.yearFrom) || 0;
  const to = Number(p.yearTo) || 9999;
  return v.year >= from && v.year <= to;
};

/** Есть ли в названии намёк на конкретную модель или годы */
const looksSpecific = (name: string): boolean =>
  /\d{4}/.test(name) || /\b(тип|type)\b/i.test(name);

/**
 * Проверка подбора по конкретной машине.
 *
 * Отвечает на вопрос «почему в подборе вылезло вот это». Правила
 * специально мягкие: ни один флаг не означает ошибку наверняка —
 * каталог знает человек, а не проверка. Задача — сузить четыреста
 * карточек до нескольких подозрительных.
 */
export const checkVehicle = (
  products: AdminProduct[],
  v: CheckVehicle,
): VehicleCheck => {
  const brandKey = v.brand.toLowerCase().replace(/\([^)]*\)/g, '').trim();

  const rows = (category: string): CheckRow[] =>
    products
      .filter(
        (p) => p.isActive !== false && p.category === category && fitsVehicle(p, v),
      )
      .map((p) => {
        const flags: Flag[] = [];
        const name = p.name.toLowerCase();

        if (category === WIRE_CATEGORY && !(p.wireFeatures ?? []).length)
          flags.push('no-features');

        if (
          isAllModels(findFitModels(p.fits ?? {}, v.brand)) &&
          looksSpecific(p.name)
        )
          flags.push('all-models');

        if (brandKey && !name.includes(brandKey.split(' ')[0]))
          flags.push('name-mismatch');

        if (category === FRAME_CATEGORY && !(p.frameWires ?? []).length)
          flags.push('no-frame-wires');

        return { product: p, flags };
      })
      /* Сначала подозрительные: ради них проверку и открывают */
      .sort((a, b) => b.flags.length - a.flags.length);

  const wires = rows(WIRE_CATEGORY);
  const frames = rows(FRAME_CATEGORY);

  return {
    wires,
    frames,
    issues: [...wires, ...frames].filter((r) => r.flags.length).length,
  };
};
