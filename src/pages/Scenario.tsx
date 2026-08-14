import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Icon from "@/components/ui/icon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import VehicleFilterBar from "@/components/VehicleFilterBar";
import { Vehicle, matchVehicle } from "@/data/catalog";
import { SCENARIOS, findScenario } from "@/data/scenarios";
import { loadVehicle, saveVehicle } from "@/lib/vehicle";
import { SITE_URL } from "@/lib/seo";
import { useSeo } from "@/hooks/use-seo";
import { useCatalog } from "@/context/CatalogContext";
import { smartSearch } from "@/lib/smart-search";
import CatalogFilters, { FilterState } from "@/components/CatalogFilters";
import Breadcrumbs, { crumbsJsonLd } from "@/components/Breadcrumbs";
import KitSection from "@/components/kit/KitSection";
import KitRecommend from "@/components/kit/KitRecommend";
import { useKit } from "@/context/KitContext";

type SortKey = "relevance" | "price-asc" | "price-desc" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "по совпадению" },
  { key: "price-asc", label: "сначала дешёвые" },
  { key: "price-desc", label: "сначала дорогие" },
  { key: "name", label: "по названию" },
];

const PAGE_SIZE = 12;

const ScenarioPage = () => {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  /** Марка из ссылки — «популярные марки» в футере ведут сюда */
  const brandFilter = params.get("brand") ?? "";
  const { products, brands, categories: allCategories, loading } = useCatalog();
  const scenario = findScenario(slug);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [mobileFilters, setMobileFilters] = useState(false);

  /** Сборка комплекта живёт в общем хранилище — панель видна на всём сайте */
  const { picks, begin, pick: pickForKit } = useKit();

  useEffect(() => {
    if (scenario?.kit) begin(scenario.slug, scenario.kit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, scenario?.kit]);

  /** Плавно подводим экран к нужному месту сборки */
  const scrollTo = (id: string, block: ScrollLogicalPosition = "start") => {
    // Ждём перерисовку: после выбора список сворачивается и высота меняется
    requestAnimationFrame(() =>
      setTimeout(
        () =>
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block }),
        60,
      ),
    );
  };

  const scrollToVehicle = () => scrollTo("kit-vehicle", "center");

  /** id блока шага по его номеру */
  const stepId = (i: number) => `kit-step-${i}`;

  /**
   * Куда вести покупателя дальше: первый шаг, который ещё не заполнен
   * и уже доступен. Шаги с подбором по машине до выбора авто пропускаем —
   * там всё равно нечего выбирать.
   */
  const nextStop = (
    kit: NonNullable<typeof scenario>["kit"],
    nextPicks: Record<string, string>,
    car: Vehicle | null,
  ): string => {
    if (!kit) return "";
    const i = kit.findIndex(
      (step) => !nextPicks[step.category] && (!step.needVehicle || car),
    );
    if (i >= 0) return stepId(i);
    // Всё собрано — показываем, чем дополнить
    const done = kit.every((step) => nextPicks[step.category]);
    return done ? "kit-recommend" : "";
  };

  /** Выбор позиции — сразу подводим к следующему незакрытому шагу */
  const pickAndAdvance = (product: Parameters<typeof pickForKit>[0]) => {
    pickForKit(product);
    if (!scenario?.kit) return;
    // Повторное нажатие снимает выбор — тогда никуда не уводим
    if (picks[product.category] === product.id) return;
    const next = { ...picks, [product.category]: product.id };
    const target = nextStop(scenario.kit, next, vehicle);
    if (target) scrollTo(target);
  };

  const bounds = useMemo(() => {
    const prices = products.map((p) => p.price);
    return {
      min: prices.length ? Math.floor(Math.min(...prices) / 100) * 100 : 0,
      max: prices.length ? Math.ceil(Math.max(...prices) / 100) * 100 : 100000,
    };
  }, [products]);

  const emptyFilters = (): FilterState => ({
    categories: [],
    priceMin: bounds.min,
    priceMax: bounds.max,
    onlyHits: false,
    onlySale: false,
    warranties: [],
  });

  const [filters, setFilters] = useState<FilterState>(emptyFilters);

  useEffect(() => {
    setFilters(emptyFilters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.min, bounds.max, slug]);

  const warranties = useMemo(() => {
    const set: string[] = [];
    products.forEach((p) => {
      if (p.warranty && !set.includes(p.warranty)) set.push(p.warranty);
    });
    return set.sort();
  }, [products]);

  useEffect(() => setVehicle(loadVehicle()), []);
  useEffect(() => {
    setShown(PAGE_SIZE);
    setCategory("");
    window.scrollTo({ top: 0 });
  }, [slug]);

  /**
   * Обычный сценарий — подборка по смыслу запроса.
   * Сценарий «покажите всё» — весь каталог целиком, как раньше на главной.
   */
  const found = useMemo(() => {
    if (!scenario) return [];
    if (scenario.fullCatalog) {
      return [...products]
        .sort((a, b) => {
          const ba = a.badge === "Хит" ? 1 : 0;
          const bb = b.badge === "Хит" ? 1 : 0;
          if (ba !== bb) return bb - ba;
          return (b.popularity ?? 0) - (a.popularity ?? 0);
        })
        .map((p) => ({ product: p, score: 0, reason: "" }));
    }
    return smartSearch(products, scenario.query);
  }, [products, scenario]);

  /** Подбор по машине: совместимые плюс универсальные товары */
  const hits = useMemo(() => {
    let out = found;

    // Пришли по ссылке с маркой — оставляем только её оборудование
    if (brandFilter) {
      out = out.filter((h) => (h.product.fits?.[brandFilter] ?? []).length > 0);
    }

    if (!vehicle) return out;
    return out.filter(
      (h) => matchVehicle(h.product, vehicle, brands.length) !== null,
    );
  }, [found, vehicle, brands.length, brandFilter]);

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    hits.forEach((h) => {
      map[h.product.category] = (map[h.product.category] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [hits]);

  const catalogCounts = useMemo(() => {
    const map: Record<string, number> = {};
    hits.forEach((h) => {
      map[h.product.category] = (map[h.product.category] ?? 0) + 1;
    });
    return map;
  }, [hits]);

  const list = useMemo(() => {
    let out = category
      ? hits.filter((h) => h.product.category === category)
      : hits;

    // Полный каталог — работают развёрнутые фильтры слева
    if (scenario?.fullCatalog) {
      out = out.filter(({ product: p }) => {
        if (
          filters.categories.length &&
          !filters.categories.includes(p.category)
        )
          return false;
        if (p.price < filters.priceMin || p.price > filters.priceMax)
          return false;
        if (filters.onlyHits && p.badge !== "Хит") return false;
        if (filters.onlySale && !p.oldPrice) return false;
        if (
          filters.warranties.length &&
          !filters.warranties.includes(p.warranty)
        )
          return false;
        return true;
      });
    }
    if (sort !== "relevance") {
      out = [...out].sort((a, b) => {
        if (sort === "price-asc") return a.product.price - b.product.price;
        if (sort === "price-desc") return b.product.price - a.product.price;
        return a.product.name.localeCompare(b.product.name, "ru");
      });
    }
    return out;
  }, [hits, category, sort, filters, scenario]);

  useSeo(
    scenario
      ? {
          title: `${scenario.heading} · ШТАТНО`,
          description: scenario.intro.slice(0, 300),
          canonical: `${SITE_URL}/scenario/${scenario.slug}`,
          // Разметка вопросов — поисковики показывают их прямо в выдаче
          jsonLd: [
            crumbsJsonLd([
              { label: "Подбор по задаче", to: "/#scenarios" },
              { label: scenario.heading },
            ]),
            ...(scenario.faq.length
              ? [
                  {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: scenario.faq.map((item) => ({
                      "@type": "Question",
                      name: item.q,
                      acceptedAnswer: { "@type": "Answer", text: item.a },
                    })),
                  },
                ]
              : []),
          ],
        }
      : { title: "Сценарий не найден · ШТАТНО" },
  );

  const applyVehicle = (v: Vehicle) => {
    setVehicle(v);
    saveVehicle(v);
    setShown(PAGE_SIZE);
    // Машина известна — ведём к шагу, который ещё не закрыт
    if (scenario?.kit) {
      const target = nextStop(scenario.kit, picks, v);
      if (target) scrollTo(target);
    }
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
        <Breadcrumbs
          items={[
            { label: "Подбор по задаче", to: "/#scenarios" },
            { label: scenario.heading },
          ]}
        />

        <div className="rule" />

        {/* Заголовок и живой текст */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 py-9 md:grid-cols-12 md:py-12">
          <div className="md:col-span-7">
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 flex-none items-center justify-center border border-foreground bg-primary text-primary-foreground">
                <Icon name={scenario.icon} fallback="CircleAlert" size={32} />
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

        <div className="rule-hair" />

        {/* Пришли по ссылке с маркой */}
        {brandFilter && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-primary bg-surface px-5 py-4">
            <div className="flex items-center gap-3">
              <Icon name="Tag" size={20} className="flex-none text-primary" />
              <div className="font-head text-[1.05rem] font-bold tracking-tight">
                Оборудование для {brandFilter}
              </div>
            </div>
            <button
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("brand");
                setParams(next);
              }}
              className="border border-border px-4 py-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Показать все марки
            </button>
          </div>
        )}

        {/* Подбор по машине */}
        <div id="kit-vehicle" className="scroll-mt-28 py-6">
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
        ) : scenario.kit ? (
          <>
            {scenario.kit.map((step, i) => (
              <div key={step.category}>
                {i > 0 && <div className="rule-hair" />}
                <KitSection
                  step={step}
                  products={products}
                  vehicle={vehicle}
                  brandsCount={brands.length}
                  pickedId={picks[step.category]}
                  onPick={pickAndAdvance}
                  onNeedVehicle={scrollToVehicle}
                  anchorId={stepId(i)}
                  helpOffer={step.helpOffer}
                />
              </div>
            ))}
            <KitRecommend
              products={products}
              vehicle={vehicle}
              picks={picks}
              onPick={pickForKit}
              /* Советуем только когда основа собрана */
              ready={scenario.kit.every((s) => picks[s.category])}
            />
          </>
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
                Всего товаров: {list.length}
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

            {categories.length > 1 && !scenario.fullCatalog && (
              <div className="flex flex-wrap gap-2 pb-6">
                <button
                  onClick={() => setCategory("")}
                  className={`border px-3.5 py-2 text-[0.78rem] transition-colors ${
                    category
                      ? "border-border bg-surface hover:border-primary hover:text-primary"
                      : "border-foreground bg-foreground text-background"
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
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-surface hover:border-primary hover:text-primary"
                    }`}
                  >
                    {c} ({n})
                  </button>
                ))}
              </div>
            )}

            <div
              className={
                scenario.fullCatalog
                  ? "grid grid-cols-1 gap-x-6 lg:grid-cols-12"
                  : ""
              }
            >
              {scenario.fullCatalog && (
                <>
                  {/* Кнопка фильтров на телефоне */}
                  <button
                    onClick={() => setMobileFilters((v) => !v)}
                    className="mb-4 flex items-center justify-between border border-foreground px-4 py-3 text-[0.8rem] uppercase tracking-[0.1em] lg:hidden"
                  >
                    Фильтры
                    <Icon
                      name={mobileFilters ? "X" : "SlidersHorizontal"}
                      size={17}
                    />
                  </button>

                  <aside
                    className={`lg:col-span-3 ${mobileFilters ? "block" : "hidden lg:block"}`}
                  >
                    <div className="border border-border bg-surface p-4 lg:sticky lg:top-[100px]">
                      <CatalogFilters
                        state={filters}
                        bounds={bounds}
                        categories={allCategories}
                        warranties={warranties}
                        counts={catalogCounts}
                        onChange={setFilters}
                        onReset={() => setFilters(emptyFilters())}
                      />
                    </div>
                  </aside>
                </>
              )}

              <div className={scenario.fullCatalog ? "lg:col-span-9" : ""}>
                <div
                  className={`grid grid-cols-2 gap-3 pb-8 md:gap-4 ${
                    scenario.fullCatalog ? "lg:grid-cols-3" : "lg:grid-cols-4"
                  }`}
                >
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
              </div>
            </div>
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

        {/* Частые вопросы */}
        {scenario.faq.length > 0 && (
          <>
            <div className="rule" />
            <div className="grid grid-cols-1 gap-x-6 py-9 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="eyebrow">Вопросы и ответы</div>
                <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-tight">
                  Частые вопросы
                </h2>
                <p className="mt-3 max-w-[24em] text-[0.87rem] leading-relaxed text-muted-foreground">
                  Не нашли свой вопрос? Позвоните — подскажем по вашей машине.
                </p>
              </div>

              <div className="mt-6 md:col-span-8 md:mt-0">
                <Accordion type="single" collapsible className="w-full">
                  {scenario.faq.map((item, i) => (
                    <AccordionItem
                      key={item.q}
                      value={`q-${i}`}
                      className="border-t border-foreground border-b-0"
                    >
                      <AccordionTrigger className="py-4 text-left font-head text-[1.05rem] font-medium tracking-tight hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="max-w-[46em] pb-5 text-[0.92rem] leading-relaxed text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
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
                  size={30}
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
