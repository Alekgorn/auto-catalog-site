import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface VehicleWiring {
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  mode: 'fixed' | 'select' | '';
  wireSlug: string;
  reason: string;
  ask: Record<string, boolean>;
}

interface WireOption {
  slug: string;
  name: string;
  price: number;
}

interface Props {
  brand: string;
  models: string[];
}

const ASKS: { id: string; label: string }[] = [
  { id: 'amp', label: 'Усилитель' },
  { id: 'camera', label: 'Камера' },
  { id: 'can', label: 'CAN-шина' },
];

const empty = (brand: string, model: string): VehicleWiring => ({
  brand,
  model,
  yearFrom: 1990,
  yearTo: 2100,
  mode: '',
  wireSlug: '',
  reason: '',
  ask: {},
});

/**
 * Подбор проводки для моделей одной марки.
 *
 * «Фиксированный» — проводка известна точно, покупателю вопросов не задаём.
 * «Подбор» — вариантов несколько, и тогда отмечаем, что именно решает выбор.
 * Галка «камера» значит не «в машине есть камера», а «от камеры зависит,
 * какую проводку брать» — иначе спросим человека о том, что ничего не меняет.
 */
const BrandWiringEditor = ({ brand, models }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<string, VehicleWiring>>({});
  const [wires, setWires] = useState<WireOption[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminFetch('?action=vehicle-wiring')
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, VehicleWiring> = {};
        (d.rows || []).forEach((r: VehicleWiring) => {
          if (r.brand === brand) map[r.model] = r;
        });
        setRows(map);
        setWires(d.wires || []);
      })
      .catch(() => undefined);
  }, [brand]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? models.filter((m) => m.toLowerCase().includes(q)) : models;
  }, [models, search]);

  const save = async (model: string, row: VehicleWiring) => {
    setBusy(true);
    const res = await adminFetch('?action=vehicle-wiring', {
      method: 'PUT',
      body: JSON.stringify(row),
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить' });
      return;
    }
    toast({ title: 'Сохранено', description: `${brand} ${model}` });
  };

  const set = (model: string, patch: Partial<VehicleWiring>) =>
    setRows((r) => ({
      ...r,
      [model]: { ...(r[model] ?? empty(brand, model)), ...patch },
    }));

  const done = models.filter((m) => rows[m]?.mode).length;

  if (!models.length) {
    return (
      <p className="text-[0.8rem] text-muted-foreground">
        Сначала добавьте модели этой марки.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="max-w-[42em] text-[0.8rem] leading-relaxed text-muted-foreground">
          «Фиксированный» — на машину идёт одна конкретная проводка, вопросов
          покупателю не будет. «Подбор» — вариантов несколько, отметьте только
          то, что реально решает выбор.
        </p>
        <span className="text-[0.78rem] text-muted-foreground">
          Настроено {done} из {models.length}
        </span>
      </div>

      {models.length > 8 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск модели"
          className="mt-3 w-full max-w-xs border-b border-border bg-transparent py-2 text-sm outline-none transition-colors focus:border-primary"
        />
      )}

      <div className="mt-4 space-y-1">
        {shown.map((model) => {
          const row = rows[model] ?? empty(brand, model);
          const isOpen = open === model;
          return (
            <div key={model} className="border-b border-border pb-1">
              <button
                onClick={() => setOpen(isOpen ? null : model)}
                className="flex w-full items-center gap-2 py-2 text-left transition-colors hover:text-primary"
              >
                <Icon
                  name={isOpen ? 'ChevronDown' : 'ChevronRight'}
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
                <span className="text-sm font-medium">{model}</span>
                {row.mode === 'fixed' && (
                  <span className="text-[0.7rem] uppercase tracking-[0.08em] text-success">
                    · фиксированная
                  </span>
                )}
                {row.mode === 'select' && (
                  <span className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                    · подбор
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="mb-3 space-y-4 border-l-2 border-border py-2 pl-4">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['fixed', 'Фиксированная'],
                        ['select', 'Подбор'],
                        ['', 'Не настроено'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id || 'none'}
                        onClick={() => set(model, { mode: id })}
                        className={`px-4 py-2 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                          row.mode === id
                            ? 'bg-foreground text-background'
                            : 'border border-border hover:border-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="block">
                      <span className="eyebrow mb-1 block">Год от</span>
                      <input
                        type="number"
                        value={row.yearFrom || ''}
                        onChange={(e) =>
                          set(model, { yearFrom: Number(e.target.value) || 1990 })
                        }
                        className="w-24 border-b border-border bg-transparent py-1.5 outline-none focus:border-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="eyebrow mb-1 block">Год по</span>
                      <input
                        type="number"
                        value={row.yearTo === 2100 ? '' : row.yearTo}
                        placeholder="по сей день"
                        onChange={(e) =>
                          set(model, { yearTo: Number(e.target.value) || 2100 })
                        }
                        className="w-28 border-b border-border bg-transparent py-1.5 outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  {row.mode === 'fixed' && (
                    <label className="block">
                      <span className="eyebrow mb-1 block">Проводка</span>
                      <select
                        value={row.wireSlug}
                        onChange={(e) => set(model, { wireSlug: e.target.value })}
                        className="w-full max-w-2xl border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="">— выберите проводку —</option>
                        {wires.map((w) => (
                          <option key={w.slug} value={w.slug}>
                            {w.name} — {w.price} ₽
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {row.mode === 'select' && (
                    <div>
                      <span className="eyebrow mb-1 block">
                        Что влияет на выбор
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ASKS.map((a) => (
                          <button
                            key={a.id}
                            onClick={() =>
                              set(model, {
                                ask: { ...row.ask, [a.id]: !row.ask[a.id] },
                              })
                            }
                            className={`px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                              row.ask[a.id]
                                ? 'bg-foreground text-background'
                                : 'border border-border hover:border-foreground'
                            }`}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {row.mode && (
                    <label className="block">
                      <span className="eyebrow mb-1 block">
                        Обоснование — для своих, покупатель не увидит
                      </span>
                      <textarea
                        value={row.reason}
                        onChange={(e) => set(model, { reason: e.target.value })}
                        rows={2}
                        maxLength={600}
                        placeholder="Для всех комплектаций идёт одна проводка. Проверено по установкам."
                        className="w-full max-w-2xl resize-y border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary"
                      />
                    </label>
                  )}

                  <button
                    onClick={() => save(model, { ...row, brand, model })}
                    disabled={busy}
                    className="bg-foreground px-5 py-2 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-background transition-opacity disabled:opacity-50"
                  >
                    {busy ? 'Сохраняем…' : 'Сохранить'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandWiringEditor;
