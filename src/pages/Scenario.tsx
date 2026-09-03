import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleFilterBar from "@/components/VehicleFilterBar";
import StepVehicleFilter from "@/components/StepVehicleFilter";
import {
  PartialVehicle,
  Product,
  Vehicle,
  fitsAll,
  matchVehicle,
  matchesPartial,
  splitByFit,
} from "@/data/catalog";
import {
  availableScreenSizes,
  headunitFitsVehicle,
  screenSize,
} from "@/lib/kit-filter";
import { SCENARIOS, findScenario } from "@/data/scenarios";
import { VEHICLE_EVENT, loadVehicle, saveVehicle } from "@/lib/vehicle";
import { SITE_URL } from "@/lib/seo";
import { scenarioTitle, scenarioDescription } from "@/lib/scenario-seo";
import { useSeo } from "@/hooks/use-seo";
import { useCatalog } from "@/context/CatalogContext";
import { smartSearch, SearchHit } from "@/lib/smart-search";
import { FilterState } from "@/components/CatalogFilters";
import { crumbsJsonLd } from "@/components/Breadcrumbs";
import { useKit } from "@/context/KitContext";
import ScenarioHero from "@/components/scenario/ScenarioHero";
import ScenarioKit from "@/components/scenario/ScenarioKit";
import {
  CATEGORY_FIRST,
  CATEGORY_STEP,
} from "@/components/scenario/CategorySection";
import ScenarioCatalog, {
  SortKey,
} from "@/components/scenario/ScenarioCatalog";
import ScenarioFooterInfo from "@/components/scenario/ScenarioFooterInfo";
import { findFitModels } from "@/lib/fits-match";

const PAGE_SIZE = 12;

const ScenarioPage = () => {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();

  /** Марка из ссылки — «популярные марки» в футере ведут сюда */
  const brandFilter = params.get("brand") ?? "";
  const {
    products,
    allProducts,
    brands,
    categories: allCategories,
    loading,
  } = useCatalog();
  const scenario = findScenario(slug);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  /**
   * Пошаговый подбор — только для полного каталога: там список сужается
   * сразу после выбора марки, не дожидаясь модели и года.
   */
  const stepMode = !!scenario?.fullCatalog;
  const [partial, setPartial] = useState<PartialVehicle | null>(null);
  /** Универсальные позиции показываем по умолчанию */
  const [withUniversal, setWithUniversal] = useState(true);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  /**
   * Полный каталог разложен по разделам, и каждый разворачивается сам:
   * «показать ещё» в магнитолах не должно тянуть за собой регистраторы.
   * Раздел → сколько его товаров сейчас на экране.
   */
  const [sectionShown, setSectionShown] = useState<Record<string, number>>({});
  /**
   * Сборка комплекта живёт в общем хранилище — панель видна на всём сайте.
   * Пропущенные шаги держим там же: панель по ним понимает, что покупатель
   * принял решение по каждому шагу и комплект действительно собран.
   */
  const { picks, begin, pick: pickForKit, skipped, setSkipped } = useKit();

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
   * Куда вести покупателя дальше: первый шаг, который ещё не заполнен.
   * Порядок не перепрыгиваем: если машина не указана, шаг всё равно
   * показываем — там ждёт просьба выбрать авто, а не пустота. Иначе
   * покупателя унесло бы мимо рамки сразу к необязательной камере.
   */
  const nextStop = (
    kit: NonNullable<typeof scenario>["kit"],
    nextPicks: Record<string, string>,
    _car: Vehicle | null,
  ): string => {
    if (!kit) return "";
    const i = kit.findIndex(
      (step) => !nextPicks[step.category] && !skipped[step.category],
    );
    return i >= 0 ? stepId(i) : "";
  };

  /**
   * Ведущий шаг — магнитола. Пока она не выбрана, остальные шаги закрыты:
   * рамка зависит от диагонали её экрана, а проводка — от её разъёмов.
   */
  const leadStep = scenario?.kit?.find((s) => s.leading);
  const leadPickId = leadStep ? picks[leadStep.category] : undefined;
  /**
   * Шаг закрыт, пока не заполнены все обязательные шаги до него:
   * рамку подбираем под магнитолу, проводку — под магнитолу и рамку.
   */
  const stepLocked = (i: number): boolean =>
    !!leadStep &&
    (scenario?.kit ?? [])
      .slice(0, i)
      .some((s) => !s.optional && !picks[s.category]);
  const leadProduct = useMemo(
    () => (leadPickId ? products.find((p) => p.id === leadPickId) : undefined),
    [products, leadPickId],
  );
  /** Диагональ выбранной магнитолы — по ней фильтруем рамки */
  const leadSize = useMemo(
    () => (leadProduct ? screenSize(leadProduct) : null),
    [leadProduct],
  );

  /**
   * Какие экраны реально влезут в эту машину — по типоразмерам рамок,
   * которые на неё есть. Пока авто не выбрано, список пуст и ничего
   * не ограничиваем.
   */
  const availableSizes = useMemo(
    () => availableScreenSizes(products, vehicle),
    [products, vehicle],
  );
  /** Первый незаполненный обязательный шаг — туда и возвращаем покупателя */
  const scrollToLead = () => {
    const i = (scenario?.kit ?? []).findIndex(
      (s) => !s.optional && !picks[s.category],
    );
    if (i >= 0) scrollTo(stepId(i));
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

  /** Пропуск необязательного шага — ведём к следующему незаполненному */
  const skipStep = (i: number, stepCategory: string, skip: boolean) => {
    setSkipped(stepCategory, skip);
    // Пропустили — сразу ведём к следующему шагу
    if (skip && scenario?.kit) {
      const rest = scenario.kit
        .slice(i + 1)
        .findIndex((s) => !picks[s.category] && !skipped[s.category]);
      if (rest >= 0) scrollTo(stepId(i + 1 + rest));
    }
  };

  /**
   * Режем вступление по выделяемой фразе. Разбиение даёт чередование
   * «обычный текст — выделенный — обычный», поэтому в вёрстке достаточно
   * подсветить куски с нечётным номером.
   */
  const introParts = useMemo(() => {
    const text = scenario?.intro ?? "";
    const mark = scenario?.introHighlight;
    if (!mark) return [text];
    const at = text.indexOf(mark);
    if (at === -1) return [text];
    return [text.slice(0, at), mark, text.slice(at + mark.length)];
  }, [scenario?.intro, scenario?.introHighlight]);

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

  /* Машину могли сменить или сбросить плашкой в шапке — следим за этим */
  useEffect(() => {
    const sync = () => {
      const car = loadVehicle();
      setVehicle(car);
      /*
       * Пошаговый фильтр подхватывает машину из шапки, но только когда
       * она там есть. Пустое хранилище — это промежуточный шаг подбора
       * (сменили марку, модель ещё не выбрали), и затирать поля нельзя:
       * иначе фильтр обнулялся бы прямо во время выбора.
       */
      if (car) {
        setPartial({ brand: car.brand, model: car.model, year: car.year });
      }
    };
    sync();
    window.addEventListener(VEHICLE_EVENT, sync);
    return () => window.removeEventListener(VEHICLE_EVENT, sync);
  }, []);
  useEffect(() => {
    setShown(PAGE_SIZE);
    setSectionShown({});
    setCategory("");
    window.scrollTo({ top: 0 });
  }, [slug]);

  /**
   * Обычный сценарий — подборка по смыслу запроса.
   * Сценарий «покажите всё» — весь каталог целиком, как раньше на главной.
   */
  const found = useMemo(() => {
    if (!scenario) return [];
    // Разделы заданы прямо — умный поиск только мешал бы, притаскивая
    // переходники и провода вместо самих камер
    if (scenario.onlyCategories) {
      const only = scenario.onlyCategories;
      return products
        .filter((p) => only.includes(p.category))
        .sort((a, b) => {
          const ia = only.indexOf(a.category);
          const ib = only.indexOf(b.category);
          if (ia !== ib) return ia - ib;
          return a.price - b.price;
        })
        .map((p) => ({ product: p, score: 0, reason: "" }));
    }
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

    /*
     * Подборка, где подбор по машине не нужен: всё оборудование в ней
     * универсальное. Марку из ссылки игнорируем — иначе страница сама
     * себе противоречила: сверху «встаёт на любой автомобиль», а ниже
     * пусто, потому что ни у одного товара марка не проставлена
     */
    if (scenario?.noVehicle) return out;

    /*
     * Пришли по ссылке с маркой — оставляем её оборудование и то, что
     * не зависит от марки. Раньше универсальные товары отбрасывались:
     * в подборках, где всё универсальное (шумоизоляция, регистраторы),
     * список выходил пустым, и человек видел «под эту машину ничего нет»
     * прямо под фразой «встаёт на любой автомобиль»
     */
    if (brandFilter) {
      out = out.filter(
        (h) =>
          (findFitModels(h.product.fits, brandFilter) ?? []).length > 0 ||
          fitsAll(h.product),
      );
    }

    // Полный каталог сужается на каждом шаге выбора авто
    if (stepMode) {
      if (!partial?.brand) return out;
      return out.filter((h) =>
        matchesPartial(h.product, partial, withUniversal),
      );
    }

    if (!vehicle) return out;
    return out.filter(
      (h) => matchVehicle(h.product, vehicle, brands.length) !== null,
    );
  }, [
    found,
    vehicle,
    brands.length,
    brandFilter,
    stepMode,
    partial,
    withUniversal,
    scenario,
  ]);

  /** Сколько в подборке универсальных позиций — их убирает переключатель */
  const universalShown = useMemo(() => {
    if (!stepMode || !partial?.brand) return 0;
    return found.filter((h) => fitsAll(h.product)).length;
  }, [found, stepMode, partial]);

  /** По чему группируем кнопки над каталогом: раздел, подраздел или тип */
  const groupOf = (p: Product) => {
    if (scenario?.filterBySpec) {
      const row = p.specs?.find(([label]) => label === scenario.filterBySpec);
      return row?.[1] ?? "";
    }
    if (scenario?.filterBySubcategory) return p.subcategory ?? "";
    return p.category;
  };

  const categories = useMemo(() => {
    const map: Record<string, number> = {};
    hits.forEach((h) => {
      const key = groupOf(h.product);
      if (!key) return;
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hits, scenario?.filterBySubcategory, scenario?.filterBySpec]);

  const catalogCounts = useMemo(() => {
    const map: Record<string, number> = {};
    hits.forEach((h) => {
      map[h.product.category] = (map[h.product.category] ?? 0) + 1;
    });
    return map;
  }, [hits]);

  const list = useMemo(() => {
    let out = category
      ? hits.filter((h) => groupOf(h.product) === category)
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
          // К живой фразе добавляем цифры сценария: по ним страница
          // находится и по товарным запросам, а не только по образным
          title: scenarioTitle(scenario.heading, found.map((h) => h.product)),
          description: scenarioDescription(
            scenario.intro,
            found.map((h) => h.product),
          ),
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

  /**
   * Точные совпадения по машине идут первыми, универсальные — ниже
   * отдельным блоком: покупатель не должен путать «подобрано под ваше авто»
   * с «подойдёт почти всем».
   */
  const fit = useMemo(
    () =>
      splitByFit(
        list,
        (h) => h.product,
        vehicle,
        // Магнитолу к машине привязывает не марка, а размер доступной рамки
        (p) => headunitFitsVehicle(p, availableSizes),
      ),
    [list, vehicle, availableSizes],
  );
  const ordered = useMemo(
    () => [...fit.exact, ...fit.universal],
    [fit.exact, fit.universal],
  );
  const visible = ordered.slice(0, shown);

  /**
   * Полный каталог — раскладываем по разделам. Порядок разделов берём тот
   * же, что в фильтре слева (задаётся в админке), чтобы список читался
   * одинаково в обоих местах. Внутри раздела сначала то, что точно встаёт
   * на машину, потом универсальное. Пустые разделы не показываем.
   */
  const sections = useMemo(() => {
    if (!scenario?.fullCatalog) return [];
    const map = new Map<string, { exact: SearchHit[]; universal: SearchHit[] }>();
    const put = (h: SearchHit, key: "exact" | "universal") => {
      const name = h.product.category || "Прочее";
      if (!map.has(name)) map.set(name, { exact: [], universal: [] });
      map.get(name)![key].push(h);
    };
    fit.exact.forEach((h) => put(h, "exact"));
    fit.universal.forEach((h) => put(h, "universal"));
    const order = new Map(allCategories.map((c, i) => [c, i]));
    return [...map.entries()]
      .map(([title, g]) => ({
        title,
        items: [...g.exact, ...g.universal],
        exactCount: g.exact.length,
      }))
      .sort(
        (a, b) =>
          (order.get(a.title) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.title) ?? Number.MAX_SAFE_INTEGER),
      );
  }, [fit.exact, fit.universal, scenario?.fullCatalog, allCategories]);

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

  /**
   * Шаг подбора в полном каталоге. Полностью заполненную машину
   * запоминаем как обычно — она нужна другим страницам и шапке.
   */
  const applyPartial = (v: PartialVehicle | null) => {
    const wasComplete = !!(partial?.brand && partial.model && partial.year);
    const complete = !!(v?.brand && v.model && v.year);

    setPartial(v);
    setShown(PAGE_SIZE);

    if (complete) {
      const full = { brand: v!.brand, model: v!.model!, year: v!.year! };
      setVehicle(full);
      saveVehicle(full);
      // Подбор завершён — сразу показываем результат, мотать не нужно
      if (!wasComplete) scrollTo("catalog-list");
    } else if (vehicle) {
      setVehicle(null);
      saveVehicle(null);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="section-pad">
        <ScenarioHero
          scenario={scenario}
          introParts={introParts}
          brandFilter={scenario.noVehicle ? "" : brandFilter}
          onClearBrand={() => {
            const next = new URLSearchParams(params);
            next.delete("brand");
            setParams(next);
          }}
        />

        {/* Подбор по машине */}
        {scenario.noVehicle ? (
          <div className="flex items-start gap-3 border border-border bg-surface px-5 py-4">
            <Icon
              name="CircleCheck"
              size={19}
              className="mt-0.5 flex-none text-success"
            />
            <p className="text-[0.87rem] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Подбор по машине здесь не нужен.
              </span>{" "}
              Всё оборудование в этой подборке универсальное — встаёт на любой
              автомобиль, поэтому фильтровать по марке и модели нечего.
            </p>
          </div>
        ) : (
          <div id="kit-vehicle" className="scroll-mt-28 py-6">
            {stepMode ? (
              <StepVehicleFilter
                value={partial}
                onChange={applyPartial}
                count={hits.length}
                withUniversal={withUniversal}
                onUniversal={(v) => {
                  setWithUniversal(v);
                  setShown(PAGE_SIZE);
                }}
                universalCount={universalShown}
              />
            ) : (
              <>
                <VehicleFilterBar
                  vehicle={vehicle}
                  onApply={applyVehicle}
                  onReset={resetVehicle}
                />
                {vehicle && found.length > hits.length && (
                  <p className="mt-2 text-[0.78rem] text-muted-foreground">
                    Показаны только совместимые с вашим авто товары.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            Загружаем каталог…
          </div>
        ) : scenario.kit ? (
          <ScenarioKit
            kit={scenario.kit}
            scenarioSlug={scenario.slug}
            products={products}
            allProducts={allProducts}
            vehicle={vehicle}
            brandsCount={brands.length}
            picks={picks}
            skipped={skipped}
            leadSize={leadSize}
            availableSizes={availableSizes}
            stepId={stepId}
            stepLocked={stepLocked}
            onPick={pickAndAdvance}
            onPickPlain={pickForKit}
            onNeedVehicle={scrollToVehicle}
            onNeedLead={scrollToLead}
            onSkip={skipStep}
          />
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
          <ScenarioCatalog
            scenario={scenario}
            list={list}
            fit={fit}
            ordered={ordered}
            visible={visible}
            hitsCount={hits.length}
            vehicle={vehicle}
            sort={sort}
            onSort={setSort}
            categories={categories}
            category={category}
            onCategory={setCategory}
            filters={filters}
            onFilters={setFilters}
            onResetFilters={() => setFilters(emptyFilters())}
            bounds={bounds}
            allCategories={allCategories}
            warranties={warranties}
            catalogCounts={catalogCounts}
            shown={shown}
            onShowMore={() => setShown((s) => s + PAGE_SIZE)}
            sections={sections}
            sectionShown={sectionShown}
            onSectionMore={(title) =>
              setSectionShown((m) => ({
                ...m,
                [title]: (m[title] ?? CATEGORY_FIRST) + CATEGORY_STEP,
              }))
            }
            onSectionCollapse={(title) =>
              setSectionShown((m) => ({ ...m, [title]: CATEGORY_FIRST }))
            }
          />
        )}

        <ScenarioFooterInfo scenario={scenario} others={others} />
      </main>

      <Footer />
    </div>
  );
};

export default ScenarioPage;