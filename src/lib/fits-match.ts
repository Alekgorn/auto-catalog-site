/**
 * Сверка марок и моделей авто.
 *
 * Товары приходят от разных поставщиков, и одна и та же машина пишется
 * по-разному: «FIAT» и «Fiat», «Doblò» и «Doblo», «RAV4» и «Rav4»,
 * «E-Класс» и «E-Class». Раньше сайт искал точное совпадение строк —
 * из-за этого товар не находился при подборе по авто, а в редакторе
 * отметки выглядели снятыми, хотя в товаре они были.
 *
 * Здесь одно общее правило: сравниваем по «отпечатку» названия.
 */

/** Латиница, похожая на кириллицу: «С» русская и «C» латинская — одна буква */
const LOOKALIKE: Record<string, string> = {
  а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o',
  р: 'p', с: 'c', т: 't', у: 'y', х: 'x',
};

/**
 * Слова-синонимы в названиях моделей. У Mercedes в справочнике «E-Класс»,
 * а в товарах «E-Class» — для машины это одно и то же.
 */
const SYNONYMS: [RegExp, string][] = [
  [/класс/g, 'class'],
  [/klass/g, 'class'],
  [/klasse/g, 'class'],
];

/**
 * «Отпечаток» названия: приводим к нижнему регистру, снимаем диакритику
 * (Doblò → doblo), убираем пробелы, дефисы и знаки. Остаётся только суть,
 * по которой и сравниваем.
 */
export const fitKey = (raw: string): string => {
  let s = (raw ?? '').toLowerCase().trim();

  // «ò» → «o», «é» → «e»: разложение на букву и знак с отбрасыванием знака
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // «Класс» → «class». Строго до подмены похожих букв: иначе слово
  // распадётся на латиницу и перестанет узнаваться
  SYNONYMS.forEach(([re, to]) => {
    s = s.replace(re, to);
  });

  // Русские буквы, неотличимые на вид от латинских
  s = s.replace(/[а-я]/g, (c) => LOOKALIKE[c] ?? c);

  // Пробелы, дефисы, скобки, точки — на сравнение не влияют
  return s.replace(/[^a-z0-9]/g, '');
};

/** Два названия обозначают одну и ту же марку или модель? */
export const sameFit = (a: string, b: string): boolean => {
  const ka = fitKey(a);
  const kb = fitKey(b);
  return !!ka && ka === kb;
};

/**
 * Ищем в товаре марку под любым написанием и отдаём её модели.
 * Возвращает null, если марки в товаре нет вовсе.
 */
export const findFitModels = (
  fits: Record<string, string[]> | undefined,
  brand: string,
): string[] | null => {
  if (!fits || !brand) return null;

  // Точное совпадение — самый частый случай, не тратим время на перебор
  if (Array.isArray(fits[brand])) return fits[brand];

  const key = fitKey(brand);
  if (!key) return null;

  for (const [name, models] of Object.entries(fits)) {
    if (fitKey(name) === key && Array.isArray(models)) return models;
  }
  return null;
};

/**
 * Под каким именно названием марка записана в товаре.
 * Нужно, чтобы при правке переложить модели под название справочника
 * и не оставить в товаре два ключа на одну марку.
 */
export const findFitKey = (
  fits: Record<string, string[]> | undefined,
  brand: string,
): string | null => {
  if (!fits || !brand) return null;
  if (Array.isArray(fits[brand])) return brand;

  const key = fitKey(brand);
  if (!key) return null;

  return Object.keys(fits).find((name) => fitKey(name) === key) ?? null;
};

/**
 * Название без пояснения в скобках: «3 (Axela)» → «3»,
 * «MX-5 (Miata/Roadster)» → «MX-5». Скобки — это второе имя той же
 * машины, а не отдельная модель.
 */
const withoutNote = (raw: string): string =>
  fitKey((raw ?? '').replace(/\([^)]*\)/g, ' '));

/**
 * Есть ли модель в списке.
 *
 * Совпадением считаем только одно и то же название — с поправкой на
 * регистр, дефисы и диакритику — либо пояснение в скобках.
 * Приписку через пробел НЕ считаем: «Move» и «Move Canbus» у Daihatsu,
 * как и «Tiggo» и «Tiggo 8», — разные машины, и путать их нельзя.
 */
export const hasFitModel = (models: string[], model: string): boolean => {
  const key = fitKey(model);
  if (!key) return false;

  const base = withoutNote(model);

  return models.some((m) => {
    const k = fitKey(m);
    if (!k) return false;
    if (k === key) return true;

    // «3» из товара и «3 (Axela)» из справочника — одна модель
    const mBase = withoutNote(m);
    return !!mBase && !!base && (mBase === key || base === k || mBase === base);
  });
};

/** Подходит ли товар под марку и (если указана) модель */
export const fitsBrandModel = (
  fits: Record<string, string[]> | undefined,
  brand: string,
  model?: string,
): boolean => {
  const models = findFitModels(fits, brand);
  if (!models) return false;
  if (!model) return true;
  return hasFitModel(models, model);
};