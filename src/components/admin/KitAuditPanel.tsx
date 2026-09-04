import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { VehicleWiring } from '@/lib/wire-pick';
import {
  KIT_RULE_TITLES,
  KitGapRow,
  PeriodRow,
  auditKitProducts,
  auditWiring,
  findGenerationGaps,
  findKitGaps,
} from '@/lib/kit-audit';

interface Props {
  products: AdminProduct[];
  brands: AdminBrand[];
  onEdit: (product: AdminProduct) => void;
}

type View = 'products' | 'wiring' | 'gaps' | 'generations';

/** Проводка из каталога — то, из чего выбираем в разметке */
interface WireOption {
  slug: string;
  sku: string;
  name: string;
  price: number;
}

/**
 * Проверка комплекта: рамки, проводки и разметка подбора.
 *
 * Здесь смотрят на связи между записями, а не внутрь одной карточки:
 * годы в названии против поля, товары без привязки к машине, битые
 * ссылки в разметке и машины, где рамка есть, а проводки нет.
 */
const KitAuditPanel = ({ products, brands, onEdit }: Props) => {
  const { toast } = useToast();
  const [view, setView] = useState<View>('products');
  const [onlyActive, setOnlyActive] = useState(true);
  const [rule, setRule] = useState('');
  const [wiringRows, setWiringRows] = useState<VehicleWiring[]>([]);
  const [wires, setWires] = useState<WireOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [splitting, setSplitting] = useState(false);

  // Разметка подбора живёт в своей таблице — тянем отдельно от товаров
  const loadWiring = () =>
    adminFetch('?action=vehicle-wiring')
      .then((r) => r.json())
      .then((d) => {
        const rows = (d.rows ?? []).map(
          (r: {
            id?: number;
            brand: string;
            model: string;
            yearFrom: number;
            yearTo: number;
            mode: string;
            wireSlug: string;
            ask?: Record<string, boolean>;
            wheel?: string;
            bodies?: string[];
          }) =>
            ({
              ...r,
              years: [r.yearFrom, r.yearTo],
            }) as unknown as VehicleWiring,
        );
        setWiringRows(rows);
        setWires(d.wires ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));

  useEffect(() => {
    loadWiring();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productIssues = useMemo(
    () => auditKitProducts(products, onlyActive),
    [products, onlyActive],
  );

  const wiringIssues = useMemo(
    () => auditWiring(wiringRows, products, brands),
    [wiringRows, products, brands],
  );

  /*
   * Машины без проводки, кроме тех, что уже закрыты разметкой.
   *
   * Разметка «Фиксированный» говорит подбору, какую проводку показать,
   * даже если у самого товара эта машина не отмечена: для Газели это
   * обычный ISO-переходник, размеченный на всю марку. Такая машина уже
   * не дыра, и держать её в списке — значит гонять по кругу.
   */
  const gaps = useMemo(() => {
    const covered = new Set(
      wiringRows
        .filter((r) => r.mode === 'fixed' && r.wireSlug)
        .map((r) => `${r.brand.toLowerCase()}|${r.model.toLowerCase()}`),
    );
    return findKitGaps(products).filter(
      (g) => !covered.has(`${g.brand.toLowerCase()}|${g.model.toLowerCase()}`),
    );
  }, [products, wiringRows]);

  const generations = useMemo(
    () => findGenerationGaps(products, wiringRows),
    [products, wiringRows],
  );

  /**
   * Режем разметку модели по годам рамок.
   *
   * Первый период забирает существующую строку — вместе с уже выбранной
   * проводкой и ответами, чтобы не терять сделанную работу. На остальные
   * заводим новые строки в режиме «Подбор»: какая там проводка, решает
   * человек, а угадывать за него мы не вправе.
   */
  const splitByFrames = async (row: PeriodRow) => {
    const key = `${row.brand.toLowerCase()}|${row.model.toLowerCase()}`;
    const marks = wiringRows.filter(
      (w) => `${w.brand.toLowerCase()}|${w.model.toLowerCase()}` === key,
    );

    /* Рамки делят годы внахлёст: 2006–2011 и 2011–2017 спорят за 2011-й.
       В разметке так нельзя — подбор возьмёт первую попавшуюся строку, и
       владелец машины 2011 года получит проводку наугад. Отдаём спорный
       год следующему периоду: он начинается с новой панели */
    const spans = row.periods.map((p, i) => {
      const next = row.periods[i + 1];
      return { from: p.from, to: next ? Math.min(p.to, next.from - 1) : p.to };
    });

    setSplitting(true);
    let done = 0;
    for (const [i, p] of spans.entries()) {
      // Строка, которая уже стоит на этом периоде — её и правим
      const own =
        marks.find((w) => p.from >= w.years[0] - 1 && p.to <= w.years[1] + 1) ??
        (i === 0 ? marks[0] : undefined);
      const base = own ?? marks[0];

      const res = await adminFetch('?action=vehicle-wiring', {
        method: 'POST',
        body: JSON.stringify({
          // id есть только у первого периода: остальные — новые строки
          id: i === 0 ? base?.id : undefined,
          brand: row.brand,
          model: row.model,
          yearFrom: p.from,
          yearTo: p.to,
          mode: i === 0 ? base?.mode || 'select' : 'select',
          wireSlug: i === 0 ? base?.wireSlug || '' : '',
          reason: i === 0 ? base?.reason || '' : '',
          ask: i === 0 ? base?.ask || {} : {},
          wheel: base?.wheel || '',
          bodies: [],
        }),
      });
      if (res.ok) done += 1;
    }
    setSplitting(false);
    await loadWiring();
    toast({
      title: 'Разбито по рамкам',
      description: `${row.brand} ${row.model}: ${done} ${
        done === 1 ? 'период' : 'периода'
      }. Теперь выберите проводку для каждого.`,
    });
  };

  /** Сколько записей на каждое правило — для кнопок-фильтров */
  const counts = useMemo(() => {
    const list = view === 'products' ? productIssues : wiringIssues;
    const map: Record<string, number> = {};
    list.forEach((i) => {
      map[i.rule] = (map[i.rule] ?? 0) + 1;
    });
    return map;
  }, [view, productIssues, wiringIssues]);

  const shown = useMemo(() => {
    const list = view === 'products' ? productIssues : wiringIssues;
    return rule ? list.filter((i) => i.rule === rule) : list;
  }, [view, rule, productIssues, wiringIssues]);

  const VIEWS: { id: View; label: string; count: number }[] = [
    { id: 'products', label: 'Рамки и проводки', count: productIssues.length },
    { id: 'wiring', label: 'Разметка подбора', count: wiringIssues.length },
    { id: 'gaps', label: 'Нет пары к рамке', count: gaps.length },
    {
      id: 'generations',
      label: 'Годы рамок',
      count: generations.length,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[46em]">
          <p className="text-[0.87rem] leading-relaxed text-muted-foreground">
            Смотрим связи между записями: годы в названии против поля,
            товары без привязки к машине, битые ссылки в разметке подбора
            и машины, где рамка есть, а проводки нет. Ничего не меняется —
            только список того, что стоит посмотреть.
          </p>
        </div>
        {view === 'products' && (
          <button
            onClick={() => setOnlyActive((v) => !v)}
            className="flex flex-none items-center gap-2 border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-foreground"
          >
            <Icon name={onlyActive ? 'SquareCheck' : 'Square'} size={15} />
            Только видимые на сайте
          </button>
        )}
      </div>

      {/* Переключатель между тремя видами проверок */}
      <div className="mt-6 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setView(v.id);
              setRule('');
            }}
            className={`border px-4 py-2 text-[0.78rem] uppercase tracking-[0.08em] transition-colors ${
              view === v.id
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground'
            }`}
          >
            {v.label} ({v.count})
          </button>
        ))}
      </div>

      {view === 'gaps' ? (
        <GapsList rows={gaps} wires={wires} onSaved={loadWiring} />
      ) : view === 'generations' ? (
        <PeriodsList
          rows={generations}
          onSplit={splitByFrames}
          busy={splitting}
        />
      ) : !loaded && view === 'wiring' ? (
        <div className="mt-8 py-10 text-center text-[0.87rem] text-muted-foreground">
          Загружаем разметку…
        </div>
      ) : shown.length === 0 && Object.keys(counts).length === 0 ? (
        <Empty />
      ) : (
        <>
          {/* Фильтр по виду замечания */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            <button
              onClick={() => setRule('')}
              className={`border px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.06em] transition-colors ${
                rule === ''
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground'
              }`}
            >
              Все ({view === 'products' ? productIssues.length : wiringIssues.length})
            </button>
            {Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([key, n]) => (
                <button
                  key={key}
                  onClick={() => setRule(key === rule ? '' : key)}
                  className={`border px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.06em] transition-colors ${
                    rule === key
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  {KIT_RULE_TITLES[key] ?? key} ({n})
                </button>
              ))}
          </div>

          <div className="mt-2">
            {shown.map((issue, i) => {
              const product =
                'product' in issue ? issue.product : undefined;
              return (
                <div
                  key={`${issue.rule}-${issue.title}-${i}`}
                  className="border-b border-border py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      {product ? (
                        <button
                          onClick={() => onEdit(product)}
                          className="text-left font-head text-[0.95rem] font-bold transition-colors hover:text-primary"
                        >
                          {issue.title}
                        </button>
                      ) : (
                        <span className="font-head text-[0.95rem] font-bold">
                          {issue.title}
                        </span>
                      )}
                      {product && (
                        <div className="mt-0.5 text-[0.75rem] text-muted-foreground">
                          {product.category}
                          {product.sku ? ` · ${product.sku}` : ''}
                        </div>
                      )}
                    </div>
                    {product && (
                      <button
                        onClick={() => onEdit(product)}
                        className="flex flex-none items-center gap-1.5 border border-border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] transition-colors hover:border-foreground"
                      >
                        <Icon name="Pencil" size={13} />
                        Открыть
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-start gap-2 text-[0.82rem]">
                    <Icon
                      name={issue.level === 'error' ? 'TriangleAlert' : 'Info'}
                      size={14}
                      className={`mt-0.5 flex-none ${
                        issue.level === 'error'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span className="min-w-0">
                      <span
                        className={
                          issue.level === 'error' ? 'text-foreground' : ''
                        }
                      >
                        {issue.text}
                      </span>
                      {issue.hint && (
                        <span className="block text-[0.76rem] text-muted-foreground">
                          {issue.hint}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const Empty = () => (
  <div className="mt-8 border border-border bg-surface px-6 py-14 text-center">
    <Icon name="CircleCheck" size={30} className="mx-auto text-success" />
    <div className="mt-4 font-head text-lg font-bold uppercase tracking-tight">
      Расхождений нет
    </div>
    <p className="mx-auto mt-2 max-w-[34em] text-[0.87rem] text-muted-foreground">
      Всё сходится.
    </p>
  </div>
);

/**
 * Модели, где разметка проводок грубее деления по рамкам.
 *
 * Показываем периоды рамок и то, что записано в разметке. Кнопка режет
 * разметку по границам рамок: на каждый период появляется своя строка,
 * и дальше в неё выбирают проводку — отдельно для Rio 2006 и Rio 2012.
 */
const PeriodsList = ({
  rows,
  onSplit,
  busy,
}: {
  rows: PeriodRow[];
  onSplit: (row: PeriodRow) => void;
  busy: boolean;
}) => {
  if (!rows.length) return <Empty />;
  return (
    <>
      <div className="mt-5 border-t border-border pt-4 text-[0.82rem] text-muted-foreground">
        Покупатель сначала выбирает рамку — и тем самым говорит, какая у
        него машина и каких годов. Здесь модели, где на несколько периодов
        рамок приходится одна строка разметки: Rio 2006 (камеры не бывает,
        проводка одна) и Rio 2012 (камера возможна, вариантов несколько)
        получают один и тот же ответ. Кнопка режет разметку по годам рамок,
        дальше в каждую строку выбираете проводку.
      </div>
      <div className="mt-2">
        {rows.map((r) => (
          <div
            key={`${r.brand}-${r.model}`}
            className="border-b border-border py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="font-head text-[0.92rem] font-bold">
                {r.brand} {r.model}
                <span className="ml-2 font-body text-[0.75rem] font-normal uppercase tracking-[0.06em] text-primary">
                  периодов в одной строке: {r.worst}
                </span>
              </div>
              <button
                disabled={busy}
                onClick={() => onSplit(r)}
                className="flex flex-none items-center gap-1.5 border border-foreground px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                <Icon name="Scissors" size={13} />
                Разбить по рамкам
              </button>
            </div>

            <div className="mt-2 grid gap-x-6 gap-y-1 text-[0.8rem] sm:grid-cols-[9.5rem_1fr]">
              <span className="text-muted-foreground">Рамки делят на</span>
              <span className="flex flex-wrap gap-x-5 gap-y-3">
                {r.periods.map((p) => (
                  <span key={`${p.from}-${p.to}`} className="block">
                    {p.from}–{p.to}
                    <span className="ml-1 text-[0.72rem] text-muted-foreground">
                      {p.frames} шт
                    </span>
                    {/* Фото решают то, чего не решают годы: две рамки
                        рядом — и сразу видно, что панели разные */}
                    {p.images.length > 0 && (
                      <span className="mt-1 flex gap-1">
                        {p.images.map((src) => (
                          <img
                            key={src}
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 flex-none border border-border bg-card object-contain p-0.5"
                          />
                        ))}
                      </span>
                    )}
                  </span>
                ))}
              </span>
              <span className="text-muted-foreground">Сейчас в разметке</span>
              <span>{r.covered.join(' · ')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/**
 * Машины, под которые есть рамка, но нет проводки.
 *
 * Закрываем дыру не новым товаром, а строкой разметки: почти всегда
 * подходящая проводка в каталоге уже есть, просто она размечена на всю
 * марку и на конкретной машине не отмечена. Для Газели это обычный
 * ISO-переходник — выбрали из списка, и подбор начал его показывать.
 */
const GapsList = ({
  rows,
  wires,
  onSaved,
}: {
  rows: KitGapRow[];
  wires: WireOption[];
  onSaved: () => void;
}) => {
  const { toast } = useToast();
  /** Какая машина сейчас раскрыта для выбора */
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  if (!rows.length) return <Empty />;

  const rowKey = (r: KitGapRow) => `${r.brand}|${r.model}|${r.yearFrom}`;

  /**
   * Записываем строку разметки.
   *
   * fixed со slug — «для этой машины вот эта проводка», select без него —
   * «вариантов несколько, показать все подходящие».
   */
  const save = async (r: KitGapRow, mode: 'fixed' | 'select', slug = '') => {
    setBusy(true);
    const res = await adminFetch('?action=vehicle-wiring', {
      method: 'POST',
      body: JSON.stringify({
        brand: r.brand,
        model: r.model,
        yearFrom: r.yearFrom || 1990,
        yearTo: r.yearTo || 2100,
        mode,
        wireSlug: slug,
        reason: '',
        ask: {},
        wheel: '',
        bodies: [],
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить' });
      return;
    }
    setOpen(null);
    setSearch('');
    onSaved();
    toast({
      title: 'Сохранено',
      description: `${r.brand} ${r.model}: ${
        mode === 'fixed' ? 'проводка выбрана' : 'показываем все подходящие'
      }`,
    });
  };

  const shownWires = search.trim()
    ? wires.filter((w) =>
        `${w.name} ${w.sku}`.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : wires;

  return (
    <>
      <div className="mt-5 border-t border-border pt-4 text-[0.82rem] text-muted-foreground">
        Под эти машины рамка в каталоге есть, а проводки нет — покупатель
        дойдёт до второго шага и остановится. Выберите готовую проводку из
        каталога: чаще всего подходит переходник, размеченный на всю марку.
      </div>
      <div className="mt-2">
        {rows.map((r) => {
          const id = rowKey(r);
          const isOpen = open === id;
          return (
            <div key={id} className="border-b border-border py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <div className="font-head text-[0.92rem] font-bold">
                    {r.brand} {r.model}
                    <span className="ml-2 font-body text-[0.78rem] font-normal text-muted-foreground">
                      {r.yearFrom || '?'}–{r.yearTo || '?'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[0.76rem] text-muted-foreground">
                    {r.example}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpen(isOpen ? null : id);
                    setSearch('');
                  }}
                  className={`flex flex-none items-center gap-1.5 border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                    isOpen
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-foreground hover:bg-foreground hover:text-background'
                  }`}
                >
                  <Icon name={isOpen ? 'X' : 'Plus'} size={13} />
                  {isOpen ? 'Закрыть' : 'Указать проводку'}
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Поиск по названию или артикулу"
                      className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-[0.82rem] outline-none focus:border-foreground"
                    />
                    <button
                      disabled={busy}
                      onClick={() => save(r, 'select')}
                      className="flex-none border border-border px-3 py-2 text-[0.72rem] uppercase tracking-[0.08em] transition-colors hover:border-foreground disabled:opacity-50"
                    >
                      Показать все подходящие
                    </button>
                  </div>

                  <div className="mt-3 max-h-[19rem] overflow-y-auto">
                    {shownWires.length === 0 ? (
                      <div className="py-6 text-center text-[0.8rem] text-muted-foreground">
                        Ничего не нашлось
                      </div>
                    ) : (
                      shownWires.map((w) => (
                        <button
                          key={w.slug}
                          disabled={busy}
                          onClick={() => save(r, 'fixed', w.slug)}
                          className="flex w-full items-baseline justify-between gap-4 border-b border-border py-2 text-left transition-colors hover:text-primary disabled:opacity-50"
                        >
                          <span className="min-w-0 text-[0.82rem]">
                            {w.name}
                            {w.sku && (
                              <span className="ml-2 text-[0.72rem] text-muted-foreground">
                                {w.sku}
                              </span>
                            )}
                          </span>
                          <span className="flex-none text-[0.78rem] text-muted-foreground">
                            {w.price ? `${w.price.toLocaleString('ru')} ₽` : ''}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default KitAuditPanel;