import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AdminQuery {
  query: string;
  hits: number;
  found: number;
  createdAt: string;
}

type Filter = 'all' | 'empty';
type Provider = 'auto' | 'yandex' | 'openai';

const PROVIDERS: { key: Provider; label: string; note: string }[] = [
  {
    key: 'yandex',
    label: 'YandexGPT',
    note: 'Российский сервис, оплата рублями по счёту',
  },
  {
    key: 'openai',
    label: 'ChatGPT',
    note: 'Точнее на сложных запросах, нужен зарубежный ключ',
  },
  {
    key: 'auto',
    label: 'Автоматически',
    note: 'Сначала Яндекс, при сбое переключится на ChatGPT',
  },
];

/**
 * Что покупатели искали по смыслу. Запросы без результата — прямая подсказка,
 * каких товаров не хватает в каталоге.
 */
const QueriesPanel = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [provider, setProvider] = useState<Provider>('auto');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('?action=queries');
      const data = await res.json();
      setItems(data.queries ?? []);
      const cfg = await adminFetch('?action=settings')
        .then((r) => r.json())
        .catch(() => ({}));
      const saved = cfg.settings?.ai_search_provider;
      if (saved === 'yandex' || saved === 'openai' || saved === 'auto') {
        setProvider(saved);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chooseProvider = async (next: Provider) => {
    setProvider(next);
    setSaving(true);
    const res = await adminFetch('?action=settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: { ai_search_provider: next } }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить выбор' });
      return;
    }
    const label = PROVIDERS.find((p) => p.key === next)?.label ?? next;
    toast({ title: 'Сохранено', description: `Поиск по смыслу: ${label}` });
  };

  const clear = async () => {
    if (!window.confirm('Очистить историю запросов? Отменить будет нельзя.')) return;
    await adminFetch('?action=queries', { method: 'DELETE' });
    toast({ title: 'История очищена' });
    load();
  };

  const empty = useMemo(() => items.filter((q) => q.found === 0), [items]);
  const shown = filter === 'empty' ? empty : items;
  const asked = items.reduce((sum, q) => sum + q.hits, 0);

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">Загружаем…</div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[44em] text-muted-foreground">
          Запросы, по которым покупатели нажимали «Подобрать». Строки без
          результата — то, чего людям не хватило в каталоге.
        </p>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="flex flex-none items-center justify-center gap-2 border border-foreground px-5 py-3 text-[0.78rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
          >
            <Icon name="Trash2" size={15} />
            Очистить
          </button>
        )}
      </div>

      <div className="border border-border px-5 py-5">
        <div className="font-head text-[1rem] font-bold uppercase">
          Кто разбирает запросы
        </div>
        <p className="mt-2 max-w-[44em] text-[0.85rem] leading-relaxed text-muted-foreground">
          Сервис, который подбирает товары по смыслу. Распознавание авто по фото
          всегда работает через ChatGPT — Яндекс не умеет читать картинки.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.key}
              onClick={() => chooseProvider(p.key)}
              disabled={saving}
              className={`border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                provider === p.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              }`}
            >
              <div className="font-head text-[0.9rem] font-bold uppercase">
                {p.label}
              </div>
              <div
                className={`mt-1 text-[0.75rem] leading-snug ${
                  provider === p.key
                    ? 'text-primary-foreground/80'
                    : 'text-muted-foreground'
                }`}
              >
                {p.note}
              </div>
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          Пока никто не искал по смыслу
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-6 border-y border-border py-4">
            <div>
              <div className="font-head text-2xl font-bold">{items.length}</div>
              <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                разных запросов
              </div>
            </div>
            <div>
              <div className="font-head text-2xl font-bold">{asked}</div>
              <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                раз искали
              </div>
            </div>
            <div>
              <div className="font-head text-2xl font-bold text-primary">
                {empty.length}
              </div>
              <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                без результата
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 py-5">
            {(
              [
                ['all', `Все — ${items.length}`],
                ['empty', `Ничего не нашлось — ${empty.length}`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`border px-4 py-2 text-[0.78rem] transition-colors ${
                  filter === key
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:border-primary hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="border-t border-foreground">
            {shown.map((q) => (
              <div
                key={q.query}
                className="flex flex-wrap items-center gap-4 border-b border-border py-4"
              >
                <div className="min-w-[220px] flex-1 font-head text-[1rem] font-medium">
                  {q.query}
                </div>
                <div className="text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground">
                  искали {q.hits} раз
                </div>
                <span
                  className={`px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.1em] ${
                    q.found === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground'
                  }`}
                >
                  {q.found === 0 ? 'ничего не нашлось' : `нашлось ${q.found}`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default QueriesPanel;