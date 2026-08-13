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

/**
 * Что покупатели искали по смыслу. Запросы без результата — прямая подсказка,
 * каких товаров не хватает в каталоге.
 */
const QueriesPanel = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('?action=queries');
      const data = await res.json();
      setItems(data.queries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
