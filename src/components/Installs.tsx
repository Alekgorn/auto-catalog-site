import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import InstallMap from '@/components/InstallMap';
import VideoPlayer from '@/components/VideoPlayer';
import { useCatalog } from '@/context/CatalogContext';
import { Install } from '@/data/catalog';
import { Link } from 'react-router-dom';

/** Сколько работ показываем в ленте сразу */
const SHOWN = 6;

/**
 * Лента выполненных работ на главной.
 *
 * Отвечает на вопрос, который человек задаёт себе на самом деле: не
 * «сколько стоит комплект», а «как это будет выглядеть в моей машине».
 * Опись коробки на этот вопрос не отвечает, фотография установленной
 * панели — отвечает сразу.
 *
 * Пара «было/стало» переключается на месте, а не лежит двумя кадрами
 * рядом: разница читается, только когда картинка меняется в той же
 * рамке. Поэтому и снимать их просим с одной точки.
 */
const Installs = () => {
  const { installs, products } = useCatalog();

  const list = useMemo(
    () => (installs ?? []).slice(0, SHOWN),
    [installs],
  );

  /** Какая работа раскрыта — открыта всегда одна */
  const [open, setOpen] = useState<string | null>(null);

  if (!list.length) return null;

  const nameOf = (slug: string) =>
    products.find((p) => p.id === slug)?.name ?? null;

  const card = (it: Install) => {
    const isOpen = open === it.slug;
    const heading =
      it.title || `${it.brand} ${it.model} ${it.year || ''}`.trim();

    return (
      <div key={it.slug} className="border border-border">
        <InstallPhoto install={it} />

        <div className="p-4">
          <div className="font-head text-[1rem] font-bold uppercase tracking-tight">
            {heading}
          </div>

          {/* Что стояло — коротко, названиями разделов */}
          {it.products.length > 0 && (
            <div className="mt-1 text-[0.78rem] leading-snug text-muted-foreground">
              {it.products
                .map((s) => nameOf(s))
                .filter(Boolean)
                .slice(0, 3)
                .join(' · ')}
            </div>
          )}

          {/* Строка мастера — самое ценное: из фото этого не видно */}
          {it.comment && (
            <p className="mt-3 border-l-2 border-primary pl-3 text-[0.83rem] leading-relaxed">
              {it.comment}
            </p>
          )}

          {(it.gallery?.length > 0 || it.video || it.place) && (
            <button
              onClick={() => setOpen(isOpen ? null : it.slug)}
              className="mt-3 flex items-center gap-1.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-primary"
            >
              {isOpen ? 'Свернуть' : 'Подробнее'}
              <Icon
                name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                size={14}
              />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="space-y-5 border-t border-border p-4">
            {/* Вертикальное видео — узкой колонкой, как в телефоне.
                В общий ряд с фото его ставить нельзя: другая форма,
                сетка бы развалилась */}
            {it.video && (
              <div className="mx-auto max-w-[280px]">
                <VideoPlayer url={it.video} title={heading} vertical />
              </div>
            )}

            {it.gallery?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {it.gallery.map((src, i) => (
                  <img
                    key={src + i}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full border border-border bg-card object-cover"
                  />
                ))}
              </div>
            )}

            {/* Адрес приходит с сервера, только если партнёр разрешил */}
            {it.place && (
              <div>
                {it.place.note && (
                  <p className="mb-3 text-[0.83rem] leading-relaxed text-muted-foreground">
                    {it.place.note}
                  </p>
                )}
                {it.place.coords ? (
                  <InstallMap
                    coords={it.place.coords}
                    name={it.place.name}
                    address={it.place.address}
                  />
                ) : (
                  <div className="flex items-start gap-3 border border-border p-4">
                    <Icon
                      name="MapPin"
                      size={17}
                      className="mt-0.5 flex-none text-primary"
                    />
                    <div>
                      <div className="font-head text-[0.9rem] font-medium">
                        {it.place.name}
                      </div>
                      <div className="mt-0.5 text-[0.8rem] text-muted-foreground">
                        {it.place.address}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ссылки на товары из комплекта */}
            {it.products.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {it.products.map((slug) => {
                  const name = nameOf(slug);
                  if (!name) return null;
                  return (
                    <Link
                      key={slug}
                      to={`/product/${slug}`}
                      className="border border-border px-3 py-1.5 text-[0.78rem] transition-colors hover:border-primary hover:text-primary"
                    >
                      {name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="installs" className="section-pad anchor-offset">
      <div className="rule" />
      <SectionHead
        index="03"
        eyebrow="Выполненные работы"
        title="Что можно поставить в вашу машину"
        note="Реальные установки: как выглядела панель до работы и что получилось. Оборудование из каждой — в каталоге, подойдёт и на вашу машину."
      />

      {/* Пока работ мало, сетка из трёх колонок смотрится пустой:
          одна карточка и два зияющих места. Раскладываем по числу
          записей, а с четырёх переходим на обычную сетку */}
      <div
        className={`grid gap-5 pb-10 ${
          list.length === 1
            ? 'grid-cols-1 sm:max-w-[26rem]'
            : list.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {list.map(card)}
      </div>
    </section>
  );
};

/**
 * Пара «было/стало» с переключением на месте.
 *
 * Вынесено отдельным компонентом: у каждой карточки своё состояние,
 * иначе нажатие на одной переключало бы все разом.
 */
const InstallPhoto = ({ install }: { install: Install }) => {
  const [before, setBefore] = useState(false);
  const has = !!install.beforeImage;
  const src = before && has ? install.beforeImage : install.afterImage;

  return (
    <div className="relative">
      <img
        src={src}
        alt={install.title || `${install.brand} ${install.model}`}
        loading="lazy"
        className="aspect-[4/3] w-full bg-card object-cover"
      />
      {has && (
        <div className="absolute bottom-0 left-0 flex">
          {(['Было', 'Стало'] as const).map((label, i) => {
            const active = (i === 0) === before;
            return (
              <button
                key={label}
                onClick={() => setBefore(i === 0)}
                className={`px-3 py-1.5 font-head text-[0.68rem] font-bold uppercase tracking-[0.08em] transition-colors ${
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
  );
};

export default Installs;
