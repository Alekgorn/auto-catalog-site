import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { VehicleWiring } from '@/lib/wire-pick';
import {
  FRAMES_CATEGORY,
  HEADUNITS_CATEGORY,
  WIRES_CATEGORY,
} from '@/lib/kit-filter';

/**
 * Проверки комплекта: рамки, проводки и разметка подбора.
 *
 * Отличие от data-audit: там смотрят внутрь одной карточки, здесь —
 * связи между сущностями. Рамка есть, а проводки под ту же машину нет;
 * разметка ссылается на удалённый товар; годы в названии разошлись с
 * полем. Такие вещи видно только когда смотришь на каталог целиком.
 *
 * Ничего не чиним автоматически: часть находок окажется нормой, и
 * решать должен тот, кто знает ассортимент.
 */

export type KitLevel = 'error' | 'warning';

export interface KitIssue {
  rule: string;
  level: KitLevel;
  /** Что показываем в строке списка — название товара или машины */
  title: string;
  /** Суть замечания */
  text: string;
  hint?: string;
  /** Карточка, которую можно открыть в редакторе. Нет — значит правится в разметке */
  product?: AdminProduct;
}

/* ─────────── годы в названии против поля ─────────── */

const YEAR_MAX = new Date().getFullYear() + 2;
const YEAR_MIN = 1985;

/**
 * Все диапазоны годов из строки.
 *
 * «2006 - 2011» — пара, «2016+» — открытый конец. Разделители у
 * поставщиков разные: дефис, тире, длинное тире.
 */
const rangesIn = (raw: string): { from: number; to: number | null }[] => {
  const s = (raw ?? '').replace(/[–—]/g, '-');
  const out: { from: number; to: number | null }[] = [];

  const pair = /\b(19\d{2}|20\d{2})\s*-\s*(19\d{2}|20\d{2}|\d{2})\b/g;
  let m = pair.exec(s);
  while (m) {
    const from = Number(m[1]);
    // «04-13» — короткая запись второго года, дописываем век от первого
    const rawTo = m[2];
    const to =
      rawTo.length === 2
        ? Number(String(from).slice(0, 2) + rawTo)
        : Number(rawTo);
    out.push({ from, to });
    m = pair.exec(s);
  }

  const open = /\b(19\d{2}|20\d{2})\s*\+/g;
  m = open.exec(s);
  while (m) {
    out.push({ from: Number(m[1]), to: null });
    m = open.exec(s);
  }
  return out;
};

/**
 * Годы в названии разошлись с полем товара.
 *
 * Берём самый широкий охват из названия: когда перечислено несколько
 * машин («Isuzu D-Max 2012+, Chevrolet 2012-2015»), поле должно
 * покрывать их все, и сравнивать с одной парой бессмысленно.
 *
 * Расхождение в один год не считаем ошибкой: поколения размечают
 * по-разному, и придираться к границе — только шуметь.
 */
const checkYears = (p: AdminProduct): KitIssue | null => {
  const ranges = rangesIn(p.name).filter(
    (r) => r.from >= YEAR_MIN && r.from <= YEAR_MAX,
  );
  if (!ranges.length) return null;

  const from = p.yearFrom ?? 0;
  const to = p.yearTo ?? 0;
  if (!from && !to) return null;

  const lo = Math.min(...ranges.map((r) => r.from));
  const openEnd = ranges.some((r) => r.to === null);
  const hi = openEnd
    ? null
    : Math.max(...ranges.map((r) => r.to as number));

  const loOff = Math.abs(from - lo);
  const hiOff = hi === null ? 0 : Math.abs(to - hi);
  if (loOff <= 1 && hiOff <= 1) return null;

  const inName = openEnd ? `${lo}+` : `${lo}–${hi}`;
  return {
    rule: 'years',
    level: 'warning',
    title: p.name,
    text: `В названии ${inName}, в карточке ${from}–${to}`,
    hint:
      'Машина из «лишних» годов товар не найдёт, из «недостающих» — увидит лишнее',
    product: p,
  };
};

/* ─────────── товары без привязки к машине ─────────── */

/**
 * Рамка или проводка, которую подбор не покажет никому.
 *
 * Универсальные позиции сюда не попадают: у них так и задумано.
 * Ругаемся только на те, что подбираются по авто, но список машин пуст.
 */
const checkNoFits = (p: AdminProduct): KitIssue | null => {
  if (p.fitMode === 'universal') return null;
  const brands = Object.entries(p.fits ?? {}).filter(
    ([, models]) => Array.isArray(models) && models.length > 0,
  );
  if (brands.length) return null;
  return {
    rule: 'no-fits',
    level: 'error',
    title: p.name,
    text: 'Нет ни одной марки и модели',
    hint: 'Подбор по машине не покажет этот товар никому',
    product: p,
  };
};

/* ─────────── связка рамка ↔ проводка ─────────── */

/**
 * Пары «марка + модель» товара.
 *
 * key — в нижнем регистре, чтобы сравнивать наборы независимо от того,
 * кто как записал. brand и model — как есть: их подставляем в новую
 * карточку, и там нужно настоящее написание из справочника.
 */
const pairsOf = (
  p: AdminProduct,
): { key: string; brand: string; model: string }[] => {
  const out: { key: string; brand: string; model: string }[] = [];
  Object.entries(p.fits ?? {}).forEach(([brand, models]) => {
    if (!Array.isArray(models)) return;
    models.forEach((model) =>
      out.push({
        key: `${brand.toLowerCase()}|${model.toLowerCase()}`,
        brand,
        model,
      }),
    );
  });
  return out;
};

/** Пересекаются ли годы двух товаров */
const yearsOverlap = (a: AdminProduct, b: AdminProduct): boolean => {
  const a0 = a.yearFrom || YEAR_MIN;
  const a1 = a.yearTo || YEAR_MAX;
  const b0 = b.yearFrom || YEAR_MIN;
  const b1 = b.yearTo || YEAR_MAX;
  return a0 <= b1 && b0 <= a1;
};

export interface KitGapRow {
  /** Марка и модель как записаны в товаре — годятся для новой карточки */
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  /** Рамка, из-за которой машина попала в список */
  example: string;
}

/**
 * Машины, где есть рамка, но нет проводки.
 *
 * Магнитоле нужны обе части: рамка закрывает место в панели, проводка
 * подключает питание и звук. Есть только рамка — покупатель дойдёт до
 * второго шага и упрётся. Спрос на такую машину уже подтверждён тем,
 * что рамку под неё завезли, а закрыть его нечем.
 *
 * Обратную сторону (проводка без рамки) не проверяем: проводки обычно
 * привязаны ко всей марке разом, поэтому «непокрытых» моделей там
 * тысяча, и почти все — ложные. Рамки же размечены точечно, по машинам,
 * и их отсутствие говорит о реальной дыре.
 *
 * Универсальные позиции в расчёт не берём: они подходят «вообще», но
 * не доказывают, что на конкретную панель что-то встанет.
 */
export const findKitGaps = (products: AdminProduct[]): KitGapRow[] => {
  const frames = products.filter(
    (p) =>
      p.isActive && p.category === FRAMES_CATEGORY && p.fitMode !== 'universal',
  );
  const wires = products.filter(
    (p) =>
      p.isActive && p.category === WIRES_CATEGORY && p.fitMode !== 'universal',
  );

  const index = (list: AdminProduct[]) => {
    const map = new Map<
      string,
      { brand: string; model: string; items: AdminProduct[] }
    >();
    list.forEach((p) => {
      pairsOf(p).forEach(({ key, brand, model }) => {
        const cell = map.get(key);
        if (cell) cell.items.push(p);
        else map.set(key, { brand, model, items: [p] });
      });
    });
    return map;
  };

  const wireMap = index(wires);
  const rows: KitGapRow[] = [];

  index(frames).forEach(({ brand, model, items }, key) => {
    const other = wireMap.get(key)?.items ?? [];
    // Берём рамку, которой не нашлось проводки с пересечением по годам
    const orphan = items.find((p) => !other.some((o) => yearsOverlap(p, o)));
    if (!orphan) return;
    rows.push({
      brand,
      model,
      yearFrom: orphan.yearFrom || 0,
      yearTo: orphan.yearTo || 0,
      example: orphan.name,
    });
  });

  return rows.sort(
    (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model),
  );
};

/* ─────────── размеры: рамка против магнитол ─────────── */

/** Диагональ из строки: «9 дюймов», «12,3″» */
const sizeIn = (text: string): number | null => {
  const m = (text ?? '').match(/(\d+(?:[.,]\d+)?)\s*(?:"|″|дюйм)/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
};

/**
 * Диагональ товара: сперва из характеристик, потом из названия.
 * Тот же порядок, что и на сайте, — иначе проверка ругалась бы на
 * товары, которые покупатель видит правильно.
 */
const sizeOf = (p: AdminProduct): number | null => {
  const spec = (p.specs ?? []).find(([k]) => {
    const key = String(k).trim().toLowerCase();
    return key.startsWith('диагональ') || key.startsWith('типоразмер');
  });
  if (spec) {
    const v = sizeIn(spec[1]);
    if (v) return v;
  }
  return sizeIn(p.name);
};

/** Размеры совпали. Полдюйма допуска: 12,3 встаёт в рамку «12,1» */
const sameSize = (a: number, b: number): boolean => Math.abs(a - b) <= 0.5;

/**
 * Рамки, в которые нечего поставить.
 *
 * Рамка задаёт посадочное место, магнитола должна в него попасть по
 * диагонали. Рамка на 7 дюймов, когда в каталоге нет ни одной 7-дюймовой
 * магнитолы, — тупик: покупатель выберет машину, дойдёт до экрана и
 * увидит пустой список.
 *
 * Отдельно ловим рамки вообще без размера: подбор не сможет отфильтровать
 * по ним магнитолы и покажет все подряд, включая те, что не влезут.
 */
const checkFrameSize = (
  p: AdminProduct,
  headunitSizes: number[],
): KitIssue | null => {
  if (p.category !== FRAMES_CATEGORY) return null;

  const size = sizeOf(p);
  if (size === null) {
    return {
      rule: 'no-size',
      level: 'warning',
      title: p.name,
      text: 'У рамки не указана диагональ',
      hint: 'Подбор не отсеет магнитолы, которые в неё не встанут',
      product: p,
    };
  }

  if (!headunitSizes.length) return null;
  if (headunitSizes.some((h) => sameSize(h, size))) return null;

  const have = [...new Set(headunitSizes)]
    .sort((a, b) => a - b)
    .map((s) => `${String(s).replace('.', ',')}″`)
    .join(', ');
  return {
    rule: 'size-orphan',
    level: 'warning',
    title: p.name,
    text: `Рамка на ${String(size).replace('.', ',')}″, а магнитолы есть только ${have}`,
    hint: 'Покупатель дойдёт до выбора экрана и увидит пустой список',
    product: p,
  };
};

/* ─────────── разметка подбора проводки ─────────── */

/**
 * Замечание к разметке подбора.
 *
 * Форма та же, что у KitIssue, только без карточки товара: строку
 * разметки правят во вкладке «Марки», а не в редакторе товара. Общий
 * тип позволяет показывать оба списка одним куском разметки.
 */
export type WiringIssue = KitIssue;

/**
 * Проверка разметки подбора: строки vehicle_wiring против каталога.
 *
 * Разметка живёт отдельно от товаров, поэтому легко рассыпается:
 * товар удалили — ссылка повисла, модель переименовали — строка больше
 * ни к чему не относится, два поколения наложились друг на друга —
 * покупателю покажут проводку от чужой машины.
 */
export const auditWiring = (
  rows: VehicleWiring[],
  products: AdminProduct[],
  brands: { name: string; models: string[] }[],
): WiringIssue[] => {
  const out: WiringIssue[] = [];

  const wireSlugs = new Set(
    products
      .filter((p) => p.category === WIRES_CATEGORY && p.slug)
      .map((p) => p.slug as string),
  );
  const activeSlugs = new Set(
    products
      .filter((p) => p.category === WIRES_CATEGORY && p.isActive && p.slug)
      .map((p) => p.slug as string),
  );

  const brandMap = new Map(
    brands.map((b) => [
      b.name.toLowerCase(),
      new Set(b.models.map((m) => m.toLowerCase())),
    ]),
  );

  rows.forEach((r) => {
    const where = `${r.brand} ${r.model} ${r.years[0]}–${r.years[1]}`;

    // Режим «Фиксированный» без товара — подбор не покажет ничего
    if (r.mode === 'fixed' && !r.wireSlug) {
      out.push({
        rule: 'fixed-empty',
        level: 'error',
        title: where,
        text: 'Тип «Фиксированный», но проводка не выбрана',
        hint: 'Покупатель не увидит рекомендацию — поставьте товар или тип «Подбор»',
      });
    }

    // Ссылка на товар, которого больше нет в каталоге
    if (r.wireSlug && !wireSlugs.has(r.wireSlug)) {
      out.push({
        rule: 'dead-slug',
        level: 'error',
        title: where,
        text: `Проводка «${r.wireSlug}» не найдена в каталоге`,
        hint: 'Товар удалили или сменили адрес — выберите заново',
      });
    } else if (r.wireSlug && !activeSlugs.has(r.wireSlug)) {
      out.push({
        rule: 'hidden-slug',
        level: 'warning',
        title: where,
        text: 'Выбранная проводка скрыта с сайта',
        hint: 'Покупатель её не купит — верните товар или выберите другой',
      });
    }

    // Модели нет в справочнике марок — строка ни к чему не привязана
    const models = brandMap.get(r.brand.toLowerCase());
    if (!models) {
      out.push({
        rule: 'no-brand',
        level: 'error',
        title: where,
        text: `Марки «${r.brand}» нет в справочнике`,
        hint: 'Строка не сработает: подбор ищет машину по справочнику',
      });
    } else if (!models.has(r.model.toLowerCase())) {
      out.push({
        rule: 'no-model',
        level: 'error',
        title: where,
        text: `Модели «${r.model}» нет у марки ${r.brand}`,
        hint: 'Модель переименовали или удалили — поправьте строку',
      });
    }

    if (r.years[0] > r.years[1]) {
      out.push({
        rule: 'years-order',
        level: 'error',
        title: where,
        text: `Год «с» больше года «по»: ${r.years[0]}–${r.years[1]}`,
        hint: 'Строка не сработает ни в одном году',
      });
    }
  });

  /* Наложение поколений: две строки на одну машину с пересечением по
     годам, одинаковым кузовом и рулём. Подбор возьмёт первую попавшуюся,
     то есть результат зависит от порядка в базе — а это лотерея. */
  const byModel = new Map<string, VehicleWiring[]>();
  rows.forEach((r) => {
    const key = `${r.brand.toLowerCase()}|${r.model.toLowerCase()}`;
    const arr = byModel.get(key);
    if (arr) arr.push(r);
    else byModel.set(key, [r]);
  });

  byModel.forEach((list) => {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (a.years[0] > b.years[1] || b.years[0] > a.years[1]) continue;
        if ((a.wheel || '') !== (b.wheel || '')) continue;
        const ab = [...(a.bodies ?? [])].sort().join(',');
        const bb = [...(b.bodies ?? [])].sort().join(',');
        if (ab !== bb) continue;
        out.push({
          rule: 'overlap',
          level: 'warning',
          title: `${a.brand} ${a.model}`,
          text: `Две строки на одни годы: ${a.years[0]}–${a.years[1]} и ${b.years[0]}–${b.years[1]}`,
          hint: 'Кузов и руль совпадают — какая сработает, зависит от порядка',
        });
      }
    }
  });

  return out;
};

/* ─────────── сборка проверок по товарам комплекта ─────────── */

/**
 * Рамки и проводки: годы и привязка к машине.
 *
 * Смотрим только эти два раздела: именно из них собирается комплект,
 * и ошибка здесь стоит покупателя. Остальной каталог проверяет
 * вкладка «Расхождения в карточках».
 */
export const auditKitProducts = (
  products: AdminProduct[],
  onlyActive = true,
): KitIssue[] => {
  const list = products.filter(
    (p) =>
      (p.category === FRAMES_CATEGORY || p.category === WIRES_CATEGORY) &&
      (onlyActive ? p.isActive : true),
  );

  /* Какие диагонали вообще есть в продаже. Считаем по видимым на сайте:
     скрытую магнитолу покупатель не купит, и рамка под неё всё равно
     остаётся тупиком */
  const headunitSizes = products
    .filter((p) => p.category === HEADUNITS_CATEGORY && p.isActive)
    .map(sizeOf)
    .filter((s): s is number => s !== null);

  const out: KitIssue[] = [];
  list.forEach((p) => {
    const issues = [
      checkYears(p),
      checkNoFits(p),
      checkFrameSize(p, headunitSizes),
    ].filter(Boolean) as KitIssue[];
    out.push(...issues);
  });

  return out.sort((a, b) => {
    const rank = (x: KitIssue) => (x.level === 'error' ? 0 : 1);
    return rank(a) - rank(b) || a.title.localeCompare(b.title);
  });
};

/** Понятные названия правил — для фильтров */
export const KIT_RULE_TITLES: Record<string, string> = {
  years: 'Годы не совпадают',
  'no-fits': 'Нет привязки к машине',
  'size-orphan': 'Нет магнитол под размер',
  'no-size': 'У рамки нет диагонали',
  'fixed-empty': 'Проводка не выбрана',
  'dead-slug': 'Ссылка на удалённый товар',
  'hidden-slug': 'Проводка скрыта с сайта',
  'no-brand': 'Марки нет в справочнике',
  'no-model': 'Модели нет в справочнике',
  'years-order': 'Годы наоборот',
  overlap: 'Поколения наложились',
};