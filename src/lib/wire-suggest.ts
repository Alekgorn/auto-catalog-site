import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { FrameGroup } from '@/lib/frame-wiring';
import { WIRES_CATEGORY } from '@/lib/kit-filter';
import { fitKey, hasFitModel, findFitModels } from '@/lib/fits-match';

/**
 * Подсказки связок «рамка — проводка».
 *
 * Проводки сейчас проставлены полусотне рамок из тысячи с лишним: почти
 * везде покупатель видит рамку без проводки. Проходить каталог руками —
 * это месяцы, поэтому кандидатов ищем машиной, а решение оставляем
 * человеку: связка ставится только по нажатию.
 *
 * Ключевое правило отбора — модель должна быть названа в самой проводке.
 * Если брать только марку и годы, на рамку выходит по восемь кандидатов
 * и список превращается в мусор; с проверкой названия у большинства
 * рамок остаётся один-два варианта.
 */

/** Насколько предложение надёжно */
export type SuggestLevel = 'sure' | 'doubt';

export interface WireSuggestion {
  wire: AdminProduct;
  level: SuggestLevel;
  /** Почему предложена — показываем человеку прямым текстом */
  why: string;
  /** Чем настораживает: короткое пересечение, разные периоды */
  warn: string;
  /** Сколько лет рамки проводка реально закрывает */
  overlap: number;
}

export interface FrameSuggestion {
  group: FrameGroup;
  candidates: WireSuggestion[];
}

/** Пересечение двух периодов в годах (0 — не пересекаются) */
const overlapYears = (
  a: [number, number],
  b: [number, number],
): number => {
  const from = Math.max(a[0], b[0]);
  const to = Math.min(a[1], b[1]);
  return to < from ? 0 : to - from + 1;
};

/**
 * Названа ли модель прямо в тексте проводки.
 *
 * Сравниваем по «отпечатку» — без пробелов, дефисов и регистра, — иначе
 * «CS35 Plus» и «cs35plus» не совпали бы. Короткие названия («3» у Mazda,
 * «S» у Tesla) так проверять нельзя: цифра встретится в любом тексте,
 * и подсказка выйдет ложной.
 */
const modelNamed = (wire: AdminProduct, model: string): boolean => {
  const key = fitKey(model);
  if (key.length < 3) return false;

  const haystack = fitKey(
    `${wire.name} ${(wire.description ?? []).join(' ')}`,
  );
  return haystack.includes(key);
};

/**
 * Проводки-кандидаты для группы рамок.
 *
 * Берём проводки той же марки и модели с пересечением по годам, затем
 * оставляем те, где модель названа в тексте. Остальные отбрасываем: они
 * подходят «по марке вообще» и только зашумляют список.
 */
export const suggestWires = (
  products: AdminProduct[],
  group: FrameGroup,
): WireSuggestion[] => {
  const frameYears: [number, number] = [
    group.from || 1990,
    group.to || 2100,
  ];
  const frameSpan = frameYears[1] - frameYears[0] + 1;

  const out: WireSuggestion[] = [];

  products.forEach((wire) => {
    if (!wire.isActive || wire.category !== WIRES_CATEGORY) return;

    /* Марка и модель — через общую сверку: она знает и про разные
       написания («FIAT»/«Fiat»), и про метку «вся марка» */
    const models = findFitModels(wire.fits, group.brand);
    if (!models || !hasFitModel(models, group.model)) return;

    const wireYears: [number, number] = [
      wire.yearFrom || 1990,
      wire.yearTo || 2100,
    ];
    const overlap = overlapYears(frameYears, wireYears);
    if (overlap <= 0) return;

    // Модель должна быть названа явно — иначе это «подходит марке вообще»
    if (!modelNamed(wire, group.model)) return;

    /* Пересечение в год-два при широкой рамке — почти всегда соседнее
       поколение: рамка Nexia 2008–2016 и проводка Nexia 1994–2008
       стыкуются ровно на 2008-м, и это не совпадение, а край периода */
    const shortOverlap = overlap <= 2 && frameSpan > 3;
    /* Проводка начинается позже рамки — ранние машины останутся без
       проводки: рамка Malibu 2015+, проводка Malibu 2018+ */
    const startsLater = wireYears[0] > frameYears[0];
    const endsEarlier = wireYears[1] < frameYears[1];

    const warns: string[] = [];
    if (shortOverlap) {
      warns.push(
        `пересечение всего ${overlap} ${overlap === 1 ? 'год' : 'года'} — похоже на соседнее поколение`,
      );
    } else {
      if (startsLater) warns.push(`не закроет ${frameYears[0]}–${wireYears[0] - 1}`);
      if (endsEarlier) warns.push(`не закроет ${wireYears[1] + 1}–${frameYears[1]}`);
    }

    out.push({
      wire,
      level: shortOverlap ? 'doubt' : 'sure',
      why: `${group.brand} ${group.model} названа в проводке, годы ${wireYears[0]}–${wireYears[1]}`,
      warn: warns.join('; '),
      overlap,
    });
  });

  /* Сначала надёжные и те, что закрывают больше лет рамки: если вариантов
     несколько, первым должен идти самый подходящий */
  return out.sort(
    (a, b) =>
      Number(a.level === 'doubt') - Number(b.level === 'doubt') ||
      b.overlap - a.overlap ||
      a.wire.price - b.wire.price,
  );
};

/**
 * Все группы рамок без проводки, у которых есть кандидаты.
 *
 * Комплектные рамки пропускаем: проводка у них в коробке, связывать
 * нечего. Уже размеченные — тоже, там работа сделана.
 */
export const suggestAll = (
  products: AdminProduct[],
  groups: FrameGroup[],
): FrameSuggestion[] => {
  const out: FrameSuggestion[] = [];

  groups.forEach((group) => {
    if (group.wires.length && !group.mixed) return;
    if (group.frames.every((f) => f.wireIncluded)) return;

    const candidates = suggestWires(products, group);
    if (!candidates.length) return;

    out.push({ group, candidates });
  });

  /* Сначала однозначные: где кандидат один и он надёжный, решение
     занимает секунду — такие проходятся пачкой за один заход */
  return out.sort((a, b) => {
    const aSure = a.candidates.length === 1 && a.candidates[0].level === 'sure';
    const bSure = b.candidates.length === 1 && b.candidates[0].level === 'sure';
    if (aSure !== bSure) return aSure ? -1 : 1;
    return (
      a.candidates.length - b.candidates.length ||
      a.group.brand.localeCompare(b.group.brand) ||
      a.group.model.localeCompare(b.group.model)
    );
  });
};
