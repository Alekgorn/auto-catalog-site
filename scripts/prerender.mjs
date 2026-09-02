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
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const SITE_URL = 'https://xn--80a0adnb7a.xn--p1ai';

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf-8'));

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

/** Убираем ранее сгенерированные страницы, чтобы не копить мусор. */
const cleanOld = async () => {
  for (const dir of ['product', 'guides', 'catalog', 'brand']) {
    await fs.rm(path.join(PUBLIC, dir), { recursive: true, force: true });
  }
  // Файлы каталога от прошлых сборок — иначе копятся по мегабайту за раз
  for (const name of await fs.readdir(PUBLIC)) {
    if (/^catalog-(data|photos|texts|index)-\d+\.js$/.test(name)) {
      await fs.rm(path.join(PUBLIC, name), { force: true });
    }
  }
};

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
    // Ссылка на файл каталога от прошлой сборки — имя меняется каждый раз
    .replace(/\s*<script src="\/catalog-data-\d+\.js"><\/script>/g, '')
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

  let data = { products: [], brands: [], guides: [], settings: {} };
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
    '/guides',
    // Страницы «подбор по задаче»: на них ведут ссылки с главной и из меню,
    // но раньше они не готовились заранее — поисковик видел пустую страницу
    ...(scenarioSlugs ?? []).map((slug) => `/scenario/${slug}`),
    ...categoryNames.map((c) => `/catalog/${slugify(c)}`),
    ...brandNames.map((b) => `/brand/${slugify(b)}`),
    ...(data.products ?? []).map((p) => `/product/${p.id}`),
    ...(data.guides ?? []).map((g) => `/guides/${g.slug}`),
  ];

  await cleanOld();

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
  const catalogFile = `/catalog-data-${builtAt}.js`;
  await fs.writeFile(
    path.join(PUBLIC, catalogFile.slice(1)),
    `window.__CATALOG__=${safeJson(slimCatalog(data))};` +
      `window.__CATALOG_AT__=${builtAt};` +
      `window.__PHOTOS_AT__=${builtAt};` +
      `window.__TEXTS_AT__=${builtAt};` +
      `window.__INDEX_AT__=${builtAt};` +
      `window.dispatchEvent(new Event('catalog-ready'))`,
    'utf-8',
  );

  /*
   * Остальные фото — отдельным файлом с тем же номером сборки, чтобы
   * страница не подтянула их от прошлой версии каталога.
   */
  const rest = photoRest(data);
  await fs.writeFile(
    path.join(PUBLIC, `catalog-photos-${builtAt}.js`),
    `window.__PHOTOS__=${safeJson(rest)};` +
      `window.dispatchEvent(new Event('photos-ready'))`,
    'utf-8',
  );
  console.log(
    `[prerender] галерея: ${Object.keys(rest).length} товаров с доп. фото`,
  );

  /*
   * Описания и полные характеристики — тем же приёмом, что и фото:
   * отдельный файл с номером сборки, чтобы не смешать с прошлой версией.
   */
  const texts = textRest(data);
  await fs.writeFile(
    path.join(PUBLIC, `catalog-texts-${builtAt}.js`),
    `window.__TEXTS__=${safeJson(texts)};` +
      `window.dispatchEvent(new Event('texts-ready'))`,
    'utf-8',
  );
  console.log(
    `[prerender] тексты: ${Object.keys(texts).length} товаров с описанием`,
  );

  /*
   * Поисковый индекс — отдельным файлом: он нужен, только когда человек
   * начал искать, и это далеко не каждый визит.
   */
  const index = searchIndex(data);
  await fs.writeFile(
    path.join(PUBLIC, `catalog-index-${builtAt}.js`),
    `window.__SEARCH_INDEX__=${safeJson(index)};` +
      `window.dispatchEvent(new Event('index-ready'))`,
    'utf-8',
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
      `<div id="root"><!--prerender-->${appHtml}<!--/prerender--></div>\n${bootScript}\n${selfHealScript}`,
    );

    const target = path.join(PUBLIC, url.replace(/^\//, ''), 'index.html');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, html, 'utf-8');
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
      `<div id="root"><!--prerender-->${homeHtml}<!--/prerender--></div>\n${bootScript}\n${selfHealScript}`,
    );
    await fs.writeFile(source, root, 'utf-8');
    generated.push('/');
  } catch (err) {
    console.warn(`[prerender] главная: ${err.message}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const priority = (u) => {
    if (u === '/') return '1.0';
    if (u.startsWith('/catalog/') || u.startsWith('/brand/')) return '0.9';
    if (u.startsWith('/product/')) return '0.8';
    return '0.6';
  };
  const freq = (u) => {
    if (u === '/') return 'daily';
    if (u.startsWith('/catalog/') || u.startsWith('/brand/')) return 'weekly';
    if (u.startsWith('/product/')) return 'weekly';
    return 'monthly';
  };

  // Слепок того, что попало в статику. Админка сравнивает его с текущим
  // каталогом и подсказывает, когда страницы для поиска пора обновить.
  const fingerprint = (list, pick) =>
    (list ?? [])
      .map(pick)
      .sort()
      .join('|');

  await fs.writeFile(
    path.join(PUBLIC, 'prerender-manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        pages: routes.length,
        products: (data.products ?? []).length,
        guides: (data.guides ?? []).length,
        signature: {
          products: fingerprint(
            data.products,
            (p) => `${p.id}:${p.name}:${p.price}:${p.oldPrice ?? ''}`,
          ),
          guides: fingerprint(data.guides, (g) => `${g.slug}:${g.title}`),
        },
      },
      null,
      2,
    ),
    'utf-8',
  );

  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes
      .map(
        (u) =>
          `  <url>\n    <loc>${SITE_URL}${u}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${freq(u)}</changefreq>\n    <priority>${priority(
            u,
          )}</priority>\n  </url>`,
      )
      .join('\n') +
    '\n</urlset>\n';
  await fs.writeFile(path.join(PUBLIC, 'sitemap.xml'), sitemap, 'utf-8');
  // Карта строится после сборки, поэтому в dist лежала бы версия с прошлой
  // публикации — новые товары попадали в поиск только через раз. Пишем в обе
  // папки сразу: в public для следующей сборки, в dist для текущей.
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf-8');

  console.log(
    `[prerender] готово: ${generated.length} страниц, карта сайта на ${routes.length} адресов`,
  );
};

main().catch((err) => {
  console.error('[prerender] ошибка:', err);
  process.exit(1);
});