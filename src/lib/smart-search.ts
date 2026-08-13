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
import { Product, productSku, isUniversal } from '@/data/catalog';
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


/**
 * «рав4» → «rav4», «камри» → «kamri». Нужно, чтобы модель, написанную
 * по-русски, можно было сверить с латинским названием из каталога.
 */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
  т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export const translit = (value: string): string =>
  value.replace(/[а-я]/g, (ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch));

/**
 * Сводим похожие по звучанию буквы: «camry» и «kamri» станут одинаковыми.
 * Без этого «камри» не находит Camry, а «солярис» — Solaris.
 */
const fold = (value: string): string =>
  value
    .replace(/[^a-z0-9]/g, '')
    .replace(/ya/g, 'a')
    .replace(/yu/g, 'u')
    .replace(/dzh/g, 'j')
    .replace(/[cq]/g, 'k')
    .replace(/y/g, 'i');

/**
 * Народные написания моделей, которые не выводятся транслитерацией:
 * «дастер» вместо duster, «спортейдж» вместо sportage.
 */
const MODEL_ALIASES: Record<string, string> = {
  дастер: 'duster',
  спортейдж: 'sportage',
  спортаж: 'sportage',
  каптур: 'kaptur',
  сандеро: 'sandero',
  ларгус: 'largus',
  приора: 'priora',
  калина: 'kalina',
  нива: 'niva',
  туарег: 'touareg',
  тукан: 'tiguan',
  джетта: 'jetta',
  октавия: 'octavia',
  суперб: 'superb',
  фабия: 'fabia',
  рапид: 'rapid',
  кодиак: 'kodiaq',
  карок: 'karoq',
  камик: 'kamiq',
  соренто: 'sorento',
  селтос: 'seltos',
  серато: 'cerato',
  церато: 'cerato',
  оптима: 'optima',
  соул: 'soul',
  пиканто: 'picanto',
  туксон: 'tucson',
  туссан: 'tucson',
  элантра: 'elantra',
  соната: 'sonata',
  акцент: 'accent',
  паджеро: 'pajero',
  аутлендер: 'outlander',
  лансер: 'lancer',
  кашкай: 'qashqai',
  альмера: 'almera',
  теана: 'teana',
  мурано: 'murano',
  джук: 'juke',
  ноут: 'note',
  тиида: 'tiida',
  прадо: 'prado',
  хайлендер: 'highlander',
  ленд: 'land',
  крузер: 'cruiser',
  королла: 'corolla',
  авенсис: 'avensis',
  приус: 'prius',
  ярис: 'yaris',
  хайлюкс: 'hilux',
  фиеста: 'fiesta',
  мондео: 'mondeo',
  куга: 'kuga',
  транзит: 'transit',
  эксплорер: 'explorer',
  меган: 'megane',
  флюенс: 'fluence',
  колеос: 'koleos',
  аркана: 'arkana',
  сценик: 'scenic',
  кангу: 'kangoo',
  астра: 'astra',
  инсигния: 'insignia',
  корса: 'corsa',
  зафира: 'zafira',
  мокка: 'mokka',
  пежо: 'peugeot',
  партнер: 'partner',
  боксер: 'boxer',
  берлинго: 'berlingo',
  джампи: 'jumpy',
  аутбек: 'outback',
  форестер: 'forester',
  импреза: 'impreza',
  витара: 'vitara',
  свифт: 'swift',
  гранд: 'grand',
  чероки: 'cherokee',
  рэнглер: 'wrangler',
  компас: 'compass',
};

/** Слово похоже на название модели? Сверяем и как есть, и в транслите. */
const sameModel = (word: string, model: string): boolean => {
  if (word === model) return true;
  const wt = MODEL_ALIASES[word] ?? translit(word);
  if (wt === model) return true;
  // Точное совпадение после сведения похожих букв и гласных:
  // «камри» = Camry, «дастер» = Duster, «рав4» = RAV4.
  // Опечатки не прощаем — иначе «фокус» поймает Catera
  return fold(wt) === fold(model);
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
  /**
   * Группы, попавшие сюда только по узкому слову («gps», «usb»).
   * Раздел целиком по ним не показываем — ищем конкретный товар.
   */
  narrowConcepts: string[];
  /** Категории каталога, вытекающие из смысла */
  categories: string[];
  /** Пожелание по цене */
  priceOrder?: 'asc' | 'desc';
  /** Год из запроса: «камри 2015». Без него год выбирает покупатель */
  year?: number;
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
      // Чисто числовое «название» — это год из запроса, а не модель
      if (/^\d{4}$/.test(mn)) return;
      // Только по границе слова — иначе «hd» из артикула станет моделью
      const re = new RegExp(`(^|\\s)${mn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s)`);
      if (re.test(cleaned)) {
        models.push(m);
        return;
      }
      // Модель могли написать по-русски: «рав4», «камри», «солярис»
      if (words.some((w) => sameModel(w, mn))) models.push(m);
    });
  }

  /*
   * Модель назвали без марки («камри 2012 проводка») — восстанавливаем марку
   * по каталогу, иначе подбор по машине не сработает
   */
  if (models.length && !brands.length && products.length) {
    const byModel = new Map<string, string>();
    products.forEach((p) =>
      Object.entries(p.fits ?? {}).forEach(([b, list]) =>
        list.forEach((m) => {
          if (!byModel.has(m)) byModel.set(m, b);
        }),
      ),
    );
    models.forEach((m) => {
      const b = byModel.get(m);
      if (b && !brands.includes(b)) brands.push(b);
    });
  }

  /* смысловые группы */
  const concepts: string[] = [];
  const narrowConcepts: string[] = [];
  const categories: string[] = [];

  const matches = (list: string[]) =>
    list.some((w) => {
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

  CONCEPTS.forEach((c) => {
    if (matches(c.words)) {
      // Широкое слово — показываем раздел целиком
      concepts.push(c.id);
      (c.categories ?? []).forEach((cat) => {
        if (!categories.includes(cat)) categories.push(cat);
      });
    } else if (c.narrow && matches(c.narrow)) {
      // Узкое слово — только подсказка, раздел целиком не открываем
      narrowConcepts.push(c.id);
    }
  });

  /* год выпуска: «рио 2019», «камри 2015 года» */
  let year: number | undefined;
  const now = new Date().getFullYear();
  for (const w of allWords) {
    const n = Number(w);
    // Разумные рамки: раньше 1980 машин в каталоге нет, будущее тоже отсекаем
    if (Number.isInteger(n) && n >= 1980 && n <= now + 1) {
      year = n;
      break;
    }
  }

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

  return {
    raw: query,
    words,
    stems,
    brands,
    models,
    concepts,
    narrowConcepts,
    categories,
    priceOrder,
    year,
  };
};

/* ---------- индекс товара ---------- */

interface Indexed {
  product: Product;
  /** Подходит почти любой машине: марок не указано или указаны почти все */
  universal: boolean;
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

  const allBrands = new Set<string>();
  products.forEach((p) =>
    Object.keys(p.fits ?? {}).forEach((b) => allBrands.add(b)),
  );

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
      universal: isUniversal(p, allBrands.size),
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
  let nameHits = 0;
  q.stems.forEach((s, i) => {
    const word = q.words[i];
    if (!word || word.length < 2) return;

    // Слово стоит в названии товара — самый весомый сигнал
    if (item.nameWords.includes(word)) {
      score += 200;
      wordHits += 1;
      nameHits += 1;
      return;
    }
    if (item.name.includes(word)) {
      score += 150;
      wordHits += 1;
      nameHits += 1;
      return;
    }
    // Совпадение по началу слова — только для достаточно длинных основ,
    // иначе «360» цепляется за «3» из «разъём 3,5 мм»
    if (
      s.length >= 4 &&
      item.nameWords.some(
        (w) => w.length >= 4 && (w.startsWith(s) || s.startsWith(w)),
      )
    ) {
      score += 110;
      wordHits += 1;
      nameHits += 1;
      return;
    }
    // Дальше — только описание и характеристики: сигнал заметно слабее
    if (item.text.includes(word)) {
      score += 20;
      wordHits += 1;
      return;
    }
    if (item.textWords.some((w) => w.startsWith(s))) {
      score += 14;
      wordHits += 1;
      return;
    }
    if (fuzzyHit(word, item.textWords)) {
      score += 10;
      wordHits += 1;
    }
  });

  // Нашлись все слова запроса — заметный бонус
  if (wordHits && wordHits === q.words.length && q.words.length > 1) score += 60;
  if (nameHits === q.words.length && q.words.length > 1) score += 120;
  if (q.raw.trim().length > 2 && item.name.includes(normalize(q.raw))) score += 200;

  /* --- 3. Марка авто --- */
  if (q.brands.length) {
    const match = q.brands.filter((b) => item.brands.includes(b));
    const inName = q.brands.some((b) => item.name.includes(normalize(b)));

    if (inName) {
      // Марка прямо в названии — это именно то, что искали
      score += 320;
      reasons.push(`Подходит для ${q.brands.join(', ')}`);
    } else if (match.length) {
      score += 90;
      reasons.push(`Подходит для ${match.join(', ')}`);
    } else if (item.universal) {
      // Универсальная позиция подходит любой машине — оставляем, но ниже профильных
      score -= 60;
    } else {
      // Товар сделан под другие марки: в запросе назвали конкретную машину,
      // значит это не то, что просили
      return null;
    }
  }

  /* --- 4. Модель --- */
  if (q.models.length) {
    const models = Object.values(item.product.fits ?? {}).flat();
    if (q.models.some((m) => models.includes(m))) {
      score += 200;
      reasons.push('Подходит по модели');
    } else if (item.universal) {
      // Универсальный товар подойдёт и этой машине, но показываем его ниже
      score -= 60;
    } else if (!q.brands.length) {
      // Назвали конкретную модель, а товар сделан под другие — это не он.
      // Когда марка тоже названа, отбор уже сделан выше по марке
      return null;
    }
  }

  /* --- 5. Семантика: смысл запроса --- */
  if (q.concepts.length) {
    let semantic = 0;
    let inTargetCategory = false;
    q.concepts.forEach((id) => {
      const c = CONCEPT_BY_ID.get(id);
      if (!c) return;
      if ((c.categories ?? []).includes(item.product.category)) {
        // Совпал сам раздел: «магнитола» показывает магнитолы, а не переходники
        semantic += 900;
        inTargetCategory = true;
        reasons.push(item.product.category);
      }
      (c.keywords ?? []).forEach((k) => {
        const kn = normalize(k);
        if (item.name.includes(kn)) semantic += 40;
        else if (item.text.includes(kn)) semantic += 8;
      });
    });
    score += semantic;
    // Раздел из запроса известен, но товар из другого — это сопутствующее,
    // а не то, что просили: не даём ему обгонять профильные товары
    const hasTargetCats = q.categories.length > 0;
    if (hasTargetCats && !inTargetCategory && !nameHits) score = Math.min(score, 120);
    if (!semantic && !wordHits) return null;
  }

  /* --- 5б. Узкое слово: «gps», «usb» — только точные товары --- */
  if (q.narrowConcepts.length && !q.concepts.length) {
    // Раздел целиком не открываем: без слова в названии товар не подходит
    if (!nameHits) return null;
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

  /*
   * Отсекаем «хвост»: товары, которые заметно слабее лучшего результата.
   * Иначе к трём нужным позициям прицепляются десятки случайных, где слово
   * мелькнуло лишь в описании.
   */
  // Смысл запроса понят, но товар зацепился лишь словом из описания —
  // такие «почти совпадения» только мешают, показываем честное «не найдено»
  let result = hits;
  if (q.concepts.length && q.categories.length) {
    const meaningful = hits.filter((h) => h.score >= 130);
    if (meaningful.length) result = meaningful;
    else return [];
  }
  // Ни один товар не совпал названием — значит слова нашлись лишь в описаниях.
  // Такая выдача выглядит случайной, честнее показать «ничего не найдено»
  if (result.length > 3 && result[0].score < 100) return [];

  if (result.length > 3) {
    const best = result[0].score;
    const floor = Math.max(best * 0.18, 40);
    const strong = result.filter((h) => h.score >= floor);
    if (strong.length >= 3) result = strong;
  }

  // Пожелание по цене переставляет только товары, близкие по смыслу к запросу.
  // Иначе дешёвый кабель обгонит магнитолу, которую и просили.
  if (q.priceOrder && result.length > 1) {
    const best = result[0].score;
    const edge = best * 0.6;
    // Если из запроса ясен раздел — цену сортируем только внутри него,
    // иначе дешёвый переходник обгонит магнитолу, которую и просили
    const top = result.filter(
      (h) =>
        h.score >= edge &&
        (!q.categories.length || q.categories.includes(h.product.category)),
    );
    if (top.length > 1) {
      top.sort((a, b) =>
        q.priceOrder === 'asc'
          ? a.product.price - b.product.price
          : b.product.price - a.product.price,
      );
      result = [...top, ...result.slice(top.length)];
    }
  }

  return limit ? result.slice(0, limit) : result;
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