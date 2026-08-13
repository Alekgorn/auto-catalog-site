const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

/** Предлоги, союзы и «вода» — в адресе они не нужны и мешают поиску */
const STOP = new Set(
  `dlya na s so i v vo k ko po ot do iz u o ob pri za pod nad a no ili zhe li by
   eto kak chto vse ves vsya vseh tip tipa vid vida goda godov god let
   shtuk sht komplekte takzhe ochen bolee samyy svoy nash vash lyuboy raznyh
   prochee drugoe novyy universalnyy`.split(/\s+/),
);

/** Перед числом предлог оставляем: «с 2016» и «до 2016» — разные товары */
const KEEP_BEFORE_NUM = new Set(['s', 'do', 'ot', 'po', 'pod', 'nad', 'iz']);

/** Предельная длина адреса — держим ЧПУ коротким и читаемым */
export const SLUG_LIMIT = 60;

/**
 * Название → короткий SEO-адрес на латинице.
 * Оставляет только значимые слова: «Переходник для Android магнитолы Hyundai, KIA 2017+»
 * → perehodnik-android-magnitoly-hyundai-kia-2017
 */
export const slugify = (value: string, limit: number = SLUG_LIMIT): string => {
  const translit = String(value ?? '')
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join('');

  const words = translit.split(/[^a-z0-9]+/).filter(Boolean);

  const kept: string[] = [];
  const seen = new Set<string>();
  words.forEach((w, i) => {
    const next = words[i + 1] ?? '';
    const isNumericPrefix = KEEP_BEFORE_NUM.has(w) && /^\d+$/.test(next);
    if (STOP.has(w) && !isNumericPrefix && kept.length) return;
    if (seen.has(w) && !/^\d+$/.test(w)) return;
    seen.add(w);
    kept.push(w);
  });

  const source = kept.length ? kept : words.slice(0, 1);
  if (!source.length) return 'tovar';

  let slug = '';
  for (const w of source) {
    const candidate = slug ? `${slug}-${w}` : w;
    if (candidate.length > limit) break;
    slug = candidate;
  }
  return slug || source[0].slice(0, limit);
};

/** Ищет в списке элемент, чей адрес совпал с переданным */
export const findBySlug = <T>(
  items: T[],
  slug: string,
  name: (item: T) => string,
): T | undefined => items.find((item) => slugify(name(item)) === slug);

/** Латиница идёт первой, затем кириллица — как в полосе букв. */
export const compareNames = (a: string, b: string): number => {
  const rank = (v: string) => {
    const c = v.trim().charAt(0).toUpperCase();
    if (/[A-Z]/.test(c)) return 0;
    if (/[А-ЯЁ]/.test(c)) return 1;
    return 2;
  };
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b, 'ru');
};
