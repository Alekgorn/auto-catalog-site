import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Row {
  name: string;
  /** Имя до правки — по нему бэкенд переносит товары */
  oldName: string;
  products: number;
}

interface Props {
  onSaved: () => void;
}

const CategoriesEditor = ({ onSaved }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    adminFetch('?action=categories')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.categories ?? []) as { name: string; products: number }[];
        setRows(list.map((c) => ({ name: c.name, oldName: c.name, products: c.products })));
      })
      .catch(() => undefined);
  };

  useEffect(load, []);

  const setAt = (i: number, name: string) =>
    setRows((list) => list.map((r, idx) => (idx === i ? { ...r, name } : r)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  const remove = (i: number) => {
    const row = rows[i];
    if (row.products > 0) {
      toast({
        title: 'Сначала перенесите товары',
        description: `В категории «${row.name}» ещё ${row.products} товаров`,
      });
      return;
    }
    setRows((list) => list.filter((_, x) => x !== i));
  };

  const save = async () => {
    const clean = rows.filter((r) => r.name.trim());
    const names = clean.map((r) => r.name.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      toast({ title: 'Названия повторяются', description: 'Сделайте их разными' });
      return;
    }
    setBusy(true);
    const res = await adminFetch('?action=categories', {
      method: 'PUT',
      body: JSON.stringify({
        categories: clean.map((r) => ({ name: r.name.trim(), oldName: r.oldName })),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить' });
      return;
    }
    toast({ title: 'Сохранено', description: 'Категории обновлены' });
    load();
    onSaved();
  };

  const total = rows.reduce((n, r) => n + r.products, 0);

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="eyebrow">Каталог</div>
          <h2 className="mt-3 font-head text-2xl font-bold uppercase tracking-[-0.02em]">
            Категории товаров
          </h2>
          <p className="mt-4 max-w-[32em] text-muted-foreground">
            Порядок в этом списке — порядок в фильтре на сайте. Переименуете
            категорию — все её товары переедут автоматически.
          </p>
          <p className="mt-4 text-[0.85rem] text-muted-foreground">
            Всего {rows.length} категорий, {total} товаров.
          </p>

          <button
            onClick={() => setRows((l) => [...l, { name: '', oldName: '', products: 0 }])}
            className="mt-6 flex items-center gap-2 border border-foreground px-5 py-3 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
          >
            <Icon name="Plus" size={15} />
            Добавить категорию
          </button>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="border-t border-foreground">
            {rows.map((r, i) => (
              <div
                key={`${r.oldName}-${i}`}
                className="flex items-center gap-3 border-b border-border py-3"
              >
                <span className="w-7 flex-none font-head text-[0.8rem] text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <input
                  value={r.name}
                  placeholder="Название категории"
                  onChange={(e) => setAt(i, e.target.value)}
                  className="min-w-0 flex-1 border-b border-transparent bg-transparent py-1.5 text-[0.95rem] outline-none transition-colors focus:border-primary"
                />

                <span className="flex-none text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                  {r.products} тов.
                </span>

                <div className="flex flex-none items-center">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Выше"
                    className="p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                  >
                    <Icon name="ChevronUp" size={16} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === rows.length - 1}
                    title="Ниже"
                    className="p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                  >
                    <Icon name="ChevronDown" size={16} />
                  </button>
                  <button
                    onClick={() => remove(i)}
                    title="Удалить"
                    className="p-1 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={save}
            disabled={busy}
            className="mt-8 flex items-center gap-3 bg-primary px-8 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground disabled:opacity-60"
          >
            <Icon name="Check" size={17} />
            {busy ? 'Сохраняем…' : 'Сохранить категории'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesEditor;
