import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FitMode } from '@/data/catalog';

interface Row {
  name: string;
  /** Имя до правки — по нему бэкенд переносит товары */
  oldName: string;
  products: number;
  /** Характеристики, общие для товаров этой категории */
  specFields: string[];
  /** Как по умолчанию подбираются товары этой категории */
  fitMode: FitMode;
}

interface Props {
  onSaved: () => void;
}

const CategoriesEditor = ({ onSaved }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [openSpecs, setOpenSpecs] = useState<number | null>(null);

  const load = () => {
    adminFetch('?action=categories')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.categories ?? []) as {
          name: string;
          products: number;
          specFields?: string[];
          fitMode?: FitMode;
        }[];
        setRows(
          list.map((c) => ({
            name: c.name,
            oldName: c.name,
            products: c.products,
            specFields: c.specFields ?? [],
            fitMode: c.fitMode ?? 'universal',
          })),
        );
      })
      .catch(() => undefined);
  };

  useEffect(load, []);

  const setAt = (i: number, patch: Partial<Row>) =>
    setRows((list) => list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };

  /**
   * Переставляет характеристику внутри категории. Порядок в этом списке —
   * порядок строк в карточке товара на сайте, причём в плитку каталога
   * попадают только первые три. Поэтому важное нужно уметь поднять наверх.
   */
  const moveSpec = (i: number, fi: number, dir: -1 | 1) => {
    const fields = rows[i].specFields;
    const j = fi + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[fi], next[j]] = [next[j], next[fi]];
    setAt(i, { specFields: next });
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
        categories: clean.map((r) => ({
          name: r.name.trim(),
          oldName: r.oldName,
          specFields: r.specFields.filter((f) => f.trim()),
          fitMode: r.fitMode,
        })),
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
            onClick={() =>
              setRows((l) => [
                ...l,
                {
                  name: '',
                  oldName: '',
                  products: 0,
                  specFields: [],
                  fitMode: 'universal',
                },
              ])
            }
            className="mt-6 flex items-center gap-2 border border-foreground px-5 py-3 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
          >
            <Icon name="Plus" size={15} />
            Добавить категорию
          </button>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="border-t border-foreground">
            {rows.map((r, i) => (
              <div key={`${r.oldName}-${i}`} className="border-b border-border py-3">
                <div className="flex items-center gap-3">
                <span className="w-7 flex-none font-head text-[0.8rem] text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <input
                  value={r.name}
                  placeholder="Название категории"
                  onChange={(e) => setAt(i, { name: e.target.value })}
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

                <div className="ml-10 mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                    Подбор
                  </span>
                  {(
                    [
                      ['vehicle', 'По машине'],
                      ['universal', 'Любой машине'],
                    ] as [FitMode, string][]
                  ).map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => setAt(i, { fitMode: m })}
                      title={
                        m === 'vehicle'
                          ? 'Товары делаются под конкретную марку, модель и год'
                          : 'Товары подходят любой машине, модели отмечать не нужно'
                      }
                      className={`border px-3 py-1.5 text-[0.78rem] transition-colors ${
                        r.fitMode === m
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="ml-10 mt-2">
                  <button
                    onClick={() => setOpenSpecs(openSpecs === i ? null : i)}
                    className="flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon
                      name={openSpecs === i ? 'ChevronDown' : 'ChevronRight'}
                      size={13}
                    />
                    Характеристики категории
                    {r.specFields.length > 0 && ` · ${r.specFields.length}`}
                  </button>

                  {openSpecs === i && (
                    <div className="mt-3 border-l-2 border-border pl-4">
                      <p className="max-w-[36em] text-[0.8rem] text-muted-foreground">
                        Названия полей для товаров этой категории — например «Экран»,
                        «Память». Значения заполняются в карточке каждого товара.
                        Стрелками меняйте порядок:{' '}
                        <span className="font-medium text-primary">
                          первые три
                        </span>{' '}
                        показываются покупателю прямо в каталоге, остальные —
                        на странице товара.
                      </p>

                      {r.specFields.map((f, fi) => (
                        <div key={fi} className="mt-2 flex items-center gap-2">
                          {/* Номер: первые три строки видны прямо в плитке
                              каталога, поэтому порядок здесь — не косметика */}
                          <span
                            className={`w-5 flex-none text-center font-head text-[0.72rem] ${
                              fi < 3 ? 'text-primary' : 'text-muted-foreground'
                            }`}
                            title={
                              fi < 3
                                ? 'Видно в каталоге'
                                : 'Только на странице товара'
                            }
                          >
                            {fi + 1}
                          </span>
                          <input
                            value={f}
                            placeholder="Название характеристики"
                            onChange={(e) =>
                              setAt(i, {
                                specFields: r.specFields.map((x, xi) =>
                                  xi === fi ? e.target.value : x,
                                ),
                              })
                            }
                            className="min-w-0 flex-1 border-b border-border bg-transparent py-1.5 text-[0.9rem] outline-none transition-colors focus:border-primary"
                          />
                          <button
                            onClick={() => moveSpec(i, fi, -1)}
                            disabled={fi === 0}
                            title="Выше"
                            aria-label="Поднять характеристику"
                            className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                          >
                            <Icon name="ChevronUp" size={15} />
                          </button>
                          <button
                            onClick={() => moveSpec(i, fi, 1)}
                            disabled={fi === r.specFields.length - 1}
                            title="Ниже"
                            aria-label="Опустить характеристику"
                            className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                          >
                            <Icon name="ChevronDown" size={15} />
                          </button>
                          <button
                            onClick={() =>
                              setAt(i, {
                                specFields: r.specFields.filter((_, xi) => xi !== fi),
                              })
                            }
                            aria-label="Убрать"
                            className="p-1 text-muted-foreground transition-colors hover:text-primary"
                          >
                            <Icon name="X" size={15} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => setAt(i, { specFields: [...r.specFields, ''] })}
                        className="mt-3 flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Icon name="Plus" size={13} />
                        Добавить характеристику
                      </button>
                    </div>
                  )}
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