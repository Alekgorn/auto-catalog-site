import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHead from '@/components/SectionHead';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotFound from '@/pages/NotFound';
import { LEGAL_DOCS } from '@/data/legal';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';

/**
 * Оферта и политика обработки данных.
 *
 * Одна страница на оба документа: вёрстка у них одинаковая, отличается
 * только текст. Читать такое приходят редко, но отсутствие документов
 * закрывает дорогу в Директ, на Маркет и в Авито для бизнеса.
 */
const LegalPage = () => {
  // Адрес и есть имя документа: /oferta, /privacy
  const slug = useLocation().pathname.replace(/\//g, '');
  const doc = LEGAL_DOCS[slug];

  useSeo(
    doc
      ? {
          title: `${doc.title} | ШТАТНО`,
          description: doc.note,
          canonical: `${SITE_URL}/${doc.slug}`,
        }
      : null,
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (!doc) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad">
        <Breadcrumbs items={[{ label: doc.title }]} />
        <div className="rule" />
        <SectionHead as="h1" eyebrow="Документы" title={doc.title} note={doc.note} />

        <article className="max-w-[52em] pb-16">
          {doc.sections.map((s) => (
            <section key={s.title} className="mt-10 first:mt-0">
              <h2 className="font-head text-lg font-bold tracking-tight">
                {s.title}
              </h2>
              {s.body.map((p, i) => (
                <p
                  key={i}
                  className={`mt-3 text-[0.95rem] leading-relaxed text-muted-foreground ${
                    // Пункты списка сдвигаем, чтобы перечисление читалось
                    p.startsWith('—') ? 'pl-4' : ''
                  }`}
                >
                  {p}
                </p>
              ))}
            </section>
          ))}

          <div className="mt-12 border-t border-border pt-5 text-sm text-muted-foreground">
            Редакция от {doc.updated}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;