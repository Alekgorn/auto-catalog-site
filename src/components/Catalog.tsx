import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import ProductCard from '@/components/ProductCard';
import CatalogGroup from '@/components/CatalogGroup';
import CatalogFilters, { FilterState, SortKey } from '@/components/CatalogFilters';
import VehicleDialog from '@/components/VehicleDialog';
import { Vehicle, isCompatible } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  vehicle: Vehicle | null;
  onReset: () => void;
  onChangeVehicle?: (v: Vehicle) => void;
}

const PAGE_SIZE = 15;

/** Высота прилипшей шапки с поисковой строкой */
const HEADER_OFFSET = 150;
const BOTTOM_GAP = 20;

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'По популярности' },
  { key: 'price-asc', label: 'Сначала дешевле' },
  { key: 'price-desc', label: 'Сначала дороже' },
  { key: 'name', label: 'По названию' },
];

const Catalog = ({ vehicle, onReset, onChangeVehicle }: Props) => {
  const { products, categories } = useCatalog();
  const [sort, setSort] = useState<SortKey>('popular');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const bounds = useMemo(() => {
    const prices = products.map((p) => p.price);
    return {
      min: prices.length ? Math.floor(Math.min(...prices) / 100) * 100 : 0,
      max: prices.length ? Math.ceil(Math.max(...prices) / 100) * 100 : 100000,
    };
  }, [products]);

  const emptyState = (): FilterState => ({
    categories: [],
    priceMin: bounds.min,
    priceMax: bounds.max,
    onlyHits: false,
    onlySale: false,
    mounts: [],
    warranties: [],
  });

  const [filters, setFilters] = useState<FilterState>(emptyState);

  useEffect(() => {
    setFilters((f) => ({
      ...f,
      priceMin: f.priceMin === 0 ? bounds.min : Math.max(f.priceMin, bounds.min),
      priceMax: Math.max(f.priceMax, bounds.max) === f.priceMax ? f.priceMax : bounds.max,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.min, bounds.max]);

  const mounts = useMemo(() => {
    const set: string[] = [];
    products.forEach((p) => {
      if (p.mount && !set.includes(p.mount)) set.push(p.mount);
    });
    return set.sort();
  }, [products]);

  const warranties = useMemo(() => {
    const set: string[] = [];
    products.forEach((p) => {
      if (p.warranty && !set.includes(p.warranty)) set.push(p.warranty);
    });
    return set.sort();
  }, [products]);

  // Обычный режим — весь каталог; при выбранном авто работает группировка ниже
  const base = products;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    base.forEach((p) => {
      map[p.category] = (map[p.category] ?? 0) + 1;
    });
    return map;
  }, [base]);

  const list = useMemo(() => {
    const filtered = base.filter((p) => {
      if (filters.categories.length && !filters.categories.includes(p.category))
        return false;
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
      if (filters.onlyHits && p.badge !== 'Хит') return false;
      if (filters.onlySale && !p.oldPrice) return false;
      if (filters.mounts.length && !filters.mounts.includes(p.mount)) return false;
      if (filters.warranties.length && !filters.warranties.includes(p.warranty))
        return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    else
      sorted.sort((a, b) => {
        const ba = a.badge === 'Хит' ? 1 : 0;
        const bb = b.badge === 'Хит' ? 1 : 0;
        if (ba !== bb) return bb - ba;
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      });

    return sorted;
  }, [base, filters, sort]);

  const [shown, setShown] = useState(PAGE_SIZE);

  // Новый набор фильтров — снова показываем первую страницу
  useEffect(() => {
    setShown(PAGE_SIZE);
  }, [filters, sort]);

  const visible = useMemo(() => list.slice(0, shown), [list, shown]);
  const hasMore = shown < list.length;

  // Клик по категории в баннере — отмечаем её в фильтре
  useEffect(() => {
    const onPick = (e: Event) => {
      const category = (e as CustomEvent<string>).detail ?? '';
      // Подбор по авто перекрывает фильтр — сбрасываем его, иначе выбор не виден
      onReset();
      // Пустая категория — показываем весь каталог
      setFilters({ ...emptyState(), categories: category ? [category] : [] });
    };
    window.addEventListener('catalog:filter-category', onPick);
    return () => window.removeEventListener('catalog:filter-category', onPick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.min, bounds.max]);

  const filterRef = useRef<HTMLDivElement>(null);
  const [filterTop, setFilterTop] = useState(HEADER_OFFSET);

  // Фильтр ниже экрана — прижимаем его низом, чтобы дочитать до конца.
  // Помещается целиком — прилипает обычным образом под шапкой.
  useEffect(() => {
    const measure = () => {
      const height = filterRef.current?.offsetHeight ?? 0;
      const free = window.innerHeight - HEADER_OFFSET - BOTTOM_GAP;
      setFilterTop(
        height > free ? window.innerHeight - height - BOTTOM_GAP : HEADER_OFFSET,
      );
    };

    measure();
    window.addEventListener('resize', measure);

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (filterRef.current && observer) observer.observe(filterRef.current);

    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [filters, categories.length, mounts.length, warranties.length]);

  const goToSelection = () => {
    document
      .getElementById('select')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fitCount = vehicle
    ? products.filter((p) => isCompatible(p, vehicle)).length
    : products.length;

  // Подобрана машина — показываем совместимое, разложенное по категориям
  const grouped = useMemo(() => {
    if (!vehicle) return [];
    const map = new Map<string, typeof products>();
    products
      .filter((p) => isCompatible(p, vehicle))
      .forEach((p) => {
        map.set(p.category, [...(map.get(p.category) ?? []), p]);
      });
    return [...map.entries()]
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => {
          const ba = a.badge === 'Хит' ? 1 : 0;
          const bb = b.badge === 'Хит' ? 1 : 0;
          if (ba !== bb) return bb - ba;
          return (b.popularity ?? 0) - (a.popularity ?? 0);
        }),
      }))
      .filter((g) => g.items.length > 0)
      .sort((a, b) => b.items.length - a.items.length);
  }, [products, vehicle]);

  const activeCount =
    filters.categories.length +
    filters.mounts.length +
    filters.warranties.length +
    (filters.onlyHits ? 1 : 0) +
    (filters.onlySale ? 1 : 0) +
    (filters.priceMin > bounds.min || filters.priceMax < bounds.max ? 1 : 0);

  const filtersNode = (
    <CatalogFilters
      state={filters}
      bounds={bounds}
      categories={categories}
      mounts={mounts}
      warranties={warranties}
      counts={counts}
      onChange={setFilters}
      onReset={() => setFilters(emptyState())}
    />
  );

  return (
    <section id="catalog" className="section-pad anchor-offset">
      <div className="rule" />
      <SectionHead
        index="01"
        eyebrow="Каталог оборудования"
        title={
          vehicle
            ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
            : 'Всё оборудование'
        }
        note={
          vehicle ? (
            <>
              <span className="font-head text-lg font-bold uppercase tracking-tight text-foreground">
                Подходит {fitCount} позиций
              </span>
              <span className="mt-2 block">
                Совместимость проверена по штатным разъёмам и посадочному месту.
              </span>
            </>
          ) : (
            'Выберите марку, модель и год выпуска в форме подбора — в списке останется только совместимое оборудование.'
          )
        }
      />

      <div className="rule-hair" />

      {vehicle ? (
        <div className="pb-6">
          {/* Машина видна при прокрутке — сменить её можно, не листая блоки */}
          <div className="sticky top-[76px] z-30 -mx-6 mb-2 border-b border-border bg-surface/95 px-6 py-3 backdrop-blur md:-mx-14 md:px-14 lg:top-[140px]">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <div className="flex min-w-0 items-center gap-3">
                <Icon name="Car" size={18} className="flex-none text-primary" />
                <div className="min-w-0">
                  <div className="eyebrow">Подбор по автомобилю</div>
                  <div className="truncate font-head text-[1.05rem] font-bold uppercase leading-tight tracking-tight">
                    {vehicle.brand} {vehicle.model}
                    <span className="text-muted-foreground"> · {vehicle.year}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-none items-center gap-2">
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-2 border border-foreground px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon name="RefreshCw" size={14} />
                  Сменить автомобиль
                </button>
                <button
                  onClick={onReset}
                  aria-label="Очистить подбор"
                  title="Очистить подбор"
                  className="flex items-center justify-center border border-border p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name="X" size={15} />
                </button>
              </div>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="py-24 text-center">
              <div className="font-head text-2xl font-medium uppercase tracking-tight">
                Под эту машину пока ничего нет
              </div>
              <p className="mx-auto mt-3 max-w-[30em] text-muted-foreground">
                Оставьте заявку — подберём вручную по VIN и предложим аналог.
              </p>
              <button
                onClick={onReset}
                className="mt-6 border border-foreground px-6 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Показать весь каталог
              </button>
            </div>
          ) : (
            <>
              {grouped.map((g) => (
                <CatalogGroup
                  key={g.category}
                  category={g.category}
                  products={g.items}
                  vehicle={vehicle}
                />
              ))}

              <div className="flex flex-col items-center gap-4 border-t border-foreground py-12">
                <p className="max-w-[32em] text-center text-muted-foreground">
                  Показано оборудование для {vehicle.brand} {vehicle.model}{' '}
                  {vehicle.year} года. Сбросьте подбор, чтобы вернуться ко всему
                  каталогу с фильтрами.
                </p>
                <button
                  onClick={onReset}
                  className="flex items-center justify-center gap-3 border-2 border-foreground px-8 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon name="RotateCcw" size={17} />
                  Очистить подбор
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-12">
        <aside className="hidden self-start lg:col-span-3 lg:block">
          {/*
            Фильтр едет вместе с каталогом. Если он выше экрана — прилипает,
            когда показался последний пункт, и дальше листается только каталог.
          */}
          <div
            ref={filterRef}
            style={{ top: filterTop }}
            className="sticky my-6 bg-surface p-5 shadow-panel"
          >
            {filtersNode}
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center gap-2 border border-foreground px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary lg:hidden"
              >
                <Icon name="SlidersHorizontal" size={15} />
                Фильтры
                {activeCount > 0 && (
                  <span className="bg-primary px-1.5 text-[0.65rem] text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </button>
              <span className="text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground">
                Найдено: {list.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="cursor-pointer border border-border bg-transparent px-3 py-2 text-[0.78rem] uppercase tracking-[0.08em] outline-none transition-colors focus:border-primary"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rule-hair" />

          {list.length === 0 ? (
            <div className="py-24 text-center">
              <div className="font-head text-2xl font-medium uppercase tracking-tight">
                Ничего не нашлось
              </div>
              <p className="mx-auto mt-3 max-w-[28em] text-muted-foreground">
                Попробуйте снять часть фильтров или расширить диапазон цены. Если нужной
                позиции нет — оставьте заявку, подберём вручную.
              </p>
              <button
                onClick={() => setFilters(emptyState())}
                className="mt-6 border border-foreground px-6 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 py-12 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} vehicle={vehicle} />
                ))}
              </div>

              {hasMore && (
                <div className="flex flex-col items-center gap-5 pb-12">
                  <p className="text-[0.82rem] uppercase tracking-[0.1em] text-muted-foreground">
                    Показано {visible.length} из {list.length}
                  </p>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                      onClick={() => setShown((n) => n + PAGE_SIZE)}
                      className="flex items-center justify-center gap-3 border-2 border-foreground px-8 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon name="Plus" size={17} />
                      Загрузить ещё
                    </button>
                    <button
                      onClick={() =>
                        onChangeVehicle ? setPickerOpen(true) : goToSelection()
                      }
                      className="flex items-center justify-center gap-3 bg-primary px-8 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground"
                    >
                      <Icon name="Car" size={17} />
                      Подобрать под автомобиль
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}

      {mobileOpen && !vehicle && (
        <div className="fixed inset-0 z-[60] flex lg:hidden">
          <button
            aria-label="Закрыть"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-foreground/40"
          />
          <div className="w-[85%] max-w-sm overflow-y-auto border-l border-border bg-surface px-6 py-5">
            <button
              onClick={() => setMobileOpen(false)}
              className="mb-2 flex w-full items-center justify-between font-head text-lg font-bold uppercase"
            >
              Фильтры
              <Icon name="X" size={20} />
            </button>
            {filtersNode}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-6 flex w-full items-center justify-between bg-foreground px-6 py-4 font-head text-[0.85rem] font-bold uppercase text-background"
            >
              Показать {list.length}
              <Icon name="ArrowRight" size={17} />
            </button>
          </div>
        </div>
      )}
      <VehicleDialog
        open={pickerOpen}
        vehicle={vehicle}
        onClose={() => setPickerOpen(false)}
        onApply={(v) => onChangeVehicle?.(v)}
      />
    </section>
  );
};

export default Catalog;