import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHead from '@/components/SectionHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useCatalog } from '@/context/CatalogContext';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';
import { articleDescription } from '@/lib/article-seo';

const dateText = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
};

/** Список статей: разборы, сравнения и советы по автоэлектронике. */
const Articles = () => {
  const { articles, loading } = useCatalog();

  useSeo({
    title: 'Статьи об автоэлектронике: разборы и сравнения | ШТАТНО',
    description:
      'Разбираем начинку автомагнитол, сравниваем процессоры и радиомодули, объясняем, что важно при выборе и установке.',
    canonical: `${SITE_URL}/articles`,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad">
        <Breadcrumbs items={[{ label: 'Статьи' }]} />
        <div className="rule" />
        <SectionHead
          as="h1"
          index="08"
          eyebrow="Полезное"
          title="Статьи об автоэлектронике"
          note="Разбираем, чем магнитолы отличаются друг от друга: процессоры, радиомодули, экраны и всё, что влияет на итог. Без рекламы — только то, что помогает выбрать."
        />

        {loading && articles.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">Загружаем…</div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-head text-2xl font-medium uppercase tracking-tight">
              Скоро здесь появятся статьи
            </div>
            <p className="mx-auto mt-3 max-w-[30em] text-muted-foreground">
              Готовим разборы и сравнения оборудования — чтобы выбор был
              осознанным, а не наугад.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-12 pb-20 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <article
                key={a.slug}
                className="group flex flex-col border-t border-foreground pt-5"
              >
                <Link
                  to={`/articles/${a.slug}`}
                  className="block overflow-hidden bg-surface-muted"
                >
                  {a.cover ? (
                    <img
                      src={a.cover}
                      alt={a.title}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center text-muted-foreground">
                      <Icon name="FileText" size={30} />
                    </div>
                  )}
                </Link>

                {a.publishedAt && (
                  <div className="mt-4 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                    {dateText(a.publishedAt)}
                  </div>
                )}

                <h2 className="mt-2 font-head text-xl font-medium leading-tight tracking-tight">
                  <Link
                    to={`/articles/${a.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {a.title}
                  </Link>
                </h2>

                <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-muted-foreground">
                  {a.excerpt || articleDescription(a)}
                </p>

                <Link
                  to={`/articles/${a.slug}`}
                  className="mt-5 flex items-center justify-between border border-foreground px-5 py-3 font-head text-[0.78rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
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

export default Articles;
