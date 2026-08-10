/**
 * Умный поиск по каталогу.
 *
 * Работает целиком в браузере: каталог уже загружен, поэтому запросов к
 * серверу не добавляется и выдача мгновенная.
 *
 * Что умеет:
 *  1. Разбирает запрос на сущности — марка авто, модель, тип товара, цена.
 *  2. Ищет по словам (точные совпадения в названии, артикуле, описании).
 *  3. Ищет по смыслу — «шумка», «хочу тише» и «шумоизоляция» дают один ответ.
 *  4. Прощает опечатки, окончания слов и забытую раскладку клавиатуры.
 */
import { Product, productSku } from '@/data/catalog';
import {
  BRAND_ALIASES,
  CONCEPTS,
  PRICE_HINTS,
  STOP_WORDS,
} from '@/data/search-terms';

/* ---------- подготовка текста ---------- */

/** Приводим к единому виду: нижний регистр, «ё» → «е», лишнее убираем. */
export const normalize = (value: string): string =>
  String(value)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const LAYOUT = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`';
const LAYOUT_RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';

/** «vfuybnjkf» — набрано в английской раскладке. Переводим в русскую. */
export const fixLayout = (value: string): string => {
  let out = '';
  for (const ch of value.toLowerCase()) {
    const i = LAYOUT.indexOf(ch);
    out += i >= 0 ? LAYOUT_RU[i] : ch;
  }
  return out;
};

/** Отрезаем русские окончания: «камеру», «камеры» → «камер». */
export const stem = (word: string): string => {
  if (word.length <= 4) return word;
  const endings = [
    'ами', 'ями', 'ого', 'ему', 'ому', 'ыми', 'ими', 'ей', 'ой', 'ая', 'ое',
    'ые', 'ый', 'ий', 'ам', 'ям', 'ах', 'ях', 'ов', 'ев', 'ью', 'ия', 'ии',
    'ах', 'ом', 'ем', 'у', 'ю', 'а', 'я', 'ы', 'и', 'е', 'о', 'ь',
  ];
  for (const end of endings) {
    if (word.length - end.length >= 4 && word.endsWith(end)) {
      return word.slice(0, -end.length);
    }
  }
  return word;
};

/** Расстояние Левенштейна с ранним выходом — для прощения опечаток. */
export const distance = (a: string, b: string, max = 2): number => {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const curr = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < best) best = curr[j];
    }
    if (best > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
};

/** Допустимое число опечаток: короткие слова — строже. */
const tolerance = (word: string): number => {
  if (word.length <= 5) return 0;
  if (word.length <= 8) return 1;
  return 2;
};

/** Слово похоже на одно из слов текста? */
const fuzzyHit = (word: string, haystackWords: string[]): boolean => {
  const max = tolerance(word);
  if (!max) return false;
  return haystackWords.some((h) => {
    if (Math.abs(h.length - word.length) > max) return false;
    return distance(h, word, max) <= max;
  });
};

/* ---------- разбор запроса ---------- */

export interface ParsedQuery {
  raw: string;
  /** Очищенные слова запроса */
  words: string[];
  /** Основы слов — для поиска с учётом окончаний */
  stems: string[];
  /** Найденные марки авто */
  brands: string[];
  /** Найденные модели */
  models: string[];
  /** Смысловые группы: магнитола, камера, шумоизоляция… */
  concepts: string[];
  /** Категории каталога, вытекающие из смысла */
  categories: string[];
  /** Пожелание по цене */
  priceOrder?: 'asc' | 'desc';
}

/** Разбирает «магнитола хонда подешевле» на сущности и намерение. */
export const parseQuery = (
  query: string,
  products: Product[] = [],
): ParsedQuery => {
  const cleanedRaw = normalize(query);

  // Кириллицы нет вовсе, но и осмысленной латиницы тоже — пробуем раскладку
  // Артикулы и коды (есть цифры или дефис) раскладкой не трогаем
  const codeLike = /\d|-/.test(cleanedRaw);
  const looksLatin =
    !codeLike && /^[a-z\s]+$/.test(cleanedRaw) && cleanedRaw.length > 2;
  const swapped = normalize(fixLayout(cleanedRaw));
  const knownLatin = /audi|bmw|kia|honda|ford|mazda|iso|can|usb|gps|sim|dsp|android|qled|toyota|lada|volvo|opel|nissan|lexus|skoda|hyundai|renault|suzuki|isuzu|chery|geely|haval|omoda|exeed|dodge|buick|saab|gmc/.test(
    cleanedRaw,
  );
  const cleaned = looksLatin && !knownLatin ? swapped : cleanedRaw;

  const allWords = cleaned.split(' ').filter(Boolean);
  const words = allWords.filter((w) => !STOP_WORDS.has(w));
  const stems = words.map(stem);

  /* марки: латиница как есть + русские названия */
  const brands: string[] = [];
  Object.entries(BRAND_ALIASES).forEach(([brand, aliases]) => {
    const brandWords = normalize(brand).split(' ').filter(Boolean);
    const hit =
      brandWords.some((bw) => words.some((w) => w === bw || (bw.length > 3 && distance(w, bw, 1) <= 1))) ||
      aliases.some((a) => {
        const an = normalize(a);
        return words.some(
          (w) => w === an || (an.length > 4 && distance(w, an, 1) <= 1),
        );
      }) ||
      cleaned.includes(normalize(brand));
    if (hit) brands.push(brand);
  });

  /* модели: сверяем со списком из самих товаров */
  const models: string[] = [];
  if (products.length) {
    const known = new Set<string>();
    products.forEach((p) =>
      Object.values(p.fits ?? {}).forEach((list) =>
        list.forEach((m) => known.add(m)),
      ),
    );
    known.forEach((m) => {
      const mn = normalize(m);
      if (mn.length < 3) return;
      // Только по границе слова — иначе «hd» из артикула станет моделью
      const re = new RegExp(`(^|\\s)${mn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`);
      if (re.test(cleaned)) models.push(m);
    });
  }

  /* смысловые группы */
  const concepts: string[] = [];
  const categories: string[] = [];
  CONCEPTS.forEach((c) => {
    const hit = c.words.some((w) => {
      const wn = normalize(w);
      if (wn.includes(' ')) return cleaned.includes(wn);
      const ws = stem(wn);
      return (
        words.includes(wn) ||
        stems.includes(ws) ||
        stems.some((s) => s.length > 3 && (s.startsWith(ws) || ws.startsWith(s))) ||
        fuzzyHit(wn, words)
      );
    });
    if (hit) {
      concepts.push(c.id);
      (c.categories ?? []).forEach((cat) => {
        if (!categories.includes(cat)) categories.push(cat);
      });
    }
  });

  /* намёк на цену */
  let priceOrder: 'asc' | 'desc' | undefined;
  for (const hint of PRICE_HINTS) {
    if (
      hint.words.some((w) => {
        const wn = normalize(w);
        return cleaned.includes(wn) || fuzzyHit(wn, words);
      })
    ) {
      priceOrder = hint.order;
      break;
    }
  }

  return { raw: query, words, stems, brands, models, concepts, categories, priceOrder };
};

/* ---------- индекс товара ---------- */

interface Indexed {
  product: Product;
  name: string;
  nameWords: string[];
  sku: string;
  category: string;
  text: string;
  textWords: string[];
  brands: string[];
}

const indexCache = new WeakMap<Product[], Indexed[]>();

const buildIndex = (products: Product[]): Indexed[] => {
  const cached = indexCache.get(products);
  if (cached) return cached;

  const built = products.map((p) => {
    const fits = Object.entries(p.fits ?? {})
      .map(([b, m]) => `${b} ${m.join(' ')}`)
      .join(' ');
    const specs = (p.specs ?? []).map(([k, v]) => `${k} ${v}`).join(' ');
    const text = normalize(
      [
        p.name,
        p.category,
        productSku(p),
        fits,
        (p.description ?? []).join(' '),
        specs,
        (p.kit ?? []).join(' '),
        p.install,
      ].join(' '),
    );
    const name = normalize(p.name);
    return {
      product: p,
      name,
      nameWords: name.split(' ').filter(Boolean),
      sku: normalize(productSku(p)),
      category: normalize(p.category),
      text,
      textWords: Array.from(new Set(text.split(' ').filter(Boolean))),
      brands: Object.keys(p.fits ?? {}),
    };
  });

  indexCache.set(products, built);
  return built;
};

/* ---------- поиск ---------- */

export interface SearchHit {
  product: Product;
  score: number;
  /** Почему товар найден — для подписи в выдаче */
  reason: string;
}

const CONCEPT_BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));

/**
 * Оценивает товар по запросу.
 * Складываем два взгляда: точные слова (классический поиск)
 * и смысл запроса (семантический).
 */
const scoreProduct = (item: Indexed, q: ParsedQuery): SearchHit | null => {
  let score = 0;
  const reasons: string[] = [];

  /* --- 1. Артикул: точное совпадение важнее всего --- */
  if (q.words.length && item.sku && q.words.includes(item.sku)) {
    return { product: item.product, score: 10000, reason: 'Совпал артикул' };
  }

  /* --- 2. Классический поиск по словам --- */
  let wordHits = 0;
  q.stems.forEach((s, i) => {
    const word = q.words[i];
    if (!word || word.length < 2) return;

    if (item.name.includes(word)) {
      score += 60;
      wordHits += 1;
      return;
    }
    if (item.nameWords.some((w) => w.startsWith(s) || s.startsWith(w))) {
      score += 45;
      wordHits += 1;
      return;
    }
    if (item.text.includes(word)) {
      score += 22;
      wordHits += 1;
      return;
    }
    if (item.textWords.some((w) => w.startsWith(s))) {
      score += 16;
      wordHits += 1;
      return;
    }
    // опечатка
    if (fuzzyHit(word, item.textWords)) {
      score += 12;
      wordHits += 1;
    }
  });

  if (wordHits && wordHits === q.words.length && q.words.length > 1) score += 40;
  if (q.raw.trim().length > 2 && item.name.includes(normalize(q.raw))) score += 120;

  /* --- 3. Марка авто --- */
  if (q.brands.length) {
    const match = q.brands.filter((b) => item.brands.includes(b));
    if (match.length) {
      score += 90;
      reasons.push(`Подходит для ${match.join(', ')}`);
    } else if (q.concepts.length || wordHits) {
      // запрос про конкретную марку, а товар не для неё
      score -= 45;
    } else {
      return null;
    }
  }

  /* --- 4. Модель --- */
  if (q.models.length) {
    const models = Object.values(item.product.fits ?? {}).flat();
    if (q.models.some((m) => models.includes(m))) {
      score += 70;
      reasons.push('Подходит по модели');
    }
  }

  /* --- 5. Семантика: смысл запроса --- */
  if (q.concepts.length) {
    let semantic = 0;
    q.concepts.forEach((id) => {
      const c = CONCEPT_BY_ID.get(id);
      if (!c) return;
      if ((c.categories ?? []).includes(item.product.category)) {
        // Совпал сам раздел — это сильнее, чем похожее слово в названии
        // сопутствующего товара («переходник для Андроид магнитолы»)
        semantic += 220;
        reasons.push(item.product.category);
      }
      (c.keywords ?? []).forEach((k) => {
        const kn = normalize(k);
        if (item.name.includes(kn)) semantic += 30;
        else if (item.text.includes(kn)) semantic += 10;
      });
    });
    score += semantic;
    if (!semantic && !wordHits) return null;
  }

  if (score <= 0) return null;

  /* --- 6. Популярность как мягкий довесок --- */
  score += (item.product.popularity ?? 0) / 200;
  if (item.product.badge === 'Хит') score += 5;

  return {
    product: item.product,
    score,
    reason: Array.from(new Set(reasons)).slice(0, 2).join(' · '),
  };
};

/** Основная функция: возвращает найденные товары по убыванию соответствия. */
export const smartSearch = (
  products: Product[],
  query: string,
  limit?: number,
): SearchHit[] => {
  const q = parseQuery(query, products);
  if (!q.words.length && !q.brands.length && !q.concepts.length) return [];

  const index = buildIndex(products);
  const hits: SearchHit[] = [];

  index.forEach((item) => {
    const hit = scoreProduct(item, q);
    if (hit) hits.push(hit);
  });

  hits.sort((a, b) => b.score - a.score);

  // Точное попадание в артикул — показываем только его
  const exact = hits.filter((h) => h.score >= 10000);
  if (exact.length) return exact;

  // Пожелание по цене переставляет только товары, близкие по смыслу к запросу.
  // Иначе дешёвый кабель обгонит магнитолу, которую и просили.
  if (q.priceOrder && hits.length > 1) {
    const best = hits[0].score;
    const limit = best * 0.6;
    const top = hits.filter((h) => h.score >= limit);
    if (top.length > 1) {
      top.sort((a, b) =>
        q.priceOrder === 'asc'
          ? a.product.price - b.product.price
          : b.product.price - a.product.price,
      );
      hits.splice(0, top.length, ...top);
    }
  }

  return limit ? hits.slice(0, limit) : hits;
};

/** Короткая подсказка «что мы поняли из запроса». */
export const describeQuery = (q: ParsedQuery): string => {
  const parts: string[] = [];
  if (q.brands.length) parts.push(q.brands.join(', '));
  if (q.models.length) parts.push(q.models.slice(0, 2).join(', '));
  q.concepts.forEach((id) => {
    const c = CONCEPT_BY_ID.get(id);
    if (c?.categories?.length) parts.push(c.categories[0]);
  });
  if (q.priceOrder === 'asc') parts.push('сначала дешёвые');
  if (q.priceOrder === 'desc') parts.push('сначала дорогие');
  return Array.from(new Set(parts)).join(' · ');
};