import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useCatalog } from '@/context/CatalogContext';
import { useToast } from '@/hooks/use-toast';

interface Manifest {
  generatedAt: string;
  pages: number;
  products: number;
  guides: number;
  signature: { products: string; guides: string };
}

const REQUEST_TEXT =
  'Обнови страницы для поиска — я поменял каталог в админке.';

const fingerprint = <T,>(list: T[], pick: (item: T) => string) =>
  list.map(pick).sort().join('|');

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

const SearchPagesPanel = () => {
  const { toast } = useToast();
  const { products, guides } = useCatalog();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [checking, setChecking] = useState(true);

  const check = useCallback(() => {
    setChecking(true);
    fetch(`/prerender-manifest.json?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setManifest(d))
      .catch(() => setManifest(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(check, [check]);

  const current = {
    products: fingerprint(
      products,
      (p) => `${p.id}:${p.name}:${p.price}:${p.oldPrice ?? ''}`,
    ),
    guides: fingerprint(guides, (g) => `${g.slug}:${g.title}`),
  };

  const stale =
    !!manifest &&
    (manifest.signature?.products !== current.products ||
      manifest.signature?.guides !== current.guides);

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

  const statusColor = !manifest
    ? 'border-border'
    : stale
      ? 'border-primary'
      : 'border-success';

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

      {checking ? (
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
              <span className="block font-medium">Каталог изменился</span>
              <span className="mt-0.5 block text-muted-foreground">
                Поисковики пока видят версию от {formatDate(manifest.generatedAt)}.
                Новые товары и цены в неё не попали.
              </span>
            </span>
          </div>

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
              {manifest.pages} страниц собрано {formatDate(manifest.generatedAt)}.
              Поисковики видят текущий каталог.
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchPagesPanel;
