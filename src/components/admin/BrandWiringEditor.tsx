import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { BODY_TYPES, BodyType } from '@/data/catalog';

export interface VehicleWiring {
  id?: number;
  brand: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  mode: 'fixed' | 'select';
  wireSlug: string;
  reason: string;
  ask: Record<string, boolean>;
  /** Сторона руля машины. Пусто — встречаются оба варианта */
  wheel?: '' | 'left' | 'right';
  /** Кузова этого поколения. Пусто — любой */
  bodies?: BodyType[];
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

const ASKS = [
  { id: 'amp', label: 'Усилитель' },
  { id: 'camera', label: 'Камера' },
  { id: 'can', label: 'CAN-шина' },
];

const blank = (brand: string, model: string): VehicleWiring => ({
  brand,
  model,
  yearFrom: 1990,
  yearTo: 2100,
  mode: 'select',
  wireSlug: '',
  reason: '',
  ask: {},
  wheel: '',
  bodies: [],
});

/** Годы поколения строкой: «2006–2011», «2012+», «все годы» */
const yearsLabel = (r: VehicleWiring): string => {
  const from = r.yearFrom > 1990 ? r.yearFrom : null;
  const to = r.yearTo < 2100 ? r.yearTo : null;
  if (from && to) return `${from}–${to}`;
  if (from) return `${from}+`;
  if (to) return `до ${to}`;
  return 'все годы';
};

/**
 * Подбор проводки по поколениям машины.
 *
 * У модели их бывает несколько, и проводки у них разные: Civic до 2011 —
 * хэтчбек, после — седан. Поэтому строк на модель может быть сколько
 * угодно, и кузов задаётся тут же, рядом с годами: отдельно от годов он
 * теряет смысл.
 */
const BrandWiringEditor = ({ brand, models }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<VehicleWiring[]>([]);
  const [wires, setWires] = useState<WireOption[]>([]);
  const [openModel, setOpenModel] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, VehicleWiring>>({});
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const load = () =>
    adminFetch('?action=vehicle-wiring')
      .then((r) => r.json())
      .then((d) => {
        setRows((d.rows || []).filter((r: VehicleWiring) => r.brand === brand));
        setWires(d.wires || []);
      })
      .catch(() => undefined);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? models.filter((m) => m.toLowerCase().includes(q)) : models;
  }, [models, search]);

  const byModel = (model: string) => rows.filter((r) => r.model === model);

  /** Ключ черновика: id строки либо «модель:new» для новой */
  const key = (model: string, id?: number) => `${model}:${id ?? 'new'}`;

  const edit = (
    model: string,
    row: VehicleWiring,
    patch: Partial<VehicleWiring>,
  ) =>
    setDraft((d) => ({
      ...d,
      [key(model, row.id)]: { ...(d[key(model, row.id)] ?? row), ...patch },
    }));

  const current = (model: string, row: VehicleWiring) =>
    draft[key(model, row.id)] ?? row;

  const save = async (model: string, row: VehicleWiring) => {
    setBusy(true);
    const res = await adminFetch('?action=vehicle-wiring', {
      method: row.id ? 'PUT' : 'POST',
      body: JSON.stringify({ ...row, brand, model }),
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить' });
      return;
    }
    setDraft((d) => {
      const next = { ...d };
      delete next[key(model, row.id)];
      return next;
    });
    await load();
    toast({ title: 'Сохранено', description: `${brand} ${model}` });
  };

  const remove = async (model: string, id?: number) => {
    if (!id) {
      setDraft((d) => {
        const next = { ...d };
        delete next[key(model, undefined)];
        return next;
      });
      return;
    }
    setBusy(true);
    await adminFetch('?action=vehicle-wiring', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    await load();
    toast({ title: 'Удалено' });
  };

  const done = models.filter((m) => byModel(m).length).length;

  if (!models.length) {
    return (
      <p className="text-[0.8rem] text-muted-foreground">
        Сначала добавьте модели этой марки.
      </p>
    );
  }

  /** Форма одного поколения */
  const Form = ({ model, row }: { model: string; row: VehicleWiring }) => {
    const r = current(model, row);
    return (
      <div className="space-y-4 border-l-2 border-border py-3 pl-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['fixed', 'Фиксированная'],
              ['select', 'Подбор'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => edit(model, row, { mode: id })}
              className={`px-4 py-2 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                r.mode === id
                  ? 'bg-foreground text-background'
                  : 'border border-border hover:border-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="eyebrow mb-1 block">Год от</span>
            <input
              type="number"
              value={r.yearFrom > 1990 ? r.yearFrom : ''}
              placeholder="любой"
              onChange={(e) =>
                edit(model, row, { yearFrom: Number(e.target.value) || 1990 })
              }
              className="w-24 border-b border-border bg-transparent py-1.5 outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-1 block">Год по</span>
            <input
              type="number"
              value={r.yearTo < 2100 ? r.yearTo : ''}
              placeholder="по сей день"
              onChange={(e) =>
                edit(model, row, { yearTo: Number(e.target.value) || 2100 })
              }
              className="w-28 border-b border-border bg-transparent py-1.5 outline-none focus:border-primary"
            />
          </label>
        </div>

        <div>
          <span className="eyebrow mb-1 block">Кузов — пусто значит любой</span>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPES.map((b) => {
              const on = (r.bodies || []).includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() =>
                    edit(model, row, {
                      bodies: on
                        ? (r.bodies || []).filter((x) => x !== b.id)
                        : [...(r.bodies || []), b.id],
                    })
                  }
                  className={`px-3 py-1.5 font-head text-[0.68rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    on
                      ? 'bg-foreground text-background'
                      : 'border border-border hover:border-foreground'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="eyebrow mb-1 block">Руль</span>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['', 'Любой'],
                ['left', 'Левый'],
                ['right', 'Правый'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id || 'any'}
                onClick={() => edit(model, row, { wheel: id })}
                className={`px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                  (r.wheel || '') === id
                    ? 'bg-foreground text-background'
                    : 'border border-border hover:border-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {r.mode === 'fixed' && (
          <label className="block">
            <span className="eyebrow mb-1 block">Проводка</span>
            <select
              value={r.wireSlug}
              onChange={(e) => edit(model, row, { wireSlug: e.target.value })}
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

        {r.mode === 'select' && (
          <div>
            <span className="eyebrow mb-1 block">Что влияет на выбор</span>
            <div className="flex flex-wrap gap-2">
              {ASKS.map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    edit(model, row, {
                      ask: { ...r.ask, [a.id]: !r.ask[a.id] },
                    })
                  }
                  className={`px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    r.ask[a.id]
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

        <label className="block">
          <span className="eyebrow mb-1 block">
            Обоснование — увидит покупатель, если у проводки нет своего текста
          </span>
          <textarea
            value={r.reason}
            onChange={(e) => edit(model, row, { reason: e.target.value })}
            rows={2}
            maxLength={600}
            placeholder="Только этот интерфейс сохраняет штатный климат-контроль."
            className="w-full max-w-2xl resize-y border-b border-border bg-transparent py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => save(model, r)}
            disabled={busy}
            className="bg-foreground px-5 py-2 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-background transition-opacity disabled:opacity-50"
          >
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
          <button
            onClick={() => remove(model, row.id)}
            disabled={busy}
            className="border border-border px-4 py-2 font-head text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Удалить
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="max-w-[42em] text-[0.8rem] leading-relaxed text-muted-foreground">
          У модели может быть несколько поколений с разными проводками — Civic
          до 2011 хэтчбек, после седан. Добавляйте столько строк, сколько
          нужно: годы и кузов задаются вместе.
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
          const list = byModel(model);
          const isOpen = openModel === model;
          const newDraft = draft[key(model, undefined)];
          return (
            <div key={model} className="border-b border-border pb-1">
              <button
                onClick={() => setOpenModel(isOpen ? null : model)}
                className="flex w-full items-center gap-2 py-2 text-left transition-colors hover:text-primary"
              >
                <Icon
                  name={isOpen ? 'ChevronDown' : 'ChevronRight'}
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
                <span className="text-sm font-medium">{model}</span>
                {list.length > 0 && (
                  <span className="text-[0.7rem] uppercase tracking-[0.08em] text-success">
                    · {list.length}{' '}
                    {list.length === 1 ? 'поколение' : 'поколения'}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="mb-3 space-y-3">
                  {list.map((row) => (
                    <div key={row.id}>
                      <div className="flex flex-wrap items-center gap-2 pl-4 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground">
                        <Icon name="Calendar" size={13} />
                        {yearsLabel(current(model, row))}
                        {(current(model, row).bodies || []).length > 0 && (
                          <span>
                            ·{' '}
                            {(current(model, row).bodies || [])
                              .map(
                                (b) =>
                                  BODY_TYPES.find((x) => x.id === b)?.label ??
                                  b,
                              )
                              .join(', ')}
                          </span>
                        )}
                        <span
                          className={
                            current(model, row).mode === 'fixed'
                              ? 'text-success'
                              : ''
                          }
                        >
                          ·{' '}
                          {current(model, row).mode === 'fixed'
                            ? 'фиксированная'
                            : 'подбор'}
                        </span>
                      </div>
                      <Form model={model} row={row} />
                    </div>
                  ))}

                  {newDraft && (
                    <div>
                      <div className="pl-4 text-[0.75rem] uppercase tracking-[0.08em] text-primary">
                        Новое поколение
                      </div>
                      <Form model={model} row={blank(brand, model)} />
                    </div>
                  )}

                  {!newDraft && (
                    <button
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          [key(model, undefined)]: blank(brand, model),
                        }))
                      }
                      className="ml-4 flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="Plus" size={14} />
                      Добавить поколение
                    </button>
                  )}
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
