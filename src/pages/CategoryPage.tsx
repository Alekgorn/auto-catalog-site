import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHead from '@/components/SectionHead';
import ProductCard from '@/components/ProductCard';
import NotFound from '@/pages/NotFound';
import { useCatalog } from '@/context/CatalogContext';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';
import { slugify } from '@/lib/slug';
import { loadVehicle } from '@/lib/vehicle';
import { formatPrice } from '@/data/catalog';

/** Каталог одной категории по собственному адресу — чтобы его индексировали. */
const CategoryPage = () => {
  const { slug = '' } = useParams();
  const { products, categories, loading } = useCatalog();
  const vehicle = loadVehicle();

  const category = useMemo(
    () => categories.find((c) => slugify(c) === slug) ?? null,
    [categories, slug],
  );

  const items = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category],
  );

  const minPrice = items.length ? Math.min(...items.map((p) => p.price)) : 0;

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

        {items.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-head text-2xl font-medium uppercase tracking-tight">
              В категории пока пусто
            </div>
            <Link
              to="/"
              className="mt-6 inline-block border border-foreground px-6 py-3 text-[0.8rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
            >
              Весь каталог
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} vehicle={vehicle} />
            ))}
          </div>
        )}

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
      <Footer />
    </div>
  );
};

export default CategoryPage;
