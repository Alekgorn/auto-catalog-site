import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHead from '@/components/SectionHead';
import { useCatalog } from '@/context/CatalogContext';

const Guides = () => {
  const { guides, loading } = useCatalog();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad">
        <div className="pt-6" />
        <div className="rule" />
        <SectionHead
          index="07"
          eyebrow="Технические описания"
          title="Инструкции по установке"
          note="Пошаговые описания монтажа с фотографиями: что снимать, куда крепить и какой инструмент нужен. Каждая инструкция привязана к конкретному оборудованию."
        />

        {loading && guides.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">Загружаем…</div>
        ) : guides.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-head text-2xl font-medium uppercase tracking-tight">
              Скоро здесь появятся инструкции
            </div>
            <p className="mx-auto mt-3 max-w-[30em] text-muted-foreground">
              Мы готовим пошаговые описания установки с фотографиями по каждой категории
              оборудования.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-12 pb-20 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <article key={g.slug} className="group flex flex-col border-t border-foreground pt-5">
                <Link to={`/guides/${g.slug}`} className="block overflow-hidden bg-card">
                  {g.cover ? (
                    <img
                      src={g.cover}
                      alt={g.title}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center text-muted-foreground">
                      <Icon name="BookOpen" size={30} />
                    </div>
                  )}
                </Link>
                <h2 className="mt-4 font-head text-xl font-medium leading-tight tracking-tight">
                  <Link
                    to={`/guides/${g.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {g.title}
                  </Link>
                </h2>
                {g.excerpt && (
                  <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-muted-foreground">
                    {g.excerpt}
                  </p>
                )}
                <div className="mt-5 flex items-center gap-4 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                  {g.duration && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="Clock" size={13} />
                      {g.duration}
                    </span>
                  )}
                  {g.difficulty && (
                    <span className="flex items-center gap-1.5">
                      <Icon name="Wrench" size={13} />
                      {g.difficulty}
                    </span>
                  )}
                </div>
                <Link
                  to={`/guides/${g.slug}`}
                  className="mt-5 flex items-center justify-between border border-foreground px-5 py-3 font-head text-[0.78rem] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
                >
                  Читать
                  <Icon name="ArrowRight" size={15} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Guides;
