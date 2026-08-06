import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GuideContent from '@/components/GuideContent';
import ProductCard from '@/components/ProductCard';
import { useCatalog } from '@/context/CatalogContext';
import { loadVehicle } from '@/lib/vehicle';

const GuidePage = () => {
  const { slug } = useParams();
  const { guides, products, loading } = useCatalog();
  const vehicle = loadVehicle();

  const guide = useMemo(() => guides.find((g) => g.slug === slug) ?? null, [guides, slug]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  const linked = useMemo(
    () => products.filter((p) => guide?.products?.includes(p.id)),
    [products, guide],
  );

  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="section-pad py-32 text-center">
          {loading ? (
            <div className="text-muted-foreground">Загружаем инструкцию…</div>
          ) : (
            <>
              <div className="font-head text-3xl font-bold uppercase tracking-tight">
                Инструкция не найдена
              </div>
              <Link
                to="/guides"
                className="mt-8 inline-flex items-center gap-2 border border-foreground px-6 py-4 font-head text-[0.85rem] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
              >
                Все инструкции
                <Icon name="ArrowRight" size={16} />
              </Link>
            </>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="section-pad">
          <div className="flex flex-wrap items-center gap-2 py-6 text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-primary">
              Главная
            </Link>
            <Icon name="ChevronRight" size={13} />
            <Link to="/guides" className="transition-colors hover:text-primary">
              Инструкции
            </Link>
          </div>

          <div className="rule" />

          <div className="grid grid-cols-1 gap-x-6 gap-y-6 py-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="eyebrow">Техническое описание</div>
              <h1 className="mt-3 font-head text-3xl font-bold uppercase leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                {guide.title}
              </h1>
            </div>
            {guide.excerpt && (
              <p className="max-w-[34em] text-muted-foreground md:col-span-5 md:pt-10">
                {guide.excerpt}
              </p>
            )}
          </div>

          <div className="pb-14">
            <GuideContent guide={guide} />
          </div>
        </section>

        {linked.length > 0 && (
          <section className="section-pad">
            <div className="rule" />
            <div className="py-10">
              <div className="eyebrow">Оборудование из инструкции</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Что понадобится
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 pb-16 sm:grid-cols-2 lg:grid-cols-3">
              {linked.map((p) => (
                <ProductCard key={p.id} product={p} vehicle={vehicle} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default GuidePage;
