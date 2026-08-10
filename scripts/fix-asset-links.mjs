/**
 * Чинит ссылки на файлы кода внутри заранее собранных страниц.
 *
 * Зачем: страницы товаров, категорий и марок готовятся заранее и хранят внутри
 * ссылку вида /assets/index-XXXX.js. При каждой правке кода имя этого файла
 * меняется, а в готовых страницах остаётся прежнее — браузер идёт за файлом,
 * которого уже нет, и вместо сайта показывает белый экран.
 *
 * Здесь после сборки берём актуальные имена из свежего index.html и
 * подставляем их во все готовые страницы — и в сборку, и в исходники.
 *
 * Запуск: node scripts/fix-asset-links.mjs (автоматически после vite build)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');

const JS = /\/assets\/index-[A-Za-z0-9_-]+\.js/g;
const CSS = /\/assets\/index-[A-Za-z0-9_-]+\.css/g;

/** Рекурсивно собирает все index.html внутри папки. */
const collect = async (dir) => {
  const found = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'assets' || e.name === 'node_modules') continue;
      found.push(...(await collect(full)));
    } else if (e.name === 'index.html') {
      found.push(full);
    }
  }
  return found;
};

const main = async () => {
  const distIndex = path.join(DIST, 'index.html');
  let shell;
  try {
    shell = await fs.readFile(distIndex, 'utf-8');
  } catch {
    console.warn('[assets] сборка не найдена, шаг пропущен');
    return;
  }

  const js = shell.match(JS)?.[0];
  const css = shell.match(CSS)?.[0];
  if (!js) {
    console.warn('[assets] не удалось определить актуальный файл кода');
    return;
  }

  const files = [
    ...(await collect(DIST)),
    ...(await collect(PUBLIC)),
  ].filter((f) => f !== distIndex);

  let fixed = 0;
  for (const file of files) {
    const html = await fs.readFile(file, 'utf-8');
    let next = html.replace(JS, js);
    if (css) next = next.replace(CSS, css);
    if (next !== html) {
      await fs.writeFile(file, next, 'utf-8');
      fixed += 1;
    }
  }

  console.log(
    fixed
      ? `[assets] обновлено страниц: ${fixed} -> ${js}`
      : '[assets] ссылки уже актуальны',
  );
};

main().catch((err) => {
  console.warn(`[assets] ${err.message}`);
});
