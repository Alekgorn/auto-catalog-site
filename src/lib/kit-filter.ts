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

/** Раздел каталога с переходными рамками — источник доступных размеров */
const FRAMES_CATEGORY = 'Переходные рамки для магнитол';

/**
 * Какие диагонали реально встанут в выбранную машину.
 *
 * Смотрим переходные рамки, которые подходят этому авто, и собираем их
 * типоразмеры. Если на Kia Rio есть рамки только под 9 дюймов, то
 * магнитолу на 10 или 12 ставить некуда — предлагать её бессмысленно.
 *
 * Пустой ответ означает «ограничивать нечем»: рамок под эту машину нет
 * в каталоге или у них не заполнен размер. В этом случае список магнитол
 * не трогаем — лучше показать всё, чем случайно спрятать товар.
 */
export const availableScreenSizes = (
  products: Product[],
  vehicle: Vehicle | null,
): number[] => {
  if (!vehicle) return [];
  const sizes = new Set<number>();
  products.forEach((p) => {
    if (p.category !== FRAMES_CATEGORY) return;
    // Только точное совпадение по машине: универсальные рамки
    // ничего не говорят о посадочном месте конкретной панели
    if (!isCompatible(p, vehicle)) return;
    const s = screenSize(p);
    if (s) sizes.add(s);
  });
  return [...sizes].sort((a, b) => a - b);
};

/**
 * Магнитола влезет, если её диагональ совпала с одним из размеров рамок.
 * Позиции без указанной диагонали не отсеиваем — размер просто не заполнен,
 * и прятать товар из-за пустого поля нельзя.
 */
export const fitsAvailableSizes = (p: Product, sizes: number[]): boolean => {
  if (!sizes.length) return true;
  const s = screenSize(p);
  if (s === null) return true;
  return sizes.some((x) => sameSize(x, s));
};

interface Args {
  step: KitStep;
  products: Product[];
  vehicle: Vehicle | null;
  brandsCount: number;
  /** Диагональ выбранной магнитолы — под неё подбираем рамку */
  size?: number | null;
  /**
   * Диагонали, под которые есть рамки на выбранную машину.
   * Ограничивают выбор магнитол на ведущем шаге.
   */
  availableSizes?: number[];
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
  availableSizes,
}: Args): Product[] => {
  let out = products.filter((p) => p.category === step.category);

  // Ведущий шаг — магнитола. Показываем только те диагонали, под которые
  // на эту машину есть рамка: иначе покупатель выберет экран, который
  // потом некуда поставить, и упрётся в пустой шаг с рамками
  if (step.leading && availableSizes?.length) {
    out = out.filter((p) => fitsAvailableSizes(p, availableSizes));
  }

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