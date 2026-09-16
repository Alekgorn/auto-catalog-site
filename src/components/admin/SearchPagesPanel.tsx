import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useCatalog } from '@/context/CatalogContext';
import { useToast } from '@/hooks/use-toast';
import { pageHash } from '@/lib/pageHash';
import {
  articleHashes,
  articleKey,
  diffHashes,
  guideHashes,
  guideKey,
  productHashes,
  productKey,
} from '@/lib/pageKeys';

interface Manifest {
  generatedAt: string;
  pages: number;
  products: number;
  guides: number;
  articles: number;
  signature: { products: string; guides: string; articles: string };
  /* Отпечаток каждой страницы: адрес → короткая сумма. Появился не сразу,
     у собранных до этого страниц его нет — тогда показываем только общий
     факт «каталог изменился», без списка товаров */
  pages_hash?: {
    product?: Record<string, string>;
    guide?: Record<string, string>;
    article?: Record<string, string>;
  };
}

const REQUEST_TEXT =
  'Обнови страницы для поиска — я поменял каталог в админке.';

const fingerprint = <T,>(list: T[], pick: (item: T) => string) =>
  pageHash(list.map(pick).sort().join('|'));

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Сколько прошло с последней сборки — «3 часа назад», «вчера» */
const timeAgo = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед назад`;
  return `${Math.floor(days / 30)} мес назад`;
};

/** Строка вида «3 товара», «1 статья» — с правильным окончанием */
const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
};

interface ChangeRow {
  id: string;
  name: string;
  kind: 'added' | 'changed' | 'removed';
  section: string;
}

const KIND_LABEL: Record<ChangeRow['kind'], string> = {
  added: 'новый',
  changed: 'изменён',
  removed: 'удалён',
};

const KIND_STYLE: Record<ChangeRow['kind'], string> = {
  added: 'bg-success-soft text-success',
  changed: 'bg-surface-muted text-foreground',
  removed: 'bg-primary/10 text-primary',
};

const SearchPagesPanel = () => {
  const { toast } = useToast();
  const { products, guides, articles } = useCatalog();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [checking, setChecking] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const check = useCallback(() => {
    setChecking(true);
    fetch(`/prerender-manifest.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setManifest(d))
      .catch(() => setManifest(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(check, [check]);

  /*
   * Описания и характеристики приходят не сразу: сначала страница
   * показывает облегчённый каталог без них, полный подтягивается с
   * сервера следом. Отпечаток считается в том числе по описанию, поэтому
   * на облегчённых данных он не сойдётся НИ У ОДНОГО товара — панель
   * закричала бы «изменилось 1800 позиций» на ровном месте. Ждём, пока
   * описания появятся, и только тогда сверяем.
   */
  const dataReady = useMemo(
    () => products.some((p) => (p.description?.length ?? 0) > 0),
    [products],
  );

  const current = useMemo(
    () =>
      dataReady
        ? {
            products: fingerprint(products, productKey),
            guides: fingerprint(guides, guideKey),
            articles: fingerprint(articles, articleKey),
          }
        : null,
    [dataReady, products, guides, articles],
  );

  const stale =
    !!manifest &&
    !!current &&
    (manifest.signature?.products !== current.products ||
      manifest.signature?.guides !== current.guides ||
      manifest.signature?.articles !== current.articles);

  /*
   * Поимённый список расхождений. Считаем только когда статика устарела —
   * на актуальном каталоге это лишняя работа на полторы тысячи товаров
   * при каждой перерисовке панели.
   */
  const changes = useMemo<ChangeRow[]>(() => {
    if (!manifest?.pages_hash || !stale) return [];

    const nameOf = new Map<string, string>();
    for (const p of products) nameOf.set(p.id, p.name);
    for (const g of guides) nameOf.set(g.slug, g.title);
    for (const a of articles) nameOf.set(a.slug, a.title);

    const rows: ChangeRow[] = [];
    const collect = (
      cur: Record<string, string>,
      built: Record<string, string> | undefined,
      section: string,
    ) => {
      const { added, changed, removed } = diffHashes(cur, built);
      for (const id of added) rows.push({ id, name: nameOf.get(id) ?? id, kind: 'added', section });
      for (const id of changed)
        rows.push({ id, name: nameOf.get(id) ?? id, kind: 'changed', section });
      for (const id of removed) rows.push({ id, name: id, kind: 'removed', section });
    };

    collect(productHashes(products), manifest.pages_hash.product, 'Товар');
    collect(guideHashes(guides), manifest.pages_hash.guide, 'Инструкция');
    collect(articleHashes(articles), manifest.pages_hash.article, 'Статья');

    /* Новые и удалённые важнее правок — они меняют состав каталога,
       поэтому поднимаем их наверх списка */
    const weight = { added: 0, removed: 1, changed: 2 };
    return rows.sort(
      (a, b) => weight[a.kind] - weight[b.kind] || a.name.localeCompare(b.name, 'ru'),
    );
  }, [manifest, stale, products, guides, articles]);

  const copyRequest = async () => {
    try {
      await navigator.clipboard.writeText(REQUEST_TEXT);
      toast({
        title: 'Текст скопирован',
        description: 'Вставьте его в чат — я обновлю страницы',
      });
    } catch {
      toast({ title: 'Не получилось скопировать', description: REQUEST_TEXT });
    }
  };

  const statusColor =
    !manifest || !dataReady
      ? 'border-border'
      : stale
        ? 'border-primary'
        : 'border-success';

  const visible = expanded ? changes : changes.slice(0, 8);

  return (
    <div className={`border-2 ${statusColor} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Видимость в поиске</div>
          <h3 className="mt-2 font-head text-xl font-bold uppercase tracking-tight">
            Страницы для поисковых систем
          </h3>
        </div>
        <button
          onClick={check}
          disabled={checking}
          className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary disabled:opacity-60"
        >
          <Icon name="RotateCcw" size={13} />
          {checking ? 'Проверяем…' : 'Проверить'}
        </button>
      </div>

      <p className="mt-4 max-w-[46em] text-[0.9rem] leading-relaxed text-muted-foreground">
        Чтобы Яндекс и Google видели товары, для каждой страницы заранее
        собирается готовая версия. Она не обновляется сама: после правок в
        каталоге её нужно пересобрать. Покупателям сайт при этом всегда
        показывает актуальные данные — устареть может только та версия, которую
        читают поисковые роботы.
      </p>

      {checking || (manifest && !dataReady) ? (
        <div className="mt-6 text-[0.9rem] text-muted-foreground">
          Сверяем каталог со страницами…
        </div>
      ) : !manifest ? (
        <div className="mt-6 flex items-start gap-3 border border-border bg-surface-muted px-4 py-3">
          <Icon name="Info" size={17} className="mt-px flex-none" />
          <span className="text-[0.9rem]">
            Страницы ещё ни разу не собирались. Напишите мне в чат — сделаю.
          </span>
        </div>
      ) : stale ? (
        <>
          <div className="mt-6 flex items-start gap-3 border-2 border-primary px-4 py-3">
            <Icon name="TriangleAlert" size={18} className="mt-px flex-none text-primary" />
            <span className="text-[0.9rem]">
              <span className="block font-medium">
                {changes.length
                  ? `С последней сборки изменилось ${plural(changes.length, 'позиция', 'позиции', 'позиций')}`
                  : 'Каталог изменился'}
              </span>
              <span className="mt-0.5 block text-muted-foreground">
                Поисковики пока видят версию от {formatDate(manifest.generatedAt)}
                {timeAgo(manifest.generatedAt) && ` — ${timeAgo(manifest.generatedAt)}`}.
                Правки в неё не попали.
              </span>
            </span>
          </div>

          {changes.length > 0 && (
            <div className="mt-5 border border-border">
              <div className="border-b border-border bg-surface-muted px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                Что изменилось
              </div>
              <ul className="divide-y divide-border">
                {visible.map((row) => (
                  <li
                    key={`${row.section}:${row.id}:${row.kind}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="min-w-0 text-[0.88rem]">
                      <span className="block truncate font-medium">{row.name}</span>
                      <span className="mt-0.5 block text-[0.78rem] text-muted-foreground">
                        {row.section}
                      </span>
                    </span>
                    <span
                      className={`flex-none px-2 py-1 text-[0.7rem] uppercase tracking-[0.08em] ${KIND_STYLE[row.kind]}`}
                    >
                      {KIND_LABEL[row.kind]}
                    </span>
                  </li>
                ))}
              </ul>
              {changes.length > 8 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex w-full items-center justify-center gap-2 border-t border-border px-4 py-2.5 text-[0.78rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
                  {expanded ? 'Свернуть' : `Показать ещё ${changes.length - 8}`}
                </button>
              )}
            </div>
          )}

          <button
            onClick={copyRequest}
            className="mt-5 flex items-center gap-3 bg-primary px-6 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground"
          >
            <Icon name="Copy" size={17} />
            Обновить страницы для поиска
          </button>
          <p className="mt-3 text-[0.8rem] text-muted-foreground">
            Кнопка скопирует готовый текст — вставьте его в чат со мной, обновлю
            за пару минут.
          </p>
        </>
      ) : (
        <div className="mt-6 flex items-start gap-3 border border-success bg-success-soft px-4 py-3">
          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success text-success-foreground">
            <Icon name="Check" size={13} strokeWidth={3} />
          </span>
          <span className="text-[0.9rem] text-success">
            <span className="block font-medium">Всё актуально</span>
            <span className="mt-0.5 block">
              {manifest.pages} страниц собрано {formatDate(manifest.generatedAt)}
              {timeAgo(manifest.generatedAt) && ` — ${timeAgo(manifest.generatedAt)}`}.
              Поисковики видят текущий каталог.
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchPagesPanel;