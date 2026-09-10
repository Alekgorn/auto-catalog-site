import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHead from '@/components/SectionHead';
import { useCatalog } from '@/context/CatalogContext';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';
import Breadcrumbs from '@/components/Breadcrumbs';

/**
 * Все выполненные работы списком.
 *
 * На главной показываем последние шесть, здесь — всё. Когда работ
 * накопится много, человеку нужен способ найти свою машину, поэтому
 * сверху фильтр по маркам: он появляется сам, как только марок
 * становится больше одной.
 */
const Installs = () => {
  const { installs, loading } = useCatalog();
  const [brand, setBrand] = useState('');

  useSeo({
    title: 'Наши установки: фото до и после | ШТАТНО',
    description:
      'Выполненные работы по установке магнитол, рамок и проводки. Фотографии панели до и после, состав комплекта и оборудование из каталога.',
    canonical: `${SITE_URL}/installs`,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const all = installs ?? [];

  /** Марки, по которым есть работы — с числом на кнопке */
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    all.forEach((i) => map.set(i.brand, (map.get(i.brand) ?? 0) + 1));
    return [...map.entries()]
      .map(([name, n]) => ({ name, n }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [all]);

  const list = useMemo(
    () => (brand ? all.filter((i) => i.brand === brand) : all),
    [all, brand],
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad">
        <Breadcrumbs items={[{ label: 'Установки' }]} />
        <div className="rule" />
        <SectionHead
          as="h1"
          index="04"
          eyebrow="Выполненные работы"
          title="Что можно поставить в вашу машину"
          note="Реальные установки: как выглядела панель до работы и что получилось. Оборудование из каждой — в каталоге, подойдёт и на вашу машину."
        />

        {loading && all.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground">
            Загружаем…
          </div>
        ) : all.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-head text-2xl font-medium uppercase tracking-tight">
              Скоро здесь появятся работы
            </div>
            <p className="mx-auto mt-3 max-w-[32em] text-muted-foreground">
              Мы собираем фотографии установленного оборудования: как
              выглядит панель до работы и что получается в итоге.
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center gap-2 border border-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
            >
              Перейти в каталог
              <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
        ) : (
          <>
            {/* Фильтр нужен, только когда марок больше одной */}
            {brands.length > 1 && (
              <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                <button
                  onClick={() => setBrand('')}
                  className={`px-3 py-1.5 text-[0.78rem] transition-colors ${
                    brand === ''
                      ? 'bg-foreground text-background'
                      : 'border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Все марки ({all.length})
                </button>
                {brands.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => setBrand(b.name)}
                    className={`px-3 py-1.5 text-[0.78rem] transition-colors ${
                      brand === b.name
                        ? 'bg-foreground text-background'
                        : 'border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {b.name} ({b.n})
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 py-10 pb-20 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((it) => {
                const heading =
                  it.title ||
                  `${it.brand} ${it.model} ${it.year || ''}`.trim();
                return (
                  <Link
                    key={it.slug}
                    to={`/installs/${it.slug}`}
                    className="group block border border-border transition-colors hover:border-primary"
                  >
                    <img
                      src={it.afterImage}
                      alt={heading}
                      loading="lazy"
                      className="aspect-[4/3] w-full bg-card object-cover"
                    />
                    <div className="p-4">
                      <div className="font-head text-[1rem] font-bold uppercase tracking-tight transition-colors group-hover:text-primary">
                        {heading}
                      </div>
                      {it.excerpt && (
                        <p className="mt-2 line-clamp-2 text-[0.83rem] leading-snug text-muted-foreground">
                          {it.excerpt}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-1.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-primary">
                        Смотреть работу
                        <Icon
                          name="ArrowRight"
                          size={13}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Installs;
