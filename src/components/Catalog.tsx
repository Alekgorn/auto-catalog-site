import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import ProductCard from '@/components/ProductCard';
import CatalogFilters, { FilterState, SortKey } from '@/components/CatalogFilters';
import { Vehicle, isCompatible } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  vehicle: Vehicle | null;
  onReset: () => void;
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'По популярности' },
  { key: 'price-asc', label: 'Сначала дешевле' },
  { key: 'price-desc', label: 'Сначала дороже' },
  { key: 'name', label: 'По названию' },
];

const Catalog = ({ vehicle, onReset }: Props) => {
  const { products, categories } = useCatalog();
  const [onlyFits, setOnlyFits] = useState(true);
  const [sort, setSort] = useState<SortKey>('popular');
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const base = useMemo(
    () => products.filter((p) => !(vehicle && onlyFits && !isCompatible(p, vehicle))),
    [products, vehicle, onlyFits],
  );

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

    if (vehicle && !onlyFits) {
      sorted.sort(
        (a, b) =>
          Number(isCompatible(b, vehicle)) - Number(isCompatible(a, vehicle)),
      );
    }
    return sorted;
  }, [base, filters, sort, vehicle, onlyFits]);

  const fitCount = vehicle
    ? products.filter((p) => isCompatible(p, vehicle)).length
    : products.length;

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
        title={vehicle ? 'Подходит вашей машине' : 'Всё оборудование'}
        note={
          vehicle
            ? `Для ${vehicle.brand} ${vehicle.model} ${vehicle.year} года подходит ${fitCount} позиций. Совместимость проверена по штатным точкам крепления кузова.`
            : 'Выберите марку, модель и год выпуска в форме подбора — в списке останется только совместимое оборудование.'
        }
      />

      <div className="rule-hair" />

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-[150px] py-6">{filtersNode}</div>
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
              {vehicle && (
                <>
                  <label className="flex cursor-pointer select-none items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-primary"
                      checked={onlyFits}
                      onChange={(e) => setOnlyFits(e.target.checked)}
                    />
                    Только совместимое
                  </label>
                  <button
                    onClick={onReset}
                    className="flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon name="X" size={14} />
                    Сбросить авто
                  </button>
                </>
              )}
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
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-12 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex lg:hidden">
          <button
            aria-label="Закрыть"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-foreground/40"
          />
          <div className="w-[85%] max-w-sm overflow-y-auto border-l border-foreground bg-background px-6 py-5">
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
    </section>
  );
};

export default Catalog;
