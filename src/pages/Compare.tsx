import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import Breadcrumbs from '@/components/Breadcrumbs';
import CompareTable from '@/components/compare/CompareTable';
import ComparePhotos from '@/components/compare/ComparePhotos';
import { useCatalog } from '@/context/CatalogContext';
import { useCompare } from '@/context/CompareContext';
import { useKit } from '@/context/KitContext';
import { Product } from '@/data/catalog';
import { useProductTexts } from '@/hooks/use-product-text';
import { useSeo } from '@/hooks/use-seo';
import { SITE_URL } from '@/lib/seo';

/**
 * Сравнение товаров: характеристики выбранных моделей столбцами рядом.
 *
 * Если сравнение открыли во время сборки комплекта, под каждой моделью
 * появляется кнопка «Выбрать» — она кладёт позицию в сборку и возвращает
 * к сценарию. Уйти можно и не выбрав ничего: шаги продолжатся как были.
 */
const ComparePage = () => {
  const { ids, category, remove, clear } = useCompare();
  // Отмеченное к сравнению не пропадает из-за фильтра наличия
  const { allProducts: products } = useCatalog();
  const { steps, slug, pick: pickKit } = useKit();
  const navigate = useNavigate();

  const [photoId, setPhotoId] = useState<string | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(false);

  useSeo({
    title: 'Сравнение товаров | ШТАТНО',
    description:
      'Характеристики выбранных моделей рядом: экран, память, комплектация и цена.',
    canonical: `${SITE_URL}/compare`,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const chosen = useMemo(
    () =>
      ids
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => !!p),
    [ids, products],
  );
  /* Таблица сравнения строится по полным характеристикам — они лежат
     отдельным файлом и подъезжают следом за списком */
  const picked = useProductTexts(chosen);

  /* Идёт сборка и раздел сравнения — один из её шагов: можно выбрать сразу */
  const kitStep = steps.find((s) => s.category === category);
  const inKitFlow = !!kitStep && !!slug;

  const takeToKit = (product: Product) => {
    pickKit(product);
    clear();
    navigate(`/scenario/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="section-pad pb-16">
        <Breadcrumbs items={[{ label: 'Сравнение' }]} />

        <div className="rule" />

        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow">
              {category ? category : 'Выбранные товары'}
            </div>
            <h1 className="mt-3 font-head text-3xl font-bold uppercase leading-tight tracking-tight md:text-[42px]">
              Сравнение
            </h1>
            {inKitFlow && (
              <p className="mt-3 max-w-[40em] text-[0.88rem] leading-relaxed text-muted-foreground">
                Выберите подходящую модель — она встанет в сборку на шаге
                «{kitStep?.title ?? category}». Можно закрыть сравнение и
                ничего не выбирать: шаги продолжатся как были.
              </p>
            )}
          </div>

          {picked.length > 0 && (
            <div className="flex flex-none flex-wrap items-center gap-2">
              <button
                onClick={() => setOnlyDiff((v) => !v)}
                className={`flex items-center gap-2 border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.08em] transition-colors ${
                  onlyDiff
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-foreground hover:border-primary hover:text-primary'
                }`}
              >
                <Icon name="Filter" size={15} />
                Только отличия
              </button>
              <button
                onClick={clear}
                className="flex items-center gap-2 border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name="Trash2" size={15} />
                Очистить
              </button>
            </div>
          )}
        </div>

        {picked.length === 0 ? (
          <div className="py-16 text-center">
            <Icon
              name="Scale"
              size={40}
              className="mx-auto text-muted-foreground"
            />
            <div className="mt-4 font-head text-xl font-bold uppercase">
              Пока нечего сравнивать
            </div>
            <p className="mx-auto mt-3 max-w-[34em] text-[0.9rem] leading-relaxed text-muted-foreground">
              Нажмите «Сравнить» на паре товаров в каталоге — покажем их
              характеристики рядом. Сравнивать можно модели одного раздела:
              у магнитолы и регистратора нет общих параметров.
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.1em] text-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              Открыть каталог
              <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
        ) : picked.length === 1 ? (
          <div className="border border-border bg-surface px-5 py-6 text-center">
            <div className="font-head text-lg font-bold uppercase">
              Нужен ещё хотя бы один товар
            </div>
            <p className="mx-auto mt-2 max-w-[32em] text-[0.88rem] leading-relaxed text-muted-foreground">
              Вернитесь в каталог и отметьте вторую модель из раздела
              «{category}» — тогда покажем их характеристики рядом.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-5 inline-flex items-center gap-2 border border-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
            >
              <Icon name="ArrowLeft" size={15} />
              Вернуться к выбору
            </button>
          </div>
        ) : (
          <>
            <CompareTable
              products={picked}
              onRemove={remove}
              onPhoto={(p) => setPhotoId(p.id)}
              onPick={inKitFlow ? takeToKit : undefined}
              onlyDiff={onlyDiff}
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 border border-foreground px-5 py-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name="ArrowLeft" size={15} />
                {inKitFlow ? 'Закрыть и продолжить сборку' : 'Назад к каталогу'}
              </button>
              <span className="text-[0.8rem] text-muted-foreground">
                Нажмите на фото, чтобы рассмотреть модели крупно
              </span>
            </div>
          </>
        )}
      </main>

      <ComparePhotos
        products={picked}
        startId={photoId}
        onClose={() => setPhotoId(null)}
      />

      <Footer />
    </div>
  );
};

export default ComparePage;