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
  auditKitProducts,
  auditWiring,
  findKitGaps,
} from '@/lib/kit-audit';

interface Props {
  products: AdminProduct[];
  brands: AdminBrand[];
  onEdit: (product: AdminProduct) => void;
  /** Перечитать каталог: правки уходят прямо в карточку проводки */
  onReload?: () => void;
}

type View = 'products' | 'gaps';

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
const KitAuditPanel = ({ products, brands, onEdit, onReload }: Props) => {
  const [view, setView] = useState<View>('products');
  const [onlyActive, setOnlyActive] = useState(true);
  const [rule, setRule] = useState('');
  const [wiringRows, setWiringRows] = useState<VehicleWiring[]>([]);
  const [wires, setWires] = useState<WireOption[]>([]);

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
      })
      .catch(() => undefined);

  useEffect(() => {
    loadWiring();
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
   * Машины без проводки. Режима «Жёстко» больше нет: проводку назначает
   * не строка марки, а привязка к рамке — там же, где её видно.
   * Закрытой считаем машину, у которой проводка отмечена совместимостью.
   */
  const gaps = useMemo(() => findKitGaps(products), [products]);

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
    { id: 'gaps', label: 'Нет пары к рамке', count: gaps.length },
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
        <GapsList
          rows={gaps}
          wires={wires}
          products={products}
          onSaved={() => {
            loadWiring();
            onReload?.();
          }}
        />
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
  products,
  onSaved,
}: {
  rows: KitGapRow[];
  wires: WireOption[];
  /** Каталог целиком — правим совместимость самой проводки */
  products: AdminProduct[];
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
   * Отмечаем машину в самой проводке.
   *
   * Раньше здесь создавалась строка «Жёстко» — она назначала проводку в
   * обход каталога, и товар при этом оставался неразмеченным. Теперь
   * машина дописывается в совместимость проводки: одна правда вместо
   * двух, и видно её прямо в карточке товара.
   */
  const save = async (r: KitGapRow, slug: string) => {
    // Берём товар целиком из каталога: в коротком списке проводок нет
    // совместимости, а править надо именно её
    const wire = products.find((x) => x.slug === slug);
    if (!wire) return;
    const fits = { ...(wire.fits ?? {}) };
    const models: string[] = fits[r.brand] ?? [];
    if (!models.some((m) => m.toLowerCase() === r.model.toLowerCase()))
      fits[r.brand] = [...models, r.model];

    setBusy(true);
    const res = await adminFetch('?action=product', {
      method: 'PUT',
      body: JSON.stringify({ ...wire, fits }),
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
      description: `${r.brand} ${r.model} добавлена в совместимость проводки`,
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
                          onClick={() => save(r, w.slug ?? '')}
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