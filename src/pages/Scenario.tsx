import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import VehicleFilterBar from '@/components/VehicleFilterBar';
import { Vehicle, matchVehicle } from '@/data/catalog';
import { SCENARIOS, findScenario } from '@/data/scenarios';
import { loadVehicle, saveVehicle } from '@/lib/vehicle';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';
import { useCatalog } from '@/context/CatalogContext';
import { smartSearch } from '@/lib/smart-search';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'по совпадению' },
  { key: 'price-asc', label: 'сначала дешёвые' },
  { key: 'price-desc', label: 'сначала дорогие' },
  { key: 'name', label: 'по названию' },
];

const PAGE_SIZE = 12;

const ScenarioPage = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { products, brands, loading } = useCatalog();
  const scenario = findScenario(slug);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [category, setCategory] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => setVehicle(loadVehicle()), []);
  useEffect(() => {
    setShown(PAGE_SIZE);
    setCategory('');
    window.scrollTo({ top: 0 });
  }, [slug]);

  const found = useMemo(
    () => (scenario ? smartSearch(products, scenario.query) : []),
    [products, scenario],
  );

  /** Подбор по машине: совместимые плюс универсальные товары */
  const hits = useMemo(() => {
    if (!vehicle) return found;
    return found.filter(
      (h) => matchVehicle(h.product, vehicle, brands.length) !== null,
    );
  }, [found, vehicle, brands.length]);

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    hits.forEach((h) => {
      map[h.product.category] = (map[h.product.category] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [hits]);

  const list = useMemo(() => {
    let out = category
      ? hits.filter((h) => h.product.category === category)
      : hits;
    if (sort !== 'relevance') {
      out = [...out].sort((a, b) => {
        if (sort === 'price-asc') return a.product.price - b.product.price;
        if (sort === 'price-desc') return b.product.price - a.product.price;
        return a.product.name.localeCompare(b.product.name, 'ru');
      });
    }
    return out;
  }, [hits, category, sort]);

  useSeo(
    scenario
      ? {
          title: `${scenario.heading} · ШТАТНО`,
          description: scenario.intro.slice(0, 300),
          canonical: `${SITE_URL}/scenario/${scenario.slug}`,
        }
      : { title: 'Сценарий не найден · ШТАТНО' },
  );

  const applyVehicle = (v: Vehicle) => {
    setVehicle(v);
    saveVehicle(v);
    setShown(PAGE_SIZE);
  };

  const resetVehicle = () => {
    setVehicle(null);
    saveVehicle(null);
    setShown(PAGE_SIZE);
  };

  if (!scenario) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="section-pad py-24 text-center">
          <div className="font-head text-2xl font-bold">Сценарий не найден</div>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.1em] text-background transition-colors hover:bg-primary"
          >
            На главную
            <Icon name="ArrowRight" size={15} />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const others = SCENARIOS.filter((s) => s.slug !== scenario.slug).slice(0, 4);
  const visible = list.slice(0, shown);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="section-pad">
        <div className="flex flex-wrap items-center gap-2 py-6 text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-primary">
            Главная
          </Link>
          <Icon name="ChevronRight" size={13} />
          <Link to="/#scenarios" className="transition-colors hover:text-primary">
            Сценарии
          </Link>
          <Icon name="ChevronRight" size={13} />
          <span className="text-foreground">{scenario.heading}</span>
        </div>

        <div className="rule" />

        {/* Заголовок и живой текст */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 py-9 md:grid-cols-12 md:py-12">
          <div className="md:col-span-7">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center border border-foreground bg-primary text-primary-foreground">
                <Icon name={scenario.icon} fallback="CircleAlert" size={24} />
              </span>
              <div className="eyebrow">«{scenario.title}»</div>
            </div>

            <h1 className="mt-5 font-head text-3xl font-bold uppercase leading-[1.05] tracking-tight md:text-[46px]">
              {scenario.heading}
            </h1>
          </div>

          <div className="md:col-span-5">
            <p className="text-[0.98rem] leading-relaxed text-muted-foreground">
              {scenario.intro}
            </p>
          </div>
        </div>

        {/* Что входит в решение */}
        <div className="rule-hair" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 py-8 md:grid-cols-3">
          {scenario.steps.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <span className="font-head text-2xl font-bold text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="font-head text-[1.02rem] font-bold tracking-tight">
                  {step.title}
                </div>
                <p className="mt-1.5 text-[0.87rem] leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rule-hair" />

        {/* Подбор по машине */}
        <div className="py-6">
          <VehicleFilterBar
            vehicle={vehicle}
            onApply={applyVehicle}
            onReset={resetVehicle}
            count={hits.length}
          />
          {vehicle && found.length > hits.length && (
            <p className="mt-2 text-[0.78rem] text-muted-foreground">
              Скрыто несовместимых: {found.length - hits.length}. Универсальные
              товары остаются в списке.
            </p>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            Загружаем каталог…
          </div>
        ) : hits.length === 0 ? (
          <div className="py-16 text-center">
            <div className="font-head text-xl font-bold">
              Под эту машину пока ничего нет
            </div>
            <p className="mx-auto mt-3 max-w-[34em] text-[0.9rem] leading-relaxed text-muted-foreground">
              Сбросьте подбор, чтобы посмотреть всё по сценарию, или позвоните —
              привезём под заказ.
            </p>
            <button
              onClick={resetVehicle}
              className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.1em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Показать всё по сценарию
              <Icon name="ArrowRight" size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
                Подходит товаров: {list.length}
              </div>
              <label className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
                Сортировка
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="border border-border bg-surface px-3 py-2 text-[0.8rem] normal-case tracking-normal text-foreground outline-none transition-colors hover:border-primary"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 pb-6">
                <button
                  onClick={() => setCategory('')}
                  className={`border px-3.5 py-2 text-[0.78rem] transition-colors ${
                    category
                      ? 'border-border bg-surface hover:border-primary hover:text-primary'
                      : 'border-foreground bg-foreground text-background'
                  }`}
                >
                  Все ({hits.length})
                </button>
                {categories.map(([c, n]) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`border px-3.5 py-2 text-[0.78rem] transition-colors ${
                      category === c
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-surface hover:border-primary hover:text-primary'
                    }`}
                  >
                    {c} ({n})
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pb-8 md:gap-4 lg:grid-cols-3">
              {visible.map((h) => (
                <ProductCard
                  key={h.product.id}
                  product={h.product}
                  vehicle={vehicle}
                />
              ))}
            </div>

            {shown < list.length && (
              <div className="pb-10 text-center">
                <button
                  onClick={() => setShown((s) => s + PAGE_SIZE)}
                  className="border border-foreground px-6 py-3 text-[0.8rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
                >
                  Показать ещё
                </button>
              </div>
            )}
          </>
        )}

        {scenario.hint && (
          <>
            <div className="rule-hair" />
            <p className="flex items-start gap-3 py-6 text-[0.88rem] leading-relaxed text-muted-foreground">
              <Icon
                name="Info"
                size={17}
                className="mt-0.5 flex-none text-primary"
              />
              {scenario.hint}
            </p>
          </>
        )}

        {/* Другие сценарии */}
        <div className="rule-hair" />
        <div className="py-8">
          <div className="eyebrow">Другие задачи</div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((s) => (
              <button
                key={s.slug}
                onClick={() => navigate(`/scenario/${s.slug}`)}
                className="group flex h-full flex-col border border-border bg-surface p-4 text-left transition-colors hover:border-primary"
              >
                <Icon
                  name={s.icon}
                  fallback="CircleAlert"
                  size={20}
                  className="text-primary"
                />
                <span className="mt-3 block font-head text-[0.95rem] font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                  «{s.title}»
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ScenarioPage;
