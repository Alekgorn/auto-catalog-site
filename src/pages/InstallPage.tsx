import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import InstallMap from '@/components/InstallMap';
import VideoPlayer from '@/components/VideoPlayer';
import PhotoViewer from '@/components/PhotoViewer';
import { useCatalog } from '@/context/CatalogContext';
import { useVehicle } from '@/hooks/use-vehicle';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';
import Breadcrumbs, { crumbsJsonLd } from '@/components/Breadcrumbs';

/**
 * Страница одной выполненной работы.
 *
 * Своя ссылка на каждую установку: её отправляют клиенту, который
 * спрашивает «а как это будет выглядеть у меня». Показывать ему всю
 * ленту на главной, чтобы он искал среди прочих свою машину, — плохой
 * ответ на такой вопрос.
 */
const InstallPage = () => {
  const { slug } = useParams();
  const { installs, allProducts, loading } = useCatalog();
  const { vehicle } = useVehicle();
  /** Какой кадр показываем: результат или панель до работы */
  const [before, setBefore] = useState(false);
  /** Снимок, открытый на весь экран */
  const [zoom, setZoom] = useState<number | null>(null);

  const install = useMemo(
    () => (installs ?? []).find((i) => i.slug === slug) ?? null,
    [installs, slug],
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setBefore(false);
  }, [slug]);

  const heading = install
    ? install.title ||
      `${install.brand} ${install.model} ${install.year || ''}`.trim()
    : '';

  /* Товары комплекта — берём из полного каталога: работа могла быть
     собрана на позиции, которую дилер скрыл фильтром наличия */
  const kit = useMemo(
    () =>
      (install?.products ?? [])
        .map((s) => allProducts.find((p) => p.id === s))
        .filter(Boolean),
    [install, allProducts],
  );

  const seo = useMemo(() => {
    if (!install) return null;
    const what = kit.map((p) => p!.name).join(', ');
    return {
      /* Заголовок владельца часто уже начинается со слова «установка»
         («Установка в Opel Corsa 2013») — второй раз его добавлять
         незачем, в выдаче это читается как оговорка */
      title: /установк/i.test(heading)
        ? `${heading} — фото до и после | ШТАТНО`
        : `${heading}: установка оборудования — фото до и после | ШТАТНО`,
      /* Короткое описание дополняем своими словами: в выдаче строка
         в сорок знаков выглядит обрывком, и поисковик всё равно
         дописывает её случайным куском страницы */
      description: (() => {
        const own = (install.excerpt || '').trim();
        const tail =
          `Фото панели до и после установки в ${heading}.` +
          (what ? ` Оборудование: ${what}.` : '');
        if (own.length >= 80) return own;
        return own ? `${own} ${tail}` : tail;
      })(),
      image: install.afterImage,
      canonical: `${SITE_URL}/installs/${install.slug}`,
      type: 'article' as const,
      jsonLd: [
        crumbsJsonLd([
          { label: 'Установки', to: '/installs' },
          { label: heading },
        ]),
      ],
    };
  }, [install, heading, kit]);

  useSeo(seo);

  if (loading && !install) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="section-pad py-24 text-center text-muted-foreground">
          Загружаем…
        </div>
        <Footer />
      </div>
    );
  }

  if (!install) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="section-pad py-24 text-center">
          <div className="font-head text-2xl font-bold uppercase">
            Работа не найдена
          </div>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 border border-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
          >
            На главную
            <Icon name="ArrowRight" size={15} />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const norm = (t: string) => t.trim().replace(/\s+/g, ' ').toLowerCase();
  const sameAsExcerpt =
    !!install.excerpt && norm(install.excerpt) === norm(install.comment ?? '');

  const hasBefore = !!install.beforeImage;
  const main = before && hasBefore ? install.beforeImage : install.afterImage;
  const gallery = install.gallery ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="section-pad">
          <Breadcrumbs
            items={[
              { label: 'Установки', to: '/installs' },
              { label: heading },
            ]}
          />
          <div className="rule" />

          <div className="mx-auto max-w-[60em]">
            <header className="py-10">
              <div className="eyebrow">Выполненная работа</div>
              <h1 className="mt-3 font-head text-3xl font-bold uppercase leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                {heading}
              </h1>
              {install.excerpt && (
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                  {install.excerpt}
                </p>
              )}
            </header>

            {/* Главный кадр с переключением: разница читается, только
                когда картинка меняется в той же рамке */}
            <div className="relative">
              <img
                src={main}
                alt={heading}
                className="aspect-[4/3] w-full bg-card object-cover sm:aspect-[16/9]"
              />
              {hasBefore && (
                <div className="absolute bottom-0 left-0 flex">
                  {(['Было', 'Стало'] as const).map((label, i) => {
                    const active = (i === 0) === before;
                    return (
                      <button
                        key={label}
                        onClick={() => setBefore(i === 0)}
                        className={`px-4 py-2 font-head text-[0.75rem] font-bold uppercase tracking-[0.08em] transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-foreground/75 text-background hover:bg-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Слово мастера — самое ценное: из фото этого не видно.
                Если оно дословно повторяет вступление сверху, второй раз
                не показываем: заполняя карточку, одно и то же легко
                вписать в оба поля */}
            {install.comment && !sameAsExcerpt && (
              <p className="mt-6 border-l-2 border-primary pl-4 text-[0.95rem] leading-relaxed">
                {install.comment}
              </p>
            )}

            {/* Вертикальный ролик — узкой колонкой, как в телефоне */}
            {install.video && (
              <div className="mt-10">
                <div className="eyebrow mb-3">Как это выглядит</div>
                <div className="mx-auto max-w-[320px]">
                  <VideoPlayer url={install.video} title={heading} vertical />
                </div>
              </div>
            )}

            {gallery.length > 0 && (
              <div className="mt-10">
                <div className="eyebrow mb-3">Ещё фотографии</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((src, i) => (
                    <button
                      key={src + i}
                      onClick={() => setZoom(i)}
                      className="group relative block w-full cursor-zoom-in border border-border bg-card"
                    >
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <span className="pointer-events-none absolute bottom-1.5 right-1.5 bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100">
                        <Icon name="Maximize2" size={12} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Адрес приходит с сервера, только если партнёр разрешил */}
            {install.place && (
              <div className="mt-10">
                <div className="eyebrow mb-3">Где ставили</div>
                {install.place.note && (
                  <p className="mb-4 leading-relaxed text-muted-foreground">
                    {install.place.note}
                  </p>
                )}
                {install.place.coords ? (
                  <InstallMap
                    coords={install.place.coords}
                    name={install.place.name}
                    address={install.place.address}
                  />
                ) : (
                  <div className="flex items-start gap-3 border border-border p-4">
                    <Icon
                      name="MapPin"
                      size={18}
                      className="mt-0.5 flex-none text-primary"
                    />
                    <div>
                      <div className="font-head text-[0.95rem] font-medium">
                        {install.place.name}
                      </div>
                      <div className="mt-0.5 text-[0.85rem] text-muted-foreground">
                        {install.place.address}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Комплект — во всю ширину: карточки товаров как в каталоге */}
        {kit.length > 0 && (
          <section className="section-pad">
            <div className="rule" />
            <div className="py-10">
              <div className="eyebrow">Из чего собрано</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Оборудование из этой работы
              </h2>
              <p className="mt-4 max-w-[42em] text-muted-foreground">
                Всё есть в каталоге. Подойдёт и на вашу машину — проверьте
                совместимость по марке и году.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
              {kit.map((p) => (
                <ProductCard key={p!.id} product={p!} vehicle={vehicle} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <PhotoViewer
        images={gallery}
        alt={heading}
        index={zoom}
        onClose={() => setZoom(null)}
      />
    </div>
  );
};

export default InstallPage;
