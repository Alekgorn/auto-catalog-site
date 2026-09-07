import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { fitKey, withoutAllMark, isAllModels } from '@/lib/fits-match';

/** Категория, в которой лежат проводки-переходники */
const WIRE_CATEGORY = 'Переходники для подключения магнитол';

/** Категория переходных рамок */
const FRAME_CATEGORY = 'Переходные рамки для магнитол';

/** Рамка и проводка, чьи годы расходятся */
export interface YearGap {
  frame: AdminProduct;
  wire: AdminProduct;
  /** Годы рамки и проводки — показываем оба диапазона */
  frameYears: [number, number];
  wireYears: [number, number];
  /** Годы рамки, которые проводка не закрывает */
  uncovered: string;
}

/** Товар, где марка проставлена, но в названии её нет */
export interface BrandMismatch {
  product: AdminProduct;
  /** Марки из совместимости, не упомянутые в названии */
  missing: string[];
  /** Марки, которые в названии есть — для контекста */
  present: string[];
}

/**
 * Марки, которые в названиях пишут по-русски. «Лада Веста» и
 * «Lada (ВАЗ)» — одна марка, и считать это расхождением нельзя.
 */
const BRAND_ALIASES: Record<string, string[]> = {
  lada: ['лада', 'ваз', 'vaz'],
  chevrolet: ['шевроле'],
  mercedesbenz: ['mercedes', 'мерседес'],
  volkswagen: ['vw', 'фольксваген'],
  hyundai: ['хендай', 'хёндай'],
  kia: ['киа'],
  toyota: ['тойота'],
  nissan: ['ниссан'],
  renault: ['рено'],
  bmw: ['бмв'],
};

/** Упомянута ли марка в названии — с поправкой на русское написание */
const brandInName = (nameKey: string, brand: string): boolean => {
  /* Уточнение в скобках отбрасываем: в справочнике «Lada (ВАЗ)»,
     в названии просто «Лада» — это одна и та же марка */
  const base = fitKey(brand.replace(/\([^)]*\)/g, ' '));
  if (base && nameKey.includes(base)) return true;

  return (BRAND_ALIASES[base] ?? []).some((alias) =>
    nameKey.includes(fitKey(alias)),
  );
};

const years = (p: AdminProduct): [number, number] => [
  Number(p.yearFrom) || 0,
  Number(p.yearTo) || 0,
];

/**
 * Какие годы рамки проводка не покрывает.
 *
 * Рамка живёт весь срок кузова, а проводка привязана к поколению
 * электроники — они честно могут не совпадать. Но если проводка
 * закрывает лишь часть срока, покупатель с «неудачным» годом увидит
 * у рамки перечёркнутую позицию и не поймёт почему.
 */
const uncoveredYears = (
  frame: [number, number],
  wire: [number, number],
): string => {
  const [fa, fb] = frame;
  const [wa, wb] = wire;
  if (!fa || !fb || !wa || !wb) return '';

  const gaps: string[] = [];
  if (wa > fa) gaps.push(`${fa}–${Math.min(wa - 1, fb)}`);
  if (wb < fb) gaps.push(`${Math.max(wb + 1, fa)}–${fb}`);
  return gaps.join(', ');
};

/**
 * Проводки, чьи годы не покрывают весь срок привязанной рамки.
 *
 * Не ошибка сама по себе: у рамки BMW X3 2011–2017 честно бывает
 * проводка CIC до 2015 и NBT с 2013. Список нужен, чтобы глазами
 * отделить такие случаи от опечаток в годах.
 */
export const findYearGaps = (products: AdminProduct[]): YearGap[] => {
  const bySlug = new Map(
    products.filter((p) => p.slug).map((p) => [p.slug as string, p]),
  );
  const out: YearGap[] = [];

  products.forEach((frame) => {
    if (frame.category !== FRAME_CATEGORY) return;
    (frame.frameWires ?? []).forEach((slug) => {
      const wire = bySlug.get(slug);
      if (!wire) return;

      const fy = years(frame);
      const wy = years(wire);
      const gap = uncoveredYears(fy, wy);
      if (!gap) return;

      out.push({ frame, wire, frameYears: fy, wireYears: wy, uncovered: gap });
    });
  });

  return out.sort((a, b) => a.frame.name.localeCompare(b.frame.name));
};

/**
 * Товары, где марка проставлена в совместимости, но в названии её нет.
 *
 * Так всплыла проводка «для Porsche, Mercedes-Benz» с отметкой BMW:
 * либо марку поставили по ошибке, либо забыли дописать в название.
 * Решать человеку — мы только показываем расхождение.
 */
export const findBrandMismatch = (
  products: AdminProduct[],
  onlyWires = true,
): BrandMismatch[] => {
  const out: BrandMismatch[] = [];

  products.forEach((p) => {
    if (onlyWires && p.category !== WIRE_CATEGORY) return;

    const brands = Object.keys(p.fits ?? {});
    /* Товар на десяток марок — это универсальная позиция вроде ISO-
       переходника, перечислять их все в названии никто не станет */
    if (brands.length === 0 || brands.length > 4) return;

    /* Товар назван по концерну — марки в нём перечислять не принято:
       «Переходник для GM концерна» покрывает Opel, Saab, Chevrolet */
    if (/концерн|группа|group/i.test(p.name)) return;

    const nameKey = fitKey(p.name);
    const missing = brands.filter((b) => !brandInName(nameKey, b));
    if (!missing.length) return;

    out.push({
      product: p,
      missing,
      present: brands.filter((b) => nameKey.includes(fitKey(b))),
    });
  });

  return out.sort((a, b) => b.missing.length - a.missing.length);
};

/**
 * Марки, где выбран почти полный список моделей.
 *
 * Верный признак, что брали «всю марку» перечнем, а потом справочник
 * пополнился. Такие стоит перевести на метку «вся марка», чтобы
 * совместимость больше не устаревала.
 */
export interface StaleFit {
  product: AdminProduct;
  brand: string;
  selected: number;
  total: number;
  /** Каких моделей не хватает до полного списка */
  missing: string[];
}

export const findStaleFits = (
  products: AdminProduct[],
  brands: { name: string; models: string[] }[],
): StaleFit[] => {
  const out: StaleFit[] = [];
  const byKey = new Map(brands.map((b) => [fitKey(b.name), b]));

  products.forEach((p) => {
    if (p.category !== WIRE_CATEGORY) return;

    Object.entries(p.fits ?? {}).forEach(([brand, models]) => {
      // Уже переведено на метку — устареть не может
      if (isAllModels(models)) return;

      const ref = byKey.get(fitKey(brand));
      if (!ref || !ref.models.length) return;

      const chosen = withoutAllMark(models);
      const share = chosen.length / ref.models.length;
      if (share < 0.9 || chosen.length >= ref.models.length) return;

      const chosenKeys = new Set(chosen.map(fitKey));
      out.push({
        product: p,
        brand,
        selected: chosen.length,
        total: ref.models.length,
        missing: ref.models.filter((m) => !chosenKeys.has(fitKey(m))),
      });
    });
  });

  return out.sort((a, b) => b.missing.length - a.missing.length);
};