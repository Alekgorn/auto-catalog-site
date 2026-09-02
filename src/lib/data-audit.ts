import { AdminProduct } from '@/components/admin/product-editor/product-types';

/**
 * Проверка карточек товара на правилах.
 *
 * Ищет расхождения внутри самой карточки: год в названии против поля
 * годов, перевёрнутый диапазон, пустые описания. Каждое правило — это
 * то, что можно доказать данными, без догадок. Ничего не исправляем:
 * решение всегда за человеком, потому что «ошибка» иногда оказывается
 * особенностью товара.
 */

export type IssueLevel = 'error' | 'warning';

export interface Issue {
  /** Ключ правила — по нему группируем и фильтруем список */
  rule: string;
  level: IssueLevel;
  /** Короткая суть: что именно не сходится */
  text: string;
  /** Подсказка, что с этим делать */
  hint?: string;
}

export interface AuditRow {
  product: AdminProduct;
  issues: Issue[];
}

/** Год, дальше которого «год выпуска» уже не про машину */
const YEAR_MAX = new Date().getFullYear() + 2;
const YEAR_MIN = 1985;

/**
 * Слова, после которых год в названии означает конец диапазона, а не
 * начало: «Разъём Honda до 2008 года» — это 1989-2008, и расхождение
 * с полем «год с» здесь мнимое.
 */
const UP_TO = /(?:до|по|включительно)\s*$/i;

/** Все годы из строки — вместе с тем, что стоит перед каждым */
const yearsInText = (text: string): { year: number; before: string }[] => {
  const out: { year: number; before: string }[] = [];
  const re = /(19[89]\d|20[0-4]\d)/g;
  let m = re.exec(text);
  while (m) {
    out.push({ year: Number(m[1]), before: text.slice(0, m.index).slice(-14) });
    m = re.exec(text);
  }
  return out;
};

/**
 * Год из названия расходится с полем.
 *
 * Сравниваем не «первый попавшийся», а весь набор: в названии часто
 * стоит диапазон «2007 - 2013», и совпадение хотя бы одного края
 * означает, что карточка заполнена осмысленно. Ругаемся, только когда
 * ни один год из названия не сошёлся с полем — тогда это правда опечатка.
 */
const checkYearMismatch = (p: AdminProduct): Issue | null => {
  const from = p.yearFrom ?? 0;
  const to = p.yearTo ?? 0;
  if (!from && !to) return null;

  const found = yearsInText(p.name).filter(
    (x) => x.year >= YEAR_MIN && x.year <= YEAR_MAX,
  );
  if (!found.length) return null;

  // «до 2008 года» — это верхняя граница, с началом её сравнивать нельзя
  const onlyUpper = found.every((x) => UP_TO.test(x.before.trim()));

  const hit = found.some(({ year }) => {
    if (onlyUpper) return Math.abs(year - to) <= 1;
    return Math.abs(year - from) <= 1 || Math.abs(year - to) <= 1;
  });
  if (hit) return null;

  const list = found.map((x) => x.year).join(', ');
  return {
    rule: 'year-name',
    level: 'error',
    text: `В названии ${list}, в карточке ${from}–${to}`,
    hint: 'Товар не найдётся по своим годам — проверьте, что верно',
  };
};

/** Диапазон годов задом наперёд */
const checkYearOrder = (p: AdminProduct): Issue | null => {
  const from = p.yearFrom ?? 0;
  const to = p.yearTo ?? 0;
  if (!from || !to || from <= to) return null;
  return {
    rule: 'year-order',
    level: 'error',
    text: `Год «с» больше года «по»: ${from}–${to}`,
    hint: 'Подбор по машине не найдёт такой товар ни в одном году',
  };
};

/** Год выпуска вне разумных границ */
const checkYearRange = (p: AdminProduct): Issue | null => {
  const bad = [p.yearFrom ?? 0, p.yearTo ?? 0].filter((y) => y > 0 && (y < YEAR_MIN || y > YEAR_MAX));
  if (!bad.length) return null;
  return {
    rule: 'year-strange',
    level: 'warning',
    text: `Странный год: ${bad.join(', ')}`,
    hint: `Ожидаем от ${YEAR_MIN} до ${YEAR_MAX}`,
  };
};

/**
 * Нет характеристик.
 *
 * Смотрим на собственные, а не на productSpecs: та подставляет запасные
 * строки (категория, годы, гарантия), поэтому пустой карточка никогда
 * не выглядит — и правило молчало бы всегда.
 */
const checkNoSpecs = (p: AdminProduct): Issue | null => {
  if ((p.specs ?? []).length) return null;
  return {
    rule: 'no-specs',
    level: 'warning',
    text: 'Нет характеристик',
    hint: 'Покупателю не с чем сравнивать — карточка выглядит пустой',
  };
};

/** Нет описания или оно совсем короткое */
const checkNoText = (p: AdminProduct): Issue | null => {
  const text = (p.description ?? []).join(' ').trim();
  if (text.length >= 40) return null;
  return {
    rule: 'no-text',
    level: 'warning',
    text: text ? 'Описание в одну строку' : 'Нет описания',
    hint: 'Поисковики хуже показывают товары без текста',
  };
};

/** Нет фотографий */
const checkNoPhoto = (p: AdminProduct): Issue | null => {
  const n = (p.images ?? []).filter(Boolean).length;
  if (n) return null;
  return {
    rule: 'no-photo',
    level: 'error',
    text: 'Нет ни одной фотографии',
    hint: 'Товар без фото почти не покупают',
  };
};

/** Диагональ экрана из строки: «9 дюймов», «12,3″» */
const sizeIn = (text: string): number | null => {
  const m = (text ?? '').match(/(\d+(?:[.,]\d+)?)\s*(?:"|″|дюйм)/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
};

/**
 * Диагональ в названии против характеристик.
 * «Рамка 9 дюймов» с типоразмером 10 — рабочая ошибка: покупатель
 * возьмёт не тот размер и вернёт товар.
 */
const checkSizeMismatch = (p: AdminProduct): Issue | null => {
  // Размер из характеристик — берём напрямую, без запасного разбора имени
  const spec = (p.specs ?? []).find(([k]) => {
    const key = k.trim().toLowerCase();
    return key.startsWith('диагональ') || key.startsWith('типоразмер');
  });
  if (!spec) return null;
  const inSpecs = sizeIn(spec[1]);
  const inName = sizeIn(p.name);
  if (inSpecs === null || inName === null) return null;
  if (Math.abs(inSpecs - inName) <= 0.5) return null;
  return {
    rule: 'size',
    level: 'error',
    text: `В названии ${String(inName).replace('.', ',')}″, в характеристиках ${String(
      inSpecs,
    ).replace('.', ',')}″`,
    hint: 'Из-за разнобоя товар попадёт не в ту подборку',
  };
};

/** Цена не заполнена */
const checkPrice = (p: AdminProduct): Issue | null => {
  if (p.price > 0) return null;
  return {
    rule: 'price',
    level: 'error',
    text: 'Цена не указана',
    hint: 'Товар нельзя купить',
  };
};

/** Старая цена ниже текущей — «скидка» вверх */
const checkOldPrice = (p: AdminProduct): Issue | null => {
  if (!p.oldPrice || p.oldPrice > p.price) return null;
  return {
    rule: 'old-price',
    level: 'warning',
    text: `Старая цена ${p.oldPrice} ₽ не выше текущей ${p.price} ₽`,
    hint: 'Скидка показывается только когда старая цена больше',
  };
};

/**
 * Товар под конкретные машины, но список пуст.
 * Такую позицию не найдёт ни один подбор по авто.
 */
const checkEmptyFits = (p: AdminProduct): Issue | null => {
  if (p.fitMode !== 'vehicle') return null;
  const brands = Object.keys(p.fits ?? {});
  if (brands.length) return null;
  return {
    rule: 'no-fits',
    level: 'error',
    text: 'Подбирается по машине, но список машин пуст',
    hint: 'Товар выпадает из подбора по авто',
  };
};

/** Марка есть, а моделей под ней нет */
const checkBrandWithoutModels = (p: AdminProduct): Issue | null => {
  const empty = Object.entries(p.fits ?? {})
    .filter(([, models]) => !Array.isArray(models) || models.length === 0)
    .map(([brand]) => brand);
  if (!empty.length) return null;
  return {
    rule: 'brand-no-models',
    level: 'warning',
    text: `Марка без моделей: ${empty.join(', ')}`,
    hint: 'Подбор сработает только если покупатель не уточнит модель',
  };
};

const RULES: ((p: AdminProduct) => Issue | null)[] = [
  checkPrice,
  checkNoPhoto,
  checkYearOrder,
  checkYearMismatch,
  checkSizeMismatch,
  checkEmptyFits,
  checkYearRange,
  checkNoSpecs,
  checkNoText,
  checkOldPrice,
  checkBrandWithoutModels,
];

/** Все правила по всем товарам. Сначала то, где ошибок больше. */
export const auditProducts = (
  products: AdminProduct[],
  onlyActive = true,
): AuditRow[] =>
  products
    .filter((p) => (onlyActive ? p.isActive : true))
    .map((product) => ({
      product,
      issues: RULES.map((rule) => rule(product)).filter(Boolean) as Issue[],
    }))
    .filter((r) => r.issues.length > 0)
    .sort((a, b) => {
      const err = (r: AuditRow) =>
        r.issues.filter((i) => i.level === 'error').length;
      return err(b) - err(a) || b.issues.length - a.issues.length;
    });

/** Понятные названия правил для фильтра */
export const RULE_TITLES: Record<string, string> = {
  price: 'Нет цены',
  'no-photo': 'Нет фото',
  'year-order': 'Годы наоборот',
  'year-name': 'Год в названии не совпадает',
  size: 'Размер не совпадает',
  'no-fits': 'Пустая совместимость',
  'year-strange': 'Странный год',
  'no-specs': 'Нет характеристик',
  'no-text': 'Нет описания',
  'old-price': 'Ошибка в скидке',
  'brand-no-models': 'Марка без моделей',
};