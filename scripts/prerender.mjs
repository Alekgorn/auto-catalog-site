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
    if (/^catalog-data-\d+\.js$/.test(name)) {
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
    .replace(/\s*<script>\(function\(\)\{var d=document;function heal[\s\S]*?<\/script>/g, '')
    .replace(
      /\s*<script type="application\/ld\+json" id="seo-json-ld">[\s\S]*?<\/script>/g,
      '',
    );

const main = async () => {
  const template = resetShell(
    await fs.readFile(path.join(DIST, 'index.html'), 'utf-8'),
  );
  const { render, takeSeo, clearSeo } = await import(
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
    `window.__CATALOG__=${safeJson(data)};window.__CATALOG_AT__=${builtAt};` +
      `window.dispatchEvent(new Event('catalog-ready'))`,
    'utf-8',
  );

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

  console.log(
    `[prerender] готово: ${generated.length} страниц, карта сайта на ${routes.length} адресов`,
  );
};

main().catch((err) => {
  console.error('[prerender] ошибка:', err);
  process.exit(1);
});