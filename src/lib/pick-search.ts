import { fitKey } from '@/lib/fits-match';

/** Кириллица → латиница: «тойо» должно находить Toyota */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

/**
 * Забыли переключить раскладку: хотели набрать «Тойота», а вышло «Njqjnf».
 * Возвращаем латинские клавиши на русские буквы, дальше их переведёт
 * транслитерация.
 */
const LAYOUT: Record<string, string> = {
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш',
  o: 'щ', p: 'з', '[': 'х', ']': 'ъ', a: 'ф', s: 'ы', d: 'в', f: 'а',
  g: 'п', h: 'р', j: 'о', k: 'л', l: 'д', ';': 'ж', "'": 'э', z: 'я',
  x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь', ',': 'б', '.': 'ю',
};

/**
 * Как марки называют по-русски. Транслитерация тут не спасает: «Фольксваген»
 * даёт «folksvagen», а в справочнике «Volkswagen». Ключ — то, что набирают,
 * значение — отпечаток настоящего названия.
 */
const ALIAS: [RegExp, string][] = [
  [/^(фольксваген|фольцваген|фольк|фолькс|вольксваген|вw)/, 'volkswagen'],
  [/^(мерседес|мерс|мерин)/, 'mercedes'],
  [/^(кия|киа)/, 'kia'],
  [/^(хендай|хёндай|хендэ|хундай|хюндай)/, 'hyundai'],
  [/^(шкода|škoda)/, 'skoda'],
  [/^(бмв|бэмвэ)/, 'bmw'],
  [/^(ленд ?ровер|лендровер|ленд)/, 'landrover'],
  [/^(рено|renault)/, 'renault'],
  [/^(пежо)/, 'peugeot'],
  [/^(ситроен|ситроэн)/, 'citroen'],
  [/^(ниссан)/, 'nissan'],
  [/^(тойота|тоёта)/, 'toyota'],
  [/^(мицубиси|мицубиши|митсубиси|мицу)/, 'mitsubishi'],
  [/^(шевроле|шеви)/, 'chevrolet'],
  [/^(судзуки|сузуки)/, 'suzuki'],
  [/^(субару|субарь)/, 'subaru'],
  [/^(мазда)/, 'mazda'],
  [/^(хонда)/, 'honda'],
  [/^(лексус)/, 'lexus'],
  [/^(форд)/, 'ford'],
  [/^(опель)/, 'opel'],
  [/^(ауди)/, 'audi'],
  [/^(вольво)/, 'volvo'],
  [/^(порше|порш)/, 'porsche'],
  [/^(джип)/, 'jeep'],
  [/^(инфинити)/, 'infiniti'],
  [/^(чери|черри)/, 'chery'],
  [/^(джили|джилли|гили)/, 'geely'],
  [/^(хавал|хавейл)/, 'haval'],
  [/^(ягуар)/, 'jaguar'],
  [/^(фиат)/, 'fiat'],
  [/^(лада|ваз|жигули)/, 'lada'],
  [/^(грейт ?вол|грейтвол)/, 'greatwall'],
];

/** Народное написание → отпечаток настоящего названия марки */
const alias = (s: string): string | null => {
  const v = s.toLowerCase().trim();
  for (const [re, to] of ALIAS) if (re.test(v)) return to;
  return null;
};

const map = (s: string, table: Record<string, string>): string =>
  s
    .toLowerCase()
    .split('')
    .map((c) => (c in table ? table[c] : c))
    .join('');

/**
 * Варианты написания запроса, по которым ищем марку или модель.
 *
 * Покупатель набирает как придётся: «Тойота», «тойо», «toyot», а иногда и
 * «Njqjnf» — с забытой раскладкой. Приводим запрос ко всем этим видам и
 * считаем совпадением любой из них.
 */
export const searchKeys = (query: string): string[] => {
  const raw = query.trim();
  if (!raw) return [];
  const swapped = map(raw, LAYOUT);
  const keys = [
    fitKey(raw),
    // «тойо» → «toyo»
    fitKey(map(raw, TRANSLIT)),
    // «Njqjnf» → «тойота» → «toyota»
    fitKey(map(swapped, TRANSLIT)),
    // «мерс» → «mercedes», в том числе с забытой раскладкой
    alias(raw) ?? '',
    alias(swapped) ?? '',
  ];
  return [...new Set(keys.filter(Boolean))];
};

/**
 * Насколько вариант подходит запросу: 0 — совпало с начала, 1 — внутри,
 * null — не подходит. Начало слова ценнее: «ri» это Rio, а не Sprinter.
 */
export const matchRank = (option: string, keys: string[]): number | null => {
  if (!keys.length) return 0;
  const k = fitKey(option);
  let best: number | null = null;
  keys.forEach((q) => {
    if (k.startsWith(q)) best = 0;
    else if (best === null && k.includes(q)) best = 1;
  });
  return best;
};