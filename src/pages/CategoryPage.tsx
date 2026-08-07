import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHead from '@/components/SectionHead';
import ProductCard from '@/components/ProductCard';
import CatalogFilters, { FilterState, SortKey } from '@/components/CatalogFilters';
import NotFound from '@/pages/NotFound';
import { useCatalog } from '@/context/CatalogContext';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';
import { slugify } from '@/lib/slug';
import { loadVehicle } from '@/lib/vehicle';
import { formatPrice } from '@/data/catalog';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'По популярности' },
  { key: 'price-asc', label: 'Сначала дешевле' },
  { key: 'price-desc', label: 'Сначала дороже' },
  { key: 'name', label: 'По названию' },
];

/** Каталог одной категории по собственному адресу — чтобы его индексировали. */
const CategoryPage = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { products, categories, loading } = useCatalog();
  const vehicle = loadVehicle();
  const [sort, setSort] = useState<SortKey>('popular');
  const [mobileOpen, setMobileOpen] = useState(false);

  const category = useMemo(
    () => categories.find((c) => slugify(c) === slug) ?? null,
    [categories, slug],
  );

  const items = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category],
  );

  const bounds = useMemo(() => {
    const prices = items.map((p) => p.price);
    return {
      min: prices.length ? Math.floor(Math.min(...prices) / 100) * 100 : 0,
      max: prices.length ? Math.ceil(Math.max(...prices) / 100) * 100 : 100000,
    };
  }, [items]);

  const emptyState = (): FilterState => ({
    categories: category ? [category] : [],
    priceMin: bounds.min,
    priceMax: bounds.max,
    onlyHits: false,
    onlySale: false,
    warranties: [],
  });

  const [filters, setFilters] = useState<FilterState>(emptyState);

  // Сменилась категория или её ценовой диапазон — начинаем фильтр заново
  useEffect(() => {
    setFilters(emptyState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, bounds.min, bounds.max]);

  /**
   * Категории в фильтре переключают страницу: одна выбранная — её адрес,
   * несколько или ни одной — общий каталог. Так фильтр остаётся под рукой.
   */
  const applyFilters = (next: FilterState) => {
    const picked = next.categories;

    if (picked.length === 1 && picked[0] !== category) {
      navigate(`/catalog/${slugify(picked[0])}`);
      return;
    }
    if (picked.length !== 1) {
      window.sessionStorage.setItem('shtatno.filters', JSON.stringify(next));
      navigate('/#catalog');
      return;
    }
    setFilters(next);
  };

  const warranties = useMemo(() => {
    const set: string[] = [];
    items.forEach((p) => {
      if (p.warranty && !set.includes(p.warranty)) set.push(p.warranty);
    });
    return set.sort();
  }, [items]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] ?? 0) + 1;
    });
    return map;
  }, [products]);

  const list = useMemo(() => {
    const filtered = items.filter((p) => {
      if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
      if (filters.onlyHits && p.badge !== 'Хит') return false;
      if (filters.onlySale && !p.oldPrice) return false;
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
  }, [items, filters, sort]);

  const minPrice = items.length ? Math.min(...items.map((p) => p.price)) : 0;

  const activeCount =
    filters.warranties.length +
    (filters.onlyHits ? 1 : 0) +
    (filters.onlySale ? 1 : 0) +
    (filters.priceMin > bounds.min || filters.priceMax < bounds.max ? 1 : 0);

  useSeo(
    category
      ? {
          title: `${category} — купить с доставкой | ШТАТНО`,
          description: `${category}: ${items.length} позиций в наличии${
            minPrice ? `, цены от ${formatPrice(minPrice)}` : ''
          }. Подбор по марке и модели автомобиля, доставка по России.`,
          canonical: `${SITE_URL}/catalog/${slug}`,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category,
            url: `${SITE_URL}/catalog/${slug}`,
            numberOfItems: items.length,
          },
        }
      : null,
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (!category) {
    if (loading || categories.length === 0) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="py-32 text-center text-muted-foreground">Загружаем…</div>
        </div>
      );
    }
    return <NotFound />;
  }

  const filtersNode = (
    <CatalogFilters
      state={filters}
      bounds={bounds}
      categories={categories}
      warranties={warranties}
      counts={counts}
      onChange={applyFilters}
      onReset={() => setFilters(emptyState())}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad">
        <div className="pt-6" />

        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-primary">
            Каталог
          </Link>
          <span>/</span>
          <span className="text-foreground">{category}</span>
        </nav>

        <div className="rule" />
        <SectionHead
          index="01"
          eyebrow="Категория"
          title={category}
          note={`В категории ${items.length} позиций${
            minPrice ? `, цены начинаются от ${formatPrice(minPrice)}` : ''
          }. Подберите оборудование по марке и модели автомобиля — совместимость проверена по штатным разъёмам.`}
        />

        <div className="rule-hair" />

        <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-12">
          <aside className="hidden self-start lg:col-span-3 lg:block">
            <div className="sticky top-[150px] my-6 bg-surface p-5 shadow-panel">
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

            <div className="rule-hair" />

            {list.length === 0 ? (
              <div className="py-24 text-center">
                <div className="font-head text-2xl font-medium uppercase tracking-tight">
                  {items.length === 0 ? 'В категории пока пусто' : 'Ничего не нашлось'}
                </div>
                {items.length > 0 && (
                  <button
                    onClick={() => setFilters(emptyState())}
                    className="mt-6 inline-block border border-foreground px-6 py-3 text-[0.8rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 py-8 sm:gap-6 xl:grid-cols-3">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} vehicle={vehicle} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rule-hair" />

        <div className="py-10">
          <div className="eyebrow">Другие категории</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {categories
              .filter((c) => c !== category)
              .map((c) => (
                <Link
                  key={c}
                  to={`/catalog/${slugify(c)}`}
                  className="border border-border px-4 py-2 text-[0.85rem] transition-colors hover:border-primary hover:text-primary"
                >
                  {c}
                </Link>
              ))}
          </div>
        </div>
      </main>

      {mobileOpen && (
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

      <Footer />
    </div>
  );
};

export default CategoryPage;
