import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { FRAMES_CATEGORY, WIRES_CATEGORY } from '@/lib/kit-filter';

/**
 * Группа рамок под одну машину и один период.
 *
 * На Kia Rio 2017–2019 продаётся четыре рамки — 9", 10", с кнопкой и без.
 * Панель у них общая, значит и проводка одна и та же. Поэтому размечаем
 * группу целиком: одно действие вместо четырёх.
 */
export interface FrameGroup {
  /** Ключ для списка: марка, модель и годы */
  key: string;
  brand: string;
  model: string;
  from: number;
  to: number;
  /** Рамки этой группы — все размечаются разом */
  frames: AdminProduct[];
  /** Артикулы проводок. Расходятся внутри группы — значит размечали порознь */
  wires: string[];
  /** Проводки проставлены не всем рамкам группы или разные у разных */
  mixed: boolean;
}

/** Пары «марка + модель» товара — по ним и раскладываем рамки */
const pairsOf = (p: AdminProduct) => {
  const out: { brand: string; model: string }[] = [];
  Object.entries(p.fits ?? {}).forEach(([brand, models]) => {
    (models ?? []).forEach((model) => out.push({ brand, model }));
  });
  return out;
};

/**
 * Рамки, сгруппированные по машине и периоду.
 *
 * Периоды берём как есть с товаров — рамка «2011–2017» реально продаётся
 * под машину 2011 года, и подгонять её границы значит врать о товаре.
 * Соседние периоды с разницей в год считаем одним: поставщики пишут
 * «2011» и «2012» про одну и ту же панель.
 */
export const frameGroups = (products: AdminProduct[]): FrameGroup[] => {
  const byModel = new Map<string, AdminProduct[]>();

  products
    .filter(
      (p) =>
        p.isActive &&
        p.category === FRAMES_CATEGORY &&
        p.fitMode !== 'universal' &&
        p.yearFrom,
    )
    .forEach((p) => {
      pairsOf(p).forEach(({ brand, model }) => {
        const key = `${brand}|${model}`;
        const arr = byModel.get(key);
        if (arr) arr.push(p);
        else byModel.set(key, [p]);
      });
    });

  const out: FrameGroup[] = [];

  byModel.forEach((frames, key) => {
    const [brand, model] = key.split('|');
    const sorted = [...frames].sort(
      (a, b) => a.yearFrom - b.yearFrom || a.yearTo - b.yearTo,
    );

    const groups: { from: number; to: number; frames: AdminProduct[] }[] = [];
    sorted.forEach((p) => {
      const last = groups[groups.length - 1];
      if (
        last &&
        Math.abs(last.from - p.yearFrom) <= 1 &&
        Math.abs(last.to - (p.yearTo || last.to)) <= 1
      ) {
        last.frames.push(p);
        return;
      }
      groups.push({ from: p.yearFrom, to: p.yearTo, frames: [p] });
    });

    groups.forEach((g) => {
      /* Проводки группы. Если у рамок они разошлись — показываем это
         честно: значит кто-то размечал их поодиночке, и надо свести */
      const sets = g.frames.map((f) => [...(f.frameWires ?? [])].sort().join('|'));
      const first = sets[0] ?? '';
      const mixed = sets.some((s) => s !== first);
      const wires = [...new Set(g.frames.flatMap((f) => f.frameWires ?? []))];

      out.push({
        key: `${brand}|${model}|${g.from}-${g.to}`,
        brand,
        model,
        from: g.from,
        to: g.to,
        frames: g.frames,
        wires,
        mixed,
      });
    });
  });

  return out.sort(
    (a, b) =>
      a.brand.localeCompare(b.brand) ||
      a.model.localeCompare(b.model) ||
      a.from - b.from,
  );
};

/**
 * Проводки, которые вообще могут подойти этой группе.
 *
 * Предлагаем не весь каталог, а только то, что привязано к той же машине
 * и пересекается по годам: из трёх вариантов выбрать легко, из четырёхсот
 * невозможно.
 */
export const wireCandidates = (
  products: AdminProduct[],
  group: FrameGroup,
): AdminProduct[] =>
  products
    .filter((p) => {
      if (!p.isActive || p.category !== WIRES_CATEGORY) return false;
      const models = Object.entries(p.fits ?? {}).find(
        ([b]) => b.toLowerCase() === group.brand.toLowerCase(),
      )?.[1];
      if (
        !Array.isArray(models) ||
        !models.some((m) => m.toLowerCase() === group.model.toLowerCase())
      )
        return false;
      // Годы должны пересекаться хотя бы частично
      const from = p.yearFrom || 1990;
      const to = p.yearTo || 2100;
      return from <= (group.to || 2100) && to >= group.from;
    })
    .sort((a, b) => a.price - b.price);
