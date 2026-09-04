import { useEffect, useMemo, useState } from "react";
import { useVehicle } from "@/hooks/use-vehicle";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import CategorySection, {
  CATEGORY_FIRST,
  CATEGORY_STEP,
} from "@/components/scenario/CategorySection";
import NotFound from "@/pages/NotFound";
import { useCatalog } from "@/context/CatalogContext";
import { SITE_URL } from "@/lib/seo";
import { brandTitle, brandDescription } from "@/lib/brand-seo";
import { useSeo } from "@/hooks/use-seo";
import { slugify } from "@/lib/slug";
import { findFitModels } from "@/lib/fits-match";
import { plural } from "@/lib/kit-filter";
import { SearchHit } from "@/lib/smart-search";
import Breadcrumbs, { crumbsJsonLd } from "@/components/Breadcrumbs";

/** Оборудование для одной марки авто по собственному адресу. */
const BrandPage = () => {
  const { slug = "" } = useParams();
  const { products, brands, loading } = useCatalog();
  const { vehicle } = useVehicle();

  const brand = useMemo(
    () => brands.find((b) => slugify(b.name) === slug) ?? null,
    [brands, slug],
  );

  const items = useMemo(
    () =>
      brand
        ? products.filter(
            (p) => (findFitModels(p.fits, brand.name) ?? []).length > 0,
          )
        : [],
    [products, brand],
  );

  /*
   * Раскладываем по разделам и заворачиваем в SearchHit — в таком виде
   * товары принимает CategorySection, тот же компонент, что показывает
   * разделы в подборе по машине. Совместимость здесь уже проверена
   * фильтром выше, поэтому оценка у всех одинаковая.
   */
  const byCategory = useMemo(() => {
    const map = new Map<string, SearchHit[]>();
    items.forEach((p) =>
      map.set(p.category, [
        ...(map.get(p.category) ?? []),
        { product: p, score: 0, reason: "" },
      ]),
    );
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  /*
   * Сколько товаров раскрыто в каждом разделе. У Toyota больше семисот
   * позиций — раньше страница весила 1,6 МБ и открывалась пять секунд,
   * потому что рисовались все сразу.
   */
  const [shown, setShown] = useState<Record<string, number>>({});

  /** Сменили марку — сворачиваем разделы обратно к первому ряду */
  useEffect(() => {
    setShown({});
  }, [slug]);

  useSeo(
    brand
      ? {
          // Собираем по товарам самой марки: количество, ходовые модели,
          // вилка цен. Иначе у всех марок один и тот же текст
          title: brandTitle(brand.name, items),
          description: brandDescription(brand.name, items),
          canonical: `${SITE_URL}/brand/${slug}`,
          jsonLd: [
            crumbsJsonLd([
              { label: "Каталог", to: "/catalog" },
              { label: brand.name },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: `Оборудование для ${brand.name}`,
              url: `${SITE_URL}/brand/${slug}`,
              numberOfItems: items.length,
            },
          ],
        }
      : null,
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (!brand) {
    if (loading || brands.length === 0) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="py-32 text-center text-muted-foreground">
            Загружаем…
          </div>
        </div>
      );
    }
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad">
        <Breadcrumbs
          items={[{ label: "Каталог", to: "/catalog" }, { label: brand.name }]}
        />

        <div className="rule" />
        <SectionHead
          as="h1"
          index="01"
          eyebrow="Подбор по марке"
          title={`Оборудование для ${brand.name}`}
          note={`${items.length} ${plural(items.length, "позиция подходит", "позиции подходят", "позиций подходят")} для ${brand.name}. Модели: ${brand.models.join(", ")}. Совместимость проверена по штатным разъёмам и посадочному месту.`}
        />

        <div className="rule-hair" />

        {items.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-head text-2xl font-medium uppercase tracking-tight">
              Для этой марки пока ничего нет
            </div>
            <Link
              to="/"
              className="mt-6 inline-block border border-foreground px-6 py-3 text-[0.8rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
            >
              Весь каталог
            </Link>
          </div>
        ) : (
          <div className="pt-8">
            {byCategory.map(([category, list]) => (
              <CategorySection
                key={category}
                title={category}
                items={list}
                shown={shown[category] ?? CATEGORY_FIRST}
                /* Все товары раздела подходят марке — делить нечего */
                exactCount={list.length}
                vehicle={vehicle}
                onShowMore={() =>
                  setShown((s) => ({
                    ...s,
                    [category]: (s[category] ?? CATEGORY_FIRST) + CATEGORY_STEP,
                  }))
                }
                onCollapse={() =>
                  setShown((s) => ({ ...s, [category]: CATEGORY_FIRST }))
                }
              />
            ))}
          </div>
        )}

        <div className="rule-hair" />

        <div className="py-10">
          <div className="eyebrow">Другие марки</div>
          <div className="mt-4 flex flex-wrap gap-3">
            {brands
              .filter((b) => b.name !== brand.name)
              .map((b) => (
                <Link
                  key={b.name}
                  to={`/brand/${slugify(b.name)}`}
                  className="border border-border px-4 py-2 text-[0.85rem] transition-colors hover:border-primary hover:text-primary"
                >
                  {b.name}
                </Link>
              ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrandPage;