import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import ArticleContent from '@/components/ArticleContent';
import { useCatalog } from '@/context/CatalogContext';
import { useSeo } from '@/hooks/use-seo';
import { articleHeading, articleSeo } from '@/lib/article-seo';

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

/** Отдельная страница статьи со своим адресом и мета-тегами. */
const ArticlePage = () => {
  const { slug } = useParams();
  const { articles, loading } = useCatalog();

  const article = useMemo(
    () => articles.find((a) => a.slug === slug) ?? null,
    [articles, slug],
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  useSeo(
    article
      ? articleSeo(article)
      : { title: 'Статья не найдена | ШТАТНО', description: '' },
  );

  /* Ещё три статьи в конце — чтобы читатель не упирался в тупик */
  const more = useMemo(
    () => articles.filter((a) => a.slug !== slug).slice(0, 3),
    [articles, slug],
  );

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="section-pad py-24 text-center">
          {loading ? (
            <span className="text-muted-foreground">Загружаем…</span>
          ) : (
            <>
              <div className="font-head text-2xl font-medium uppercase tracking-tight">
                Статья не найдена
              </div>
              <Link
                to="/articles"
                className="mt-6 inline-flex items-center gap-2 border border-foreground px-5 py-3 text-[0.78rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
              >
                <Icon name="ArrowLeft" size={15} />
                Ко всем статьям
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
      <main className="section-pad">
        <Breadcrumbs
          items={[{ label: 'Статьи', to: '/articles' }, { label: article.title }]}
        />
        <div className="rule" />

        {/* Ширина колонки задана в em, а не в пикселях: она считается от
            размера шрифта, поэтому строка держит примерно одинаковое
            число знаков. 60em — около 950 пикселей: поля по краям уже не
            зияют, но строка ещё не становится такой длинной, чтобы глаз
            терял начало следующей. Во всю ширину экрана текст читать
            заметно труднее — потому и не растягиваем. */}
        <div className="mx-auto max-w-[60em]">
        <header className="py-10">
          {article.publishedAt && (
            <div className="text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">
              {dateText(article.publishedAt)}
            </div>
          )}
          <h1 className="mt-3 font-head text-3xl font-medium leading-tight tracking-tight sm:text-[2.6rem]">
            {articleHeading(article)}
          </h1>
          {article.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Обложка — иллюстрация к тексту, а не баннер во весь экран:
            держим её в ширине колонки и невысокой */}
        {article.cover && (
          <img
            src={article.cover}
            alt={article.title}
            className="mb-10 aspect-[16/9] w-full bg-card object-cover"
          />
        )}

        <ArticleContent article={article} />

        </div>

        {more.length > 0 && (
          <section className="mx-auto mt-20 max-w-[60em] border-t border-foreground pt-8">
            <div className="eyebrow">Читайте также</div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {more.map((a) => (
                <Link
                  key={a.slug}
                  to={`/articles/${a.slug}`}
                  className="group border-t border-border pt-4"
                >
                  <div className="font-head text-[1.05rem] font-medium leading-snug transition-colors group-hover:text-primary">
                    {a.title}
                  </div>
                  {a.excerpt && (
                    <p className="mt-2 text-[0.85rem] leading-snug text-muted-foreground">
                      {a.excerpt.slice(0, 110)}
                      {a.excerpt.length > 110 ? '…' : ''}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mx-auto max-w-[60em] py-14">
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 border border-foreground px-5 py-3 text-[0.78rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
          >
            <Icon name="ArrowLeft" size={15} />
            Ко всем статьям
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlePage;