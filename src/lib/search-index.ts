/**
 * Поиск по описаниям и характеристикам товара.
 *
 * Сами описания в общий каталог не попадают — они весят два мегабайта, и
 * тащить их на каждую страницу ради поиска незачем. Вместо текста здесь
 * лежит обратный индекс «слово → номера товаров»: он в пять раз легче и
 * отвечает на единственный нужный вопрос — в каких товарах слово есть.
 *
 * Файл берётся один раз за визит, когда человек начал искать.
 */

interface Packed {
  /** Коды товаров в том же порядке, в каком на них ссылается индекс */
  ids: string[];
  /** Слово → номера товаров, записанные разницей в 16-ричном виде */
  w: Record<string, string>;
}

interface Win {
  __SEARCH_INDEX__?: Packed;
  __INDEX_AT__?: number;
}

/** Слово → множество кодов товаров, где оно встречается */
type Index = Map<string, Set<string>>;

let unpacked: Index | null = null;
/** Один общий запрос на вкладку: второй вызов ждёт первый, а не шлёт свой */
let pending: Promise<Index> | null = null;

const win = (): Win =>
  (typeof window === 'undefined' ? {} : window) as unknown as Win;

/** Разворачиваем упакованные номера обратно в коды товаров */
const unpack = (packed: Packed): Index => {
  const out: Index = new Map();
  for (const [word, list] of Object.entries(packed.w ?? {})) {
    const set = new Set<string>();
    let prev = 0;
    for (const part of list.split(',')) {
      prev += parseInt(part, 16);
      const id = packed.ids[prev];
      if (id) set.add(id);
    }
    out.set(word, set);
  }
  return out;
};

/** Уже разобранный индекс, если он есть */
export const indexReady = (): Index | null => {
  if (unpacked) return unpacked;
  const raw = win().__SEARCH_INDEX__;
  if (!raw) return null;
  unpacked = unpack(raw);
  return unpacked;
};

/**
 * Загружает индекс. Повторные вызовы бесплатны.
 *
 * Ошибку наружу не отдаём: не подъехал индекс — поиск отработает по
 * названию, категории и артикулу, это лучше пустой выдачи.
 */
export const loadIndex = (): Promise<Index> => {
  const have = indexReady();
  if (have) return Promise.resolve(have);
  if (pending) return pending;

  pending = new Promise<Index>((resolve) => {
    if (typeof document === 'undefined') return resolve(new Map());

    /* Номер сборки тот же, что у каталога — иначе возьмём индекс от старой */
    const at = win().__INDEX_AT__;
    if (!at) return resolve(new Map());

    const el = document.createElement('script');
    el.src = `/catalog-index-${at}.js`;
    el.async = true;
    el.onload = () => resolve(indexReady() ?? new Map());
    el.onerror = () => {
      pending = null;
      resolve(new Map());
    };
    document.head.appendChild(el);
  });

  return pending;
};

/**
 * Коды товаров, в описании которых встречается слово.
 *
 * Ищем и по началу слова: человек пишет «восьмиядер», а в описании
 * «восьмиядерным». Точное совпадение проверяем первым — оно дешевле.
 */
export const idsWithWord = (word: string): Set<string> | null => {
  const idx = indexReady();
  if (!idx) return null;
  /* Порог тот же, что при сборке индекса: короче трёх букв там ничего
     нет, и перебирать словарь ради этого незачем */
  const w = word.toLowerCase();
  if (w.length < 3) return null;

  const exact = idx.get(w);
  if (exact) return exact;

  /*
   * Слова в индексе лежат так, как написаны в описании: «ударопрочного»,
   * а не «ударопрочный». Поэтому сверяем по общему началу в обе стороны —
   * годится и когда запрос длиннее найденного слова, и когда короче.
   * Порог в пять букв держит от ложных срабатываний вроде «кам» → «камера».
   */
  const hits = new Set<string>();
  for (const [key, set] of idx) {
    const same =
      key.startsWith(w) || (w.length >= 5 && key.length >= 5 && w.startsWith(key));
    if (same) set.forEach((id) => hits.add(id));
  }
  return hits.size ? hits : null;
};