/**
 * Генерирует готовый HTML для каждой страницы сайта.
 *
 * Зачем: сайт — одностраничное приложение, боты видят пустую страницу и ждут
 * выполнения скриптов. Здесь мы заранее собираем текст каждой страницы и кладём
 * файлы в public/ — оттуда они попадают в сборку и отдаются как обычная статика.
 *
 * Запуск: node scripts/prerender.mjs
 * Перед запуском нужны две сборки:
 *   npx vite build                                   (обычная, даёт шаблон)
 *   npx vite build --config vite.prerender.config.ts (серверная, даёт рендер)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const SITE_URL = 'https://xn--80a0adnb7a.xn--p1ai';

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf-8'));

/** Счётчики для итогового отчёта: что создали, что переписали, что не трогали. */
const stats = { created: 0, changed: 0, skipped: 0, removed: 0 };

/**
 * Записывает файл, только если содержимое правда отличается.
 *
 * Зачем сравнивать, а не просто писать: fs.writeFile обновляет время
 * правки файла даже когда байты те же. Система контроля версий смотрит
 * не только на время, но пересборка всё равно получалась «все файлы
 * изменены» из-за того, что генератор переписывал их поголовно. Для
 * каталога на полторы тысячи товаров это полсотни мегабайт мусора в
 * истории за один прогон, и чем больше каталог, тем хуже.
 *
 * Запись атомарная: сначала во временный файл рядом, потом переносим
 * поверх цели. Перенос в пределах одной папки файловая система делает
 * одним действием — оборвись процесс на середине, на диске останется
 * либо старая версия целиком, либо новая, но не половина новой.
 * Недописанный временный файл в этом случае просто удаляем.
 */
const writeIfChanged = async (target, content) => {
  let existing = null;
  try {
    existing = await fs.readFile(target);
  } catch {
    /* файла нет — значит страница новая */
  }

  const next = Buffer.from(content, 'utf-8');
  if (existing && existing.equals(next)) {
    stats.skipped += 1;
    return 'skipped';
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp-${process.pid}`;
  try {
    await fs.writeFile(tmp, next);
    await fs.rename(tmp, target);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }

  if (existing) {
    stats.changed += 1;
    return 'changed';
  }
  stats.created += 1;
  return 'created';
};

const SLUG_MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

const SLUG_STOP = new Set(
  `dlya na s so i v vo k ko po ot do iz u o ob pri za pod nad a no ili zhe li by
   eto kak chto vse ves vsya vseh tip tipa vid vida goda godov god let
   shtuk sht komplekte takzhe ochen bolee samyy svoy nash vash lyuboy raznyh
   prochee drugoe novyy universalnyy`.split(/\s+/),
);

const SLUG_KEEP_BEFORE_NUM = new Set(['s', 'do', 'ot', 'po', 'pod', 'nad', 'iz']);

/** Тот же адрес, что и на фронте — см. src/lib/slug.ts */
const slugify = (value, limit = 60) => {
  const translit = String(value ?? '')
    .toLowerCase()
    .split('')
    .map((ch) => (ch in SLUG_MAP ? SLUG_MAP[ch] : ch))
    .join('');
  const words = translit.split(/[^a-z0-9]+/).filter(Boolean);

  const kept = [];
  const seen = new Set();
  words.forEach((w, i) => {
    const next = words[i + 1] ?? '';
    const numericPrefix = SLUG_KEEP_BEFORE_NUM.has(w) && /^\d+$/.test(next);
    if (SLUG_STOP.has(w) && !numericPrefix && kept.length) return;
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

const escapeAttr = (s) =>
  String(s)
    /* Переводы строк в значении атрибута рвут мета-тег: описание,
       набранное в админке в несколько абзацев, обрывалось на первом
       переносе, и поисковик видел страницу без описания вовсе.
       Схлопываем любые пробелы и переносы в один пробел. */
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Безопасно кладём JSON внутрь script, чтобы не порвать разметку. */
const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/**
 * Готовит каталог к отправке в браузер: выкидывает пустые поля и
 * заменяет общий адрес картинок на короткую метку.
 *
 * Файл каталога скачивает каждый посетитель, а хостинг отдаёт его без
 * сжатия — поэтому лишние килобайты здесь напрямую бьют по скорости
 * открытия сайта. Пустые поля кода всё равно не меняют: отсутствующее
 * значение читается так же, как пустая строка.
 */
const IMG_PREFIX = 'https://cdn.poehali.dev/projects/';

/**
 * Поля, которые можно не записывать, если они пустые: при чтении каталога
 * они восстанавливаются обратно (см. expandImages в CatalogContext).
 *
 * Список закрытый и это важно: убрать «любое пустое поле» нельзя — код
 * местами читает их напрямую (p.fits[brand], p.years[0]), и пропажа
 * оборачивается белым экраном.
 */
const OPTIONAL_TEXT = [
  'subcategory',
  'badge',
  'ozonUrl',
  'wbUrl',
  'stockNote',
  'videoUrl',
];
const OPTIONAL_NUM = ['oldPrice', 'proPrice'];
const OPTIONAL_LIST = ['notes', 'guides', 'kit'];

/**
 * Сколько характеристик оставить в общем файле каталога.
 *
 * Столько влезает в карточку товара, и первой почти всегда стоит
 * диагональ — по ней работает подбор комплекта. Остальные читают только
 * на странице товара, в сравнении и быстром просмотре: они уезжают в
 * отдельный файл (см. textRest).
 */
const CARD_SPECS = 3;

const slimCatalog = (data) => {
  /*
   * Какие характеристики показывает карточка в списке — это настройка
   * категории из админки. Именно их и оставляем в общем файле: обрезка
   * «первые три подряд» роняла нужное поле, если в таблице перед ним
   * стояло что-то подробное (у магнитол так пропадала «Память»).
   */
  const wanted = new Map(
    Object.entries(data.categorySpecs ?? {}).map(([cat, fields]) => [
      cat,
      new Set((fields ?? []).map((f) => String(f).trim().toLowerCase())),
    ]),
  );

  const products = (data.products ?? []).map((p) => {
    const out = { ...p };

    for (const k of OPTIONAL_TEXT) if (!out[k]) delete out[k];
    for (const k of OPTIONAL_NUM) if (!out[k]) delete out[k];
    for (const k of OPTIONAL_LIST) {
      if (Array.isArray(out[k]) && out[k].length === 0) delete out[k];
    }

    /*
     * Описания и характеристики в общий файл не кладём.
     *
     * Вместе они весят 1,1 МБ из 2,1 — больше половины файла, который
     * скачивает каждый посетитель и робот на КАЖДОЙ странице. А читают
     * их в одном месте: карточка товара. Уезжают в textRest и подъезжают,
     * когда человек открыл товар.
     *
     * Поиск по описаниям при этом не ломается: он работает на сервере,
     * а в браузере ищет по названию, категории, артикулу и совместимости.
     */
    delete out.description;
    delete out.install;
    /*
     * Характеристики нужны и в списках: по ним карточка показывает
     * диагональ, а подбор комплекта — фильтрует. Оставляем те, что
     * настроены для этой категории, плюс диагональ — она решает в
     * подборе комплекта. Остальные уезжают вместе с описанием.
     */
    if (Array.isArray(out.specs) && out.specs.length > CARD_SPECS) {
      const need = wanted.get(out.category);
      const keep = out.specs.filter(([k]) => {
        const key = String(k).trim().toLowerCase();
        if (key.startsWith('диагональ') || key.startsWith('типоразмер')) {
          return true;
        }
        return need?.has(key);
      });
      // У категории ничего не настроено — берём первые, чтобы карточка
      // не осталась совсем пустой
      out.specs = keep.length ? keep.slice(0, CARD_SPECS) : out.specs.slice(0, CARD_SPECS);
    }

    if (Array.isArray(out.images)) {
      /*
       * В общий файл кладём только обложку.
       *
       * В списках, корзине и сравнении видно ровно первое фото, а
       * остальные семь из восьми нужны только в галерее товара. Все
       * ссылки разом весили 963 КБ — их скачивал каждый посетитель
       * главной. Остальные уезжают в отдельный файл (см. photoRest)
       * и подгружаются, когда человек открывает карточку.
       */
      out.images = out.images
        .slice(0, 1)
        .map((u) =>
          typeof u === 'string' && u.startsWith(IMG_PREFIX)
            ? '~' + u.slice(IMG_PREFIX.length)
            : u,
        );
    }
    return out;
  });
  return { ...data, products };
};

/**
 * Словарь «товар → остальные его фото», кроме обложки.
 *
 * Лежит отдельным файлом и грузится по требованию: на страницу товара,
 * в быстрый просмотр и в сравнение. Товары без второго снимка сюда не
 * попадают — таких почти сорок.
 */
const photoRest = (data) => {
  const out = {};
  for (const p of data.products ?? []) {
    const rest = (p.images ?? []).slice(1);
    if (!rest.length) continue;
    out[p.id] = rest.map((u) =>
      typeof u === 'string' && u.startsWith(IMG_PREFIX)
        ? '~' + u.slice(IMG_PREFIX.length)
        : u,
    );
  }
  return out;
};

/**
 * Словарь «товар → его описание и полные характеристики».
 *
 * Лежит отдельным файлом рядом с фотографиями и грузится по требованию:
 * на страницу товара, в быстрый просмотр и в сравнение. Это самая
 * тяжёлая часть каталога — 1,1 МБ из 2,1, — и в списках она не нужна
 * ни разу.
 */
const textRest = (data) => {
  const out = {};
  for (const p of data.products ?? []) {
    const entry = {};
    if (p.description?.length) entry.description = p.description;
    if (p.install) entry.install = p.install;
    // В общий файл ушли первые три — здесь лежат все, чтобы страница
    // товара показала полную таблицу
    if ((p.specs ?? []).length > CARD_SPECS) entry.specs = p.specs;
    if (Object.keys(entry).length) out[p.id] = entry;
  }
  return out;
};

/**
 * Поисковый индекс по описаниям и характеристикам.
 *
 * Описания уехали из общего каталога — вместе с ними поиск перестал
 * находить товар по словам, которых нет в названии («восьмиядерный»,
 * «ABS-пластик»). Тащить ради этого два мегабайта текста на каждую
 * страницу незачем: для поиска нужны не сами описания, а знание, в
 * каком товаре какое слово встречается.
 *
 * Поэтому строим обратный индекс «слово → номера товаров». Он весит
 * 0,4 МБ вместо 2 МБ и грузится один раз, когда человек начал искать.
 */
const searchIndex = (data) => {
  const products = data.products ?? [];
  const ids = products.map((p) => p.id);
  const inv = new Map();

  const words = (text) =>
    String(text ?? '')
      .toLowerCase()
      /* «ё» → «е» ровно как в поиске: там запрос приводится к этому же
         виду, и без замены «надёжный» из описания никогда бы не совпал
         с набранным «надежный» */
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/g, ' ')
      .split(' ')
      /* Короче трёх букв — предлоги и обрывки: они раздувают индекс, а
         искать по ним бессмысленно. Трёхбуквенные оставляем: это как раз
         аббревиатуры вроде ABS, USB, GPS, по которым и ищут */
      .filter((w) => w.length >= 3);

  products.forEach((p, i) => {
    const set = new Set();
    for (const d of p.description ?? []) words(d).forEach((w) => set.add(w));
    for (const [k, v] of p.specs ?? []) {
      words(`${k} ${v}`).forEach((w) => set.add(w));
    }
    for (const w of set) {
      if (!inv.has(w)) inv.set(w, []);
      inv.get(w).push(i);
    }
  });

  /* Номера пишем разницей с предыдущим и в 16-ричном виде: подряд
     идущие товары дают «1,1,1» вместо «701,702,703» — файл втрое легче */
  const packed = {};
  for (const [w, list] of inv) {
    let prev = 0;
    packed[w] = list
      .map((n) => {
        const d = n - prev;
        prev = n;
        return d.toString(16);
      })
      .join(',');
  }

  return { ids, w: packed };
};

const upsertMeta = (head, matcher, tag) =>
  matcher.test(head)
    ? head.replace(matcher, tag)
    : head.replace('</head>', `  ${tag}\n</head>`);

const applySeoToHtml = (html, seo, url) => {
  let head = html;

  if (seo.title) {
    head = head.replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${escapeAttr(seo.title)}</title>`,
    );
    head = upsertMeta(
      head,
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${escapeAttr(seo.title)}">`,
    );
  }

  if (seo.description) {
    head = upsertMeta(
      head,
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escapeAttr(seo.description)}"/>`,
    );
    head = upsertMeta(
      head,
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${escapeAttr(seo.description)}">`,
    );
  }

  if (seo.image) {
    head = upsertMeta(
      head,
      /<meta property="og:image"[^>]*>/,
      `<meta property="og:image" content="${escapeAttr(seo.image)}">`,
    );
    head = upsertMeta(
      head,
      /<meta name="twitter:image"[^>]*>/,
      `<meta name="twitter:image" content="${escapeAttr(seo.image)}">`,
    );
  }

  const canonical = seo.canonical || `${SITE_URL}${url}`;
  head = upsertMeta(
    head,
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeAttr(canonical)}"/>`,
  );
  head = upsertMeta(
    head,
    /<meta property="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeAttr(canonical)}">`,
  );
  head = upsertMeta(
    head,
    /<meta property="og:type"[^>]*>/,
    `<meta property="og:type" content="${escapeAttr(seo.type || 'website')}">`,
  );

  if (seo.jsonLd) {
    head = head.replace(
      '</head>',
      `  <script type="application/ld+json" id="seo-json-ld">${safeJson(
        seo.jsonLd,
      )}</script>\n</head>`,
    );
  }

  return head;
};

const GENERATED_DIRS = [
  'product',
  'guides',
  'installs',
  'articles',
  'catalog',
  'brand',
  'oferta',
  'privacy',
];

/**
 * Убираем страницы, которых больше нет в каталоге.
 *
 * Раньше здесь сносились целиком все папки со сгенерированными
 * страницами, и дальше генератор писал их заново. Для системы контроля
 * версий это выглядело так, будто изменились все полторы тысячи файлов
 * разом — даже когда правился один товар. История росла на полсотни
 * мегабайт за прогон.
 *
 * Теперь удаляем точечно: только те страницы, для которых в свежем
 * каталоге не нашлось адреса. Остальные останутся на месте, а
 * перезапишет их writeIfChanged — и только если содержимое правда
 * поменялось.
 */
const cleanOld = async (routes) => {
  const keep = new Set(routes.map((u) => u.replace(/^\//, '')));
  let removed = 0;

  const walk = async (dir) => {
    const abs = path.join(PUBLIC, dir);
    let entries;
    try {
      entries = await fs.readdir(abs, { withFileTypes: true });
    } catch {
      return; // папки ещё нет — первый запуск
    }
    for (const entry of entries) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(rel);
        /* Каталог мог опустеть после удаления страницы — прибираем,
           иначе в дереве остаются пустые папки от старых товаров */
        try {
          const left = await fs.readdir(path.join(PUBLIC, rel));
          if (!left.length) await fs.rm(path.join(PUBLIC, rel), { recursive: true, force: true });
        } catch {
          /* уже удалена */
        }
        continue;
      }
      if (entry.name !== 'index.html') continue;
      // public/product/foo/index.html → product/foo
      if (keep.has(dir)) continue;
      await fs.rm(path.join(PUBLIC, rel), { force: true });
      removed += 1;
    }
  };

  for (const dir of GENERATED_DIRS) await walk(dir);

  /* Файлы каталога со старым именем — с номером сборки внутри. Новые
     имена постоянные и перезаписываются на месте, но копии от прежних
     публикаций надо вымести, иначе так и лежат мёртвым грузом. */
  for (const name of await fs.readdir(PUBLIC)) {
    if (/^catalog-(data|photos|texts|index)-\d+\.js$/.test(name)) {
      await fs.rm(path.join(PUBLIC, name), { force: true });
    }
  }

  return removed;
};

/**
 * Ужимаем разметку, которую видит поисковый робот.
 *
 * В HTML попадала вся страница целиком, включая то, что для индексации
 * бесполезно: рисунки иконок (шестьдесят с лишним <svg> на страницу —
 * сорок мегабайт по каталогу) и подвал с девятью десятками ссылок,
 * одинаковый везде. Полторы тысячи карточек по семьдесят пять килобайт
 * складывались в полтораста мегабайт.
 *
 * Убирать это безопасно: робот берёт из HTML заголовки, тексты и ссылки
 * на товары — они остаются нетронутыми. Живой посетитель этой версии не
 * видит вовсе, у него React перерисовывает страницу с нуля (createRoot,
 * не гидрация), так что подвал и иконки на экране будут как раньше.
 *
 * Подвал заменяем ссылкой на главную, а не вырезаем совсем: страница без
 * единой внутренней ссылки в конце выглядит для робота тупиком.
 */
const slimForBots = (markup) =>
  markup
    // Рисунок иконки: сами дуги и линии смысла для поиска не несут
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, '')
    // Подвал целиком одинаков на всех страницах — держим только ссылку домой
    .replace(
      /<footer\b[^>]*>[\s\S]*?<\/footer>/g,
      '<footer><a href="/">ШТАТНО</a></footer>',
    )
    /* Оформление: на карточке это два десятка килобайт из сорока —
       длинные наборы вроде "flex items-center gap-2 rounded-xl...".
       Робот по ним ничего не ранжирует, а посетителю их принесёт React. */
    .replace(/\s(?:class|style)="[^"]*"/g, '')
    // Пустоты, оставшиеся после вырезанного
    .replace(/\s{2,}/g, ' ');

const EMPTY_ROOT = '<div id="root"><!--prerender--><!--/prerender--></div>';

/**
 * Возвращает шаблон к чистому виду: вырезает разметку между маркерами
 * и данные каталога от прошлой генерации. Иначе файл рос бы с каждым запуском.
 */
const resetShell = (html) =>
  html
    // Жадный поиск — до ПОСЛЕДНЕГО закрывающего маркера. Иначе обрывок
    // прошлой генерации остаётся в файле и сайт показывается дважды.
    .replace(
      /<!--prerender-->[\s\S]*<!--\/prerender-->/,
      '<!--prerender--><!--/prerender-->',
    )
    .replace(/\s*<script>window\.__CATALOG__=[\s\S]*?<\/script>/g, '')
    // Ссылка на каталог от прошлой сборки. Ловим и старое имя с номером
    // внутри (catalog-data-123.js), и нынешнее с номером в адресе —
    // иначе в файле остаются обе и каталог грузится дважды.
    .replace(
      /* Номер версии раньше был из цифр (время сборки), теперь это
         буквенно-цифровая сумма содержимого. Правило ловит оба вида:
         иначе старый тег не вычищается и с каждым прогоном в файле
         копится ещё одна копия — за пять прогонов их стало шесть. */
      /\s*<script src="\/catalog-data(-\d+)?\.js(\?v=[A-Za-z0-9]+)?"><\/script>/g,
      '',
    )
    /* Страховочный скрипт от прошлой сборки. Шаблон должен ловить любую
       его версию: правило искало точное «var d=document;», а в самом
       скрипте появилось «var d=document,done=false;» — совпадения не
       было, и копия оставалась в файле. За сборку добавлялась новая. */
    .replace(
      /\s*<script>\(function\(\)\{var d=document[\s\S]*?function heal[\s\S]*?<\/script>/g,
      '',
    )
    .replace(
      /\s*<script type="application\/ld\+json" id="seo-json-ld">[\s\S]*?<\/script>/g,
      '',
    )
    /* Код подтверждения Вебмастера мог смениться в админке — старый
       тег убираем, свежий вставим ниже из настроек */
    .replace(/\s*<meta name="yandex-verification"[^>]*>/g, '');

const main = async () => {
  let template = resetShell(
    await fs.readFile(path.join(DIST, 'index.html'), 'utf-8'),
  );
  const { render, takeSeo, clearSeo, scenarioSlugs } = await import(
    path.join(ROOT, 'dist-prerender', 'entry.mjs')
  );

  const catalogUrl = (await readJson(path.join(ROOT, 'backend', 'func2url.json')))
    .catalog;

  let data = { products: [], brands: [], guides: [], installs: [], articles: [], settings: {} };
  try {
    const res = await fetch(catalogUrl);
    if (res.ok) data = await res.json();
  } catch {
    console.warn('[prerender] каталог недоступен, страницы товаров пропущены');
  }

  // Категории берём из справочника, а если он пуст — из самих товаров
  const categoryNames = (data.categories ?? []).length
    ? data.categories
    : [...new Set((data.products ?? []).map((p) => p.category).filter(Boolean))];

  // Марку показываем, только если под неё реально есть товары
  const brandNames = (data.brands ?? [])
    .map((b) => b.name)
    .filter((name) =>
      (data.products ?? []).some((p) => (p.fits?.[name] ?? []).length > 0),
    );

  const routes = [
    '/',
    // Каталог: короткий адрес, на него ведут шапка и хлебные крошки
    '/catalog',
    '/guides',
    '/installs',
    // Раздел статей: SEO-тексты, ради которых он и заведён
    '/articles',
    // Оферта и политика данных: на них ссылается подвал каждой страницы
    // и галочка согласия в формах — без предрендера поисковик и
    // модерация Директа увидят пустую страницу
    '/oferta',
    '/privacy',
    // Страницы «подбор по задаче»: на них ведут ссылки с главной и из меню,
    // но раньше они не готовились заранее — поисковик видел пустую страницу
    ...(scenarioSlugs ?? []).map((slug) => `/scenario/${slug}`),
    ...categoryNames.map((c) => `/catalog/${slugify(c)}`),
    ...brandNames.map((b) => `/brand/${slugify(b)}`),
    ...(data.products ?? []).map((p) => `/product/${p.id}`),
    ...(data.guides ?? []).map((g) => `/guides/${g.slug}`),
    // Страница каждой выполненной работы — своя ссылка для клиента
    ...(data.installs ?? []).map((i) => `/installs/${i.slug}`),
    ...(data.articles ?? []).map((a) => `/articles/${a.slug}`),
  ];

  stats.removed = await cleanOld(routes);

  /**
   * Время сборки: по нему браузер понимает, насколько свежие вшитые данные.
   * Если они моложе нескольких минут — повторный запрос к функции не нужен.
   */
  const builtAt = Date.now();

  /**
   * Каталог кладём отдельным файлом и подключаем ссылкой.
   *
   * Раньше он вшивался в каждую страницу целиком: 450 товаров — почти
   * мегабайт на файл, а страниц больше пятисот. Итого папка разрасталась
   * до сотен мегабайт и сборка переставала проходить. Теперь файл один,
   * браузер берёт его из кеша, а страницы весят десятки килобайт.
   */
  /*
   * Имя файла постоянное, а номер сборки уехал в адрес ссылки
   * (?v=<номер>). Раньше он стоял в самом имени, и каждая сборка
   * создавала новый файл: для системы контроля версий это не правка,
   * а ещё одна копия на шесть мегабайт. За полсотни публикаций история
   * распухла до сотен мегабайт. Браузер по-прежнему видит новый адрес
   * и старое из кеша не берёт.
   */
  /*
   * Номер в адресе — отпечаток содержимого, а не время запуска.
   *
   * Раньше здесь стояло время сборки, и оно попадало в КАЖДУЮ страницу.
   * Любой прогон менял все полторы тысячи файлов, даже когда в каталоге
   * не поменялось ровным счётом ничего, — сравнивать содержимое было
   * бессмысленно. Считаем короткую сумму от самих данных: каталог тот
   * же — адрес тот же — страницы не трогаем. Изменился хоть один товар,
   * адрес станет другим, и браузер возьмёт свежий файл, а не из кеша.
   */
  const catalogJson = safeJson(slimCatalog(data));
  const catalogHash = createHash('sha1').update(catalogJson).digest('hex').slice(0, 12);

  /*
   * Метка свежести тоже идёт от содержимого, а не от часов.
   *
   * Она вшита в сам файл каталога (2,2 МБ), и со временем запуска этот
   * файл переписывался при каждом прогоне — даже когда ни один товар не
   * менялся. Берём время последней правки данных: каталог не тронут —
   * метка прежняя — файл на диске остаётся нетронутым. Смысл для
   * браузера сохраняется: метка по-прежнему растёт, когда данные
   * обновились, и по ней решается, идти ли за свежими с сервера.
   */
  const lastTouched = (list, pick) =>
    (list ?? []).reduce((max, item) => {
      const t = Date.parse(pick(item) ?? '');
      return Number.isNaN(t) ? max : Math.max(max, t);
    }, 0);

  const dataAt =
    Math.max(
      lastTouched(data.products, (p) => p.createdAt),
      lastTouched(data.articles, (a) => a.publishedAt),
      lastTouched(data.installs, (i) => i.createdAt),
    ) || builtAt;

  const catalogBody =
    `window.__CATALOG__=${catalogJson};` +
    `window.__CATALOG_AT__=${dataAt};` +
    `window.__PHOTOS_AT__=${dataAt};` +
    `window.__TEXTS_AT__=${dataAt};` +
    `window.__INDEX_AT__=${dataAt};` +
    `window.dispatchEvent(new Event('catalog-ready'))`;

  const catalogFile = `/catalog-data.js?v=${catalogHash}`;
  await writeIfChanged(path.join(PUBLIC, 'catalog-data.js'), catalogBody);

  /*
   * Остальные фото — отдельным файлом. Номер сборки страница передаёт
   * в адресе, чтобы не подтянуть их от прошлой версии каталога.
   */
  const rest = photoRest(data);
  await writeIfChanged(
    path.join(PUBLIC, 'catalog-photos.js'),
    `window.__PHOTOS__=${safeJson(rest)};` +
      `window.dispatchEvent(new Event('photos-ready'))`,
  );
  console.log(
    `[prerender] галерея: ${Object.keys(rest).length} товаров с доп. фото`,
  );

  /*
   * Описания и полные характеристики — тем же приёмом, что и фото:
   * отдельный файл, свежесть задаётся номером сборки в адресе.
   */
  const texts = textRest(data);
  await writeIfChanged(
    path.join(PUBLIC, 'catalog-texts.js'),
    `window.__TEXTS__=${safeJson(texts)};` +
      `window.dispatchEvent(new Event('texts-ready'))`,
  );
  console.log(
    `[prerender] тексты: ${Object.keys(texts).length} товаров с описанием`,
  );

  /*
   * Поисковый индекс — отдельным файлом: он нужен, только когда человек
   * начал искать, и это далеко не каждый визит.
   */
  const index = searchIndex(data);
  await writeIfChanged(
    path.join(PUBLIC, 'catalog-index.js'),
    `window.__SEARCH_INDEX__=${safeJson(index)};` +
      `window.dispatchEvent(new Event('index-ready'))`,
  );
  console.log(
    `[prerender] поиск: ${Object.keys(index.w).length} слов в индексе`,
  );

  /*
   * Подтверждение прав в Яндекс.Вебмастере.
   *
   * Робот проверяет мета-тег в исходном HTML и скрипты при этом не
   * выполняет — поэтому вшиваем код прямо в шаблон, а не добавляем
   * его на лету из React. Значение приходит из настроек админки.
   */
  const verification = String(data.settings?.analytics?.webmaster ?? '')
    .trim()
    .replace(/^[\s\S]*content=["']([^"']+)["'][\s\S]*$/i, '$1')
    .trim();
  if (verification) {
    template = template.replace(
      '</head>',
      `  <meta name="yandex-verification" content="${escapeAttr(verification)}"/>\n</head>`,
    );
    console.log(`[prerender] Вебмастер: код ${verification} вшит в страницы`);
  }

  const bootScript = `<script src="${catalogFile}"></script>`;

  /**
   * Страховка от белого экрана.
   *
   * Внутри готовой страницы записана ссылка на файл кода, а его имя меняется
   * при каждой правке. Если страница осталась со старой ссылкой, браузер не
   * находит файл и показывает пустоту. Здесь ловим такую ошибку, берём адрес
   * актуального файла из главной страницы и подключаем его.
   */
  const selfHealScript = `<script>(function(){var d=document,done=false;function heal(){if(done)return;done=true;fetch('/?_='+Date.now()).then(function(r){return r.text()}).then(function(t){var m=t.match(/\\/assets\\/index-[A-Za-z0-9_-]+\\.js/);var c=t.match(/\\/assets\\/index-[A-Za-z0-9_-]+\\.css/);if(!m)return;if(c&&!d.querySelector('link[href=\"'+c[0]+'\"]')){var l=d.createElement('link');l.rel='stylesheet';l.href=c[0];d.head.appendChild(l)}if(d.querySelector('script[src=\"'+m[0]+'\"]'))return;var s=d.createElement('script');s.type='module';s.crossOrigin='';s.src=m[0];d.head.appendChild(s)}).catch(function(){})}d.querySelectorAll('script[src^=\"/assets/index-\"]').forEach(function(s){s.addEventListener('error',heal)})})()</script>`;

  const generated = [];
  /* Адреса страниц, которые правда изменились на диске — по ним ниже
     сдвигаем дату в карте сайта */
  const touched = new Set();

  for (const url of routes) {
    if (url === '/') continue; // главную вшиваем отдельно, ниже

    let appHtml = '';
    let seo = {};
    try {
      clearSeo();
      appHtml = render(url, data);
      seo = takeSeo('current') ?? {};
    } catch (err) {
      console.warn(`[prerender] ${url}: ${err.message}`);
      continue;
    }

    let html = applySeoToHtml(template, seo, url);
    html = html.replace(
      EMPTY_ROOT,
      `<div id="root"><!--prerender-->${slimForBots(appHtml)}<!--/prerender--></div>\n${bootScript}\n${selfHealScript}`,
    );

    const target = path.join(PUBLIC, url.replace(/^\//, ''), 'index.html');
    const state = await writeIfChanged(target, html);
    if (state !== 'skipped') touched.add(url);
    generated.push(url);
  }

  // Главную вшиваем в корневой index.html — Vite берёт его как шаблон сборки.
  try {
    clearSeo();
    const homeHtml = render('/', data);
    const homeSeo = takeSeo('current') ?? {};

    const source = path.join(ROOT, 'index.html');
    let root = resetShell(await fs.readFile(source, 'utf-8'));
    /* Код подтверждения Вебмастера: главную собираем из исходного файла,
       а не из шаблона, поэтому тег нужно вшить сюда отдельно — иначе
       на самой важной странице его как раз и не окажется */
    if (verification) {
      root = root.replace(
        '</head>',
        `  <meta name="yandex-verification" content="${escapeAttr(verification)}"/>\n</head>`,
      );
    }
    root = applySeoToHtml(root, homeSeo, '/');
    root = root.replace(
      EMPTY_ROOT,
      `<div id="root"><!--prerender-->${slimForBots(homeHtml)}<!--/prerender--></div>\n${bootScript}\n${selfHealScript}`,
    );
    const state = await writeIfChanged(source, root);
    if (state !== 'skipped') touched.add('/');
    generated.push('/');
  } catch (err) {
    console.warn(`[prerender] главная: ${err.message}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const priority = (u) => {
    if (u === '/') return '1.0';
    if (u.startsWith('/catalog/') || u.startsWith('/brand/')) return '0.9';
    if (u.startsWith('/product/')) return '0.8';
    // Статьи ведут трафик из поиска — им вес выше служебных страниц
    if (u.startsWith('/articles')) return '0.7';
    return '0.6';
  };
  const freq = (u) => {
    if (u === '/') return 'daily';
    if (u.startsWith('/catalog/') || u.startsWith('/brand/')) return 'weekly';
    if (u.startsWith('/product/')) return 'weekly';
    if (u.startsWith('/articles')) return 'monthly';
    return 'monthly';
  };

  /*
   * Слепок того, что попало в статику. Админка сравнивает его с текущим
   * каталогом и показывает, какие товары ушли вперёд собранных страниц.
   *
   * ВАЖНО: правила отпечатка продублированы в src/lib/pageKeys.ts —
   * оттуда их читает админка, а сюда импортировать нельзя, сборщик
   * запускается обычным Node и TypeScript не понимает. Менять эти два
   * файла нужно только вместе: разойдутся — админка начнёт считать
   * свежие страницы устаревшими (или наоборот, что хуже).
   */
  const fingerprint = (list, pick) =>
    (list ?? [])
      .map(pick)
      .sort()
      .join('|');

  /* Короткая сумма строки — копия pageHash из src/lib/pageHash.ts */
  const pageHash = (input) => {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < input.length; i += 1) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };

  /*
   * Отпечаток товара: раньше в него входили только id, название и
   * цена — правка описания или фото проходила незамеченной, и страница
   * для поисковика оставалась старой, хотя админка бодро писала «всё
   * актуально». Добавляем всё, что реально меняет отдаваемый HTML:
   * описание и инструкцию по установке (идут в текст страницы),
   * характеристики и совместимость (идут в текст и в семантику),
   * обложку (идёт в og:image и в разметку товара).
   *
   * Порядок specs/fits важен для покупателя, но не всегда стабилен при
   * сохранении в админке — сравниваем отсортированным, чтобы менявшийся
   * только порядок полей не считался изменением.
   */
  const stableSpecs = (p) =>
    [...(p.specs ?? [])]
      .map(([k, v]) => `${k}:${v}`)
      .sort()
      .join(',');
  const stableFits = (p) =>
    Object.entries(p.fits ?? {})
      .map(([brand, models]) => `${brand}=${[...(models ?? [])].sort().join(',')}`)
      .sort()
      .join(';');

  const productKey = (p) =>
    [
      p.id,
      p.name,
      p.price,
      p.oldPrice ?? '',
      p.stock ?? '',
      (p.description ?? []).join('\n'),
      p.install ?? '',
      stableSpecs(p),
      stableFits(p),
      (p.images ?? [])[0] ?? '',
    ].join(':');

  const installKey = (i) =>
    [
      i.slug,
      i.title,
      i.excerpt,
      i.beforeImage,
      i.afterImage,
      (i.gallery ?? []).join(','),
      i.video,
      i.comment,
      (i.products ?? []).join(','),
    ].join(':');

  const guideKey = (g) =>
    [g.slug, g.title, g.excerpt, JSON.stringify(g.blocks ?? [])].join(':');

  const articleKey = (a) =>
    [
      a.slug,
      a.title,
      a.metaTitle,
      a.metaDescription,
      a.excerpt,
      JSON.stringify(a.blocks ?? []),
    ].join(':');

  /*
   * Отпечаток по каждой странице отдельно — из него админка узнаёт, КАКИЕ
   * именно товары разошлись со статикой, а не только сам факт «что-то
   * поменялось». Храним не сами склеенные описания, а короткие суммы:
   * сырые строки занимали почти два мегабайта, и файл переписывался
   * целиком от правки одной цены.
   */
  const hashesOf = (list, pick, id) =>
    Object.fromEntries((list ?? []).map((item) => [id(item), pageHash(pick(item))]));

  const pageFingerprints = {
    product: hashesOf(data.products, productKey, (p) => p.id),
    guide: hashesOf(data.guides, guideKey, (g) => g.slug),
    install: hashesOf(data.installs, installKey, (i) => i.slug),
    article: hashesOf(data.articles, articleKey, (a) => a.slug),
  };

  /*
   * Даты изменения страниц для карты сайта.
   *
   * Раньше всем адресам проставлялось сегодняшнее число: карта менялась
   * каждый прогон целиком, а поисковику это говорило «весь сайт обновлён»
   * — и он переобходил полторы тысячи нетронутых страниц впустую.
   * Теперь берём дату из прошлой карты и сдвигаем только там, где
   * страница правда перезаписалась.
   */
  const prevManifest = await readJson(
    path.join(PUBLIC, 'prerender-manifest.json'),
  ).catch(() => null);
  const prevSignature = prevManifest?.signature ?? {};

  /*
   * Запасной источник дат — прошлая карта сайта.
   *
   * Даты хранятся в манифесте, но он один-единственный файл: пропадёт
   * (а файлы из репозитория уже случалось убирать и возвращать) — и все
   * полторы тысячи адресов разом получат сегодняшнее число. Для
   * поисковика это сигнал «сайт обновился целиком», он пойдёт
   * переобходить нетронутые страницы. Карта лежит рядом и содержит те
   * же даты, поэтому читаем их оттуда, когда манифеста нет.
   */
  const datesFromSitemap = async () => {
    const out = {};
    try {
      const xml = await fs.readFile(path.join(PUBLIC, 'sitemap.xml'), 'utf-8');
      const re = /<loc>([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g;
      let m;
      while ((m = re.exec(xml))) {
        out[m[1].replace(SITE_URL, '')] = m[2];
      }
    } catch {
      /* карты тоже нет — значит первый запуск */
    }
    return out;
  };

  const prevDates = prevManifest?.lastmod ?? (await datesFromSitemap());

  const lastmod = {};
  for (const url of routes) {
    // touched — страницы, которые writeIfChanged создал или переписал
    lastmod[url] = touched.has(url) ? today : (prevDates[url] ?? today);
  }

  /* Общая сумма по разделу — быстрый ответ на вопрос «есть ли вообще
     расхождения». Раньше тут лежали сами склеенные описания всех
     товаров: почти два мегабайта в файле, который правится при каждой
     смене цены. Сумма занимает десяток символов и отвечает на тот же
     вопрос. */
  const signature = {
    products: pageHash(fingerprint(data.products, productKey)),
    guides: pageHash(fingerprint(data.guides, guideKey)),
    articles: pageHash(fingerprint(data.articles, articleKey)),
  };

  /* Время генерации обновляем, только если что-то реально поменялось.
     Иначе манифест (он тоже в репозитории) переписывался бы при каждом
     холостом прогоне — ровно та болезнь, которую лечим. */
  const contentSame =
    prevManifest &&
    prevSignature.products === signature.products &&
    prevSignature.guides === signature.guides &&
    prevSignature.articles === signature.articles &&
    !touched.size &&
    !stats.removed;

  await writeIfChanged(
    path.join(PUBLIC, 'prerender-manifest.json'),
    JSON.stringify(
      {
        generatedAt: contentSame
          ? prevManifest.generatedAt
          : new Date().toISOString(),
        pages: routes.length,
        products: (data.products ?? []).length,
        guides: (data.guides ?? []).length,
        articles: (data.articles ?? []).length,
        signature,
        /* Отпечатки по каждой странице: админка по ним показывает, какие
           именно товары изменились с последней сборки */
        pages_hash: pageFingerprints,
        lastmod,
      },
      null,
      2,
    ),
  );

  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes
      .map(
        (u) =>
          `  <url>\n    <loc>${SITE_URL}${u}</loc>\n    <lastmod>${lastmod[u]}</lastmod>\n` +
          `    <changefreq>${freq(u)}</changefreq>\n    <priority>${priority(
            u,
          )}</priority>\n  </url>`,
      )
      .join('\n') +
    '\n</urlset>\n';
  await writeIfChanged(path.join(PUBLIC, 'sitemap.xml'), sitemap);
  /* Карта строится после сборки, поэтому в dist лежала бы версия с прошлой
     публикации — новые товары попадали в поиск только через раз. Пишем в обе
     папки сразу: в public для следующей сборки, в dist для текущей.
     dist в репозиторий не идёт, но пишем тоже через сравнение — лишняя
     запись здесь ничего не даёт. */
  await writeIfChanged(path.join(DIST, 'sitemap.xml'), sitemap);

  console.log(
    `[prerender] готово: ${generated.length} страниц, карта сайта на ${routes.length} адресов`,
  );
  /* Главная цифра прогона — сколько файлов правда тронули. Пока она
     близка к нулю, система контроля версий не пухнет; если вдруг
     «изменено» подскочило на весь каталог, значит что-то снова попало
     в каждую страницу (номер сборки, дата) и это надо ловить сразу */
  console.log(
    `[prerender] файлы — новых: ${stats.created}, изменено: ${stats.changed}, ` +
      `пропущено без записи: ${stats.skipped}, удалено устаревших: ${stats.removed}`,
  );
};

main().catch((err) => {
  console.error('[prerender] ошибка:', err);
  process.exit(1);
});