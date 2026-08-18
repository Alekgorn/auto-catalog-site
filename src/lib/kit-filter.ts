import {
  Product,
  Vehicle,
  isCompatible,
  matchVehicle,
  productSpecs,
  splitByFit,
} from '@/data/catalog';
import { KitStep } from '@/data/scenarios';

/**
 * Диагональ экрана в дюймах из характеристик товара.
 * У магнитол это «Диагональ», у переходных рамок — «Типоразмер».
 * Если параметра нет — берём число из названия, магазины часто пишут
 * размер прямо там («Переходная рамка ... 9 дюймов»).
 */
export const screenSize = (p: Product): number | null => {
  const num = (s: string): number | null => {
    const m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:"|дюйм)/i);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  };

  for (const [key, value] of productSpecs(p)) {
    const k = key.trim().toLowerCase();
    if (k.startsWith('диагональ') || k.startsWith('типоразмер')) {
      const v = num(value);
      if (v) return v;
    }
  }
  return num(p.name);
};

/**
 * Размеры совпали. Допуск в полдюйма: 12,3-дюймовая магнитола встаёт
 * в рамку, помеченную как 12,1 — производители округляют по-разному.
 */
const sameSize = (a: number, b: number): boolean => Math.abs(a - b) <= 0.5;

interface Args {
  step: KitStep;
  products: Product[];
  vehicle: Vehicle | null;
  brandsCount: number;
  /** Диагональ выбранной магнитолы — под неё подбираем рамку */
  size?: number | null;
}

/**
 * Товары шага: раздел каталога, отфильтрованный по машине и, для рамок,
 * по диагонали выбранной магнитолы. Точные попадания идут первыми.
 */
export const kitStepList = ({
  step,
  products,
  vehicle,
  brandsCount,
  size,
}: Args): Product[] => {
  let out = products.filter((p) => p.category === step.category);

  if (vehicle) {
    // Рамки и проводка — только точное совпадение по машине.
    // «Универсальные» переходники сюда не пускаем: они подходят формально,
    // а на деле покупатель возьмёт не тот разъём
    out = step.strictFit
      ? out.filter((p) => isCompatible(p, vehicle))
      : out.filter((p) => matchVehicle(p, vehicle, brandsCount) !== null);
  }

  // Рамка должна совпасть с экраном магнитолы, иначе останется щель.
  // Позиции без указанного размера не трогаем — размер там просто не заполнен
  if (step.matchScreen && size) {
    out = out.filter((p) => {
      const s = screenSize(p);
      return s === null || sameSize(s, size);
    });
  }

  // В премиум-подборке сначала топовые, в остальных — доступные
  const sorted = [...out].sort((a, b) =>
    step.minPrice ? b.price - a.price : a.price - b.price,
  );
  const split = splitByFit(sorted, (p) => p, vehicle);
  return [...split.exact, ...split.universal];
};
