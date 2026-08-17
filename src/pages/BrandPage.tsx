import { useEffect, useMemo } from "react";
import { useVehicle } from "@/hooks/use-vehicle";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionHead from "@/components/SectionHead";
import ProductCard from "@/components/ProductCard";
import NotFound from "@/pages/NotFound";
import { useCatalog } from "@/context/CatalogContext";
import { SITE_URL } from "@/lib/seo";
import { useSeo } from "@/hooks/use-seo";
import { slugify } from "@/lib/slug";
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
        ? products.filter((p) => (p.fits?.[brand.name] ?? []).length > 0)
        : [],
    [products, brand],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((p) =>
      map.set(p.category, [...(map.get(p.category) ?? []), p]),
    );
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [items]);

  useSeo(
    brand
      ? {
          title: `Автоэлектроника для ${brand.name} — магнитолы, камеры, жгуты | ШТАТНО`,
          description: `Оборудование для ${brand.name}: ${items.length} позиций для моделей ${brand.models
            .slice(0, 4)
            .join(", ")}. Совместимость проверена по штатным разъёмам.`,
          canonical: `${SITE_URL}/brand/${slug}`,
          jsonLd: [
            crumbsJsonLd([
              { label: "Каталог", to: "/#catalog" },
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
          items={[{ label: "Каталог", to: "/#catalog" }, { label: brand.name }]}
        />

        <div className="rule" />
        <SectionHead
          index="01"
          eyebrow="Подбор по марке"
          title={`Оборудование для ${brand.name}`}
          note={`${items.length} позиций подходят для ${brand.name}. Модели: ${brand.models.join(", ")}. Совместимость проверена по штатным разъёмам и посадочному месту.`}
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
          byCategory.map(([category, list]) => (
            <div key={category} className="py-8">
              <h2 className="font-head text-xl font-bold uppercase tracking-tight">
                {category}
                <span className="ml-3 text-[0.8rem] font-normal text-muted-foreground">
                  {list.length}
                </span>
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} vehicle={vehicle} />
                ))}
              </div>
            </div>
          ))
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
