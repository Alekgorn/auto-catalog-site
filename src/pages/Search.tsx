import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import VehicleFilterBar from "@/components/VehicleFilterBar";
import { Vehicle, matchVehicle, splitByFit } from "@/data/catalog";
import UniversalDivider from "@/components/UniversalDivider";
import FloatingFilters from "@/components/FloatingFilters";
import { VEHICLE_EVENT, loadVehicle, saveVehicle } from "@/lib/vehicle";
import { SITE_URL } from "@/lib/seo";
import { slugify } from "@/lib/slug";
import { useSeo } from "@/hooks/use-seo";
import { useCatalog } from "@/context/CatalogContext";
import { describeQuery, parseQuery, smartSearch } from "@/lib/smart-search";
import Breadcrumbs from "@/components/Breadcrumbs";
import YearPrompt from "@/components/YearPrompt";

type SortKey = "relevance" | "price-asc" | "price-desc" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "по совпадению" },
  { key: "price-asc", label: "сначала дешёвые" },
  { key: "price-desc", label: "сначала дорогие" },
  { key: "name", label: "по названию" },
];

const PAGE_SIZE = 12;

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const { products, brands, loading } = useCatalog();

  const [input, setInput] = useState(query);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => setInput(query), [query]);
  /* Машину могли сменить или сбросить плашкой в шапке — следим за этим */
  useEffect(() => {
    const sync = () => setVehicle(loadVehicle());
    sync();
    window.addEventListener(VEHICLE_EVENT, sync);
    return () => window.removeEventListener(VEHICLE_EVENT, sync);
  }, []);
  useEffect(() => {
    setShown(PAGE_SIZE);
    setCategory("");
  }, [query]);

  const found = useMemo(
    () => smartSearch(products, query, undefined, brands),
    [products, query, brands],
  );

  /**
   * Подбор по машине: оставляем совместимые товары и универсальные —
   * те, что подходят почти любому авто.
   */
  const hits = useMemo(() => {
    if (!vehicle) return found;
    return found.filter(
      (h) => matchVehicle(h.product, vehicle, brands.length) !== null,
    );
  }, [found, vehicle, brands.length]);

  const parsed = useMemo(
    () => parseQuery(query, products, brands),
    [query, products, brands],
  );

  const understood = useMemo(() => describeQuery(parsed), [parsed]);

  /**
   * Марка и модель названы в запросе («магнитола Kia Rio 2019») — подставляем
   * машину. Если раньше была выбрана другая — заменяем: покупатель прямо
   * назвал новое авто, и держать старый фильтр значит показывать не то.
   * Год берём из запроса; если его не назвали — просим выбрать сам.
   */
  useEffect(() => {
    if (!parsed.brands.length || !parsed.year) return;
    const brand = parsed.brands[0];
    const known = brands.find((b) => b.name === brand);
    if (!known) return;
    const model = parsed.models.find((m) => known.models.includes(m));
    if (!model) return;
    // Та же машина уже выбрана — ничего не трогаем
    if (
      vehicle &&
      vehicle.brand === brand &&
      vehicle.model === model &&
      vehicle.year === parsed.year
    )
      return;
    const next = { brand, model, year: parsed.year };
    setVehicle(next);
    saveVehicle(next);
    setShown(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed.brands.join(), parsed.models.join(), parsed.year, brands.length]);

  /**
   * Машину назвали без года — предлагаем выбрать его,
   * иначе подбор врёт: год влияет на совместимость.
   */
  const askYear = useMemo(() => {
    if (parsed.year || !parsed.brands.length) return null;
    const brand = parsed.brands[0];
    const known = brands.find((b) => b.name === brand);
    if (!known) return null;
    const model = parsed.models.find((m) => known.models.includes(m));
    if (!model) return null;
    // Уже стоит ровно эта машина — спрашивать не о чем
    if (vehicle && vehicle.brand === brand && vehicle.model === model)
      return null;
    return { brand, model };
  }, [vehicle, parsed.year, parsed.brands, parsed.models, brands]);

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
    if (sort !== "relevance") {
      out = [...out].sort((a, b) => {
        if (sort === "price-asc") return a.product.price - b.product.price;
        if (sort === "price-desc") return b.product.price - a.product.price;
        return a.product.name.localeCompare(b.product.name, "ru");
      });
    }
    return out;
  }, [hits, category, sort]);

  useSeo({
    title: query
      ? `${query} — поиск по каталогу · ШТАТНО`
      : "Поиск по каталогу · ШТАТНО",
    description: query
      ? `Результаты поиска «${query}»: автоэлектроника, переходники, разъёмы и аксессуары с подбором по марке и модели авто.`
      : "Поиск по каталогу автоэлектроники: магнитолы, камеры, переходники и штатные разъёмы.",
    canonical: `${SITE_URL}/search`,
  });

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (q) setParams({ q });
  };

  /** Точные совпадения по машине первыми, универсальные — отдельно ниже */
  const fit = useMemo(
    () => splitByFit(list, (h) => h.product, vehicle),
    [list, vehicle],
  );
  const ordered = useMemo(
    () => [...fit.exact, ...fit.universal],
    [fit.exact, fit.universal],
  );
  const visible = ordered.slice(0, shown);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="section-pad">
        <Breadcrumbs items={[{ label: query ? `Поиск: ${query}` : "Поиск" }]} />

        <div className="rule" />

        <div className="grid grid-cols-1 gap-x-6 py-8 md:grid-cols-12 md:py-10">
          <div className="md:col-span-7">
            <div className="eyebrow">Результаты поиска</div>
            <h1 className="mt-3 font-head text-3xl font-bold uppercase leading-tight tracking-tight md:text-[42px]">
              {query ? `«${query}»` : "Что ищем?"}
            </h1>
            {understood && (
              <p className="mt-3 text-[0.85rem] text-muted-foreground">
                Поняли запрос как:{" "}
                <span className="text-foreground">{understood}</span>
              </p>
            )}
          </div>

          <div className="mt-6 md:col-span-5 md:mt-0">
            <form
              onSubmit={submit}
              className="flex items-center gap-3 border border-foreground bg-surface px-4 py-3 transition-colors focus-within:border-primary"
            >
              <Icon
                name="Search"
                size={18}
                className="flex-none text-muted-foreground"
              />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Магнитола Kia Rio, камера или артикул"
                className="w-full min-w-0 border-0 bg-transparent text-[0.95rem] outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="flex-none text-muted-foreground transition-colors hover:text-primary"
                aria-label="Найти"
              >
                <Icon name="ArrowRight" size={17} />
              </button>
            </form>
          </div>
        </div>

        <div className="rule-hair" />

        {askYear && !loading && (
          <div className="py-5">
            <YearPrompt
              brand={askYear.brand}
              model={askYear.model}
              current={vehicle}
              onPick={applyVehicle}
            />
          </div>
        )}

        {query && !loading && (
          <div className="py-5">
            <VehicleFilterBar
              vehicle={vehicle}
              onApply={applyVehicle}
              onReset={resetVehicle}
              count={hits.length}
            />
            {vehicle && found.length > hits.length && (
              <p className="mt-2 text-[0.78rem] text-muted-foreground">
                Показаны только совместимые с вашим авто товары.
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            Загружаем каталог…
          </div>
        ) : !query ? (
          <div className="py-20 text-center text-muted-foreground">
            Введите название, марку авто или артикул.
          </div>
        ) : hits.length === 0 ? (
          <div className="py-16 text-center">
            <div className="font-head text-xl font-bold">Ничего не нашлось</div>
            <p className="mx-auto mt-3 max-w-[34em] text-[0.9rem] leading-relaxed text-muted-foreground">
              Попробуйте короче — «магнитола», «разъём Honda» или артикул с
              коробки. Если нужного пока нет в каталоге, позвоните — подберём и
              привезём под заказ.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.1em] text-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Открыть каталог
              <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
                Найдено: {list.length}
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

            {/* Разделы найденного — в плавающей панели, как в каталоге:
                над выдачей они занимали несколько строк и отжимали товары */}
            {categories.length > 1 && (
              <FloatingFilters
                activeCount={category ? 1 : 0}
                resultCount={list.length}
                hideOn={category}
                storageKey={`search:${query}`}
                scrollTargetId="catalog-top"
              >
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setCategory("")}
                    className={`flex items-center justify-between border px-3.5 py-2.5 text-left text-[0.82rem] transition-colors ${
                      category
                        ? "border-border bg-surface hover:border-primary hover:text-primary"
                        : "border-foreground bg-foreground text-background"
                    }`}
                  >
                    Все
                    <span className="text-[0.75rem] opacity-70">
                      {hits.length}
                    </span>
                  </button>
                  {categories.map(([c, n]) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`flex items-center justify-between gap-3 border px-3.5 py-2.5 text-left text-[0.82rem] transition-colors ${
                        category === c
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-surface hover:border-primary hover:text-primary"
                      }`}
                    >
                      <span className="min-w-0 flex-1">{c}</span>
                      <span className="flex-none text-[0.75rem] opacity-70">
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
              </FloatingFilters>
            )}

            {parsed.brands.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-6 text-[0.78rem]">
                <span className="py-2 text-muted-foreground">
                  Страницы по марке:
                </span>
                {parsed.brands.map((b) => (
                  <Link
                    key={b}
                    to={`/brand/${slugify(b)}`}
                    className="border border-border bg-surface px-3.5 py-2 transition-colors hover:border-primary hover:text-primary"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            )}

            <div
              id="catalog-top"
              className="grid grid-cols-2 gap-3 pb-10 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {visible.map((h, i) => (
                <Fragment key={h.product.id}>
                  {i === fit.exact.length && fit.universal.length > 0 && (
                    <UniversalDivider count={fit.universal.length} />
                  )}
                  <ProductCard product={h.product} vehicle={vehicle} />
                </Fragment>
              ))}
            </div>

            {shown < ordered.length && (
              <div className="pb-14 text-center">
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
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;