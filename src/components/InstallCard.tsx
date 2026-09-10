import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import InstallMap from '@/components/InstallMap';
import VideoPlayer from '@/components/VideoPlayer';
import { Install } from '@/data/catalog';

interface Props {
  install: Install;
  /** Названия товаров по адресу — чтобы не тащить сюда весь каталог */
  nameOf: (slug: string) => string | null;
  /** Раскрыть подробности сразу: на странице товара место есть */
  defaultOpen?: boolean;
  /** Товар, со страницы которого смотрим — его в списке не повторяем */
  currentSlug?: string;
}

/**
 * Пара «было/стало» с переключением на месте.
 *
 * Своё состояние на каждую карточку: с общим нажатие на одной
 * переключало бы разом все.
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

/**
 * Выполненная работа: фото результата, состав комплекта, слово мастера.
 *
 * Один компонент на два места — ленту на главной и вкладку в карточке
 * товара. Разница только в том, раскрыты ли подробности сразу.
 */
const InstallCard = ({
  install: it,
  nameOf,
  defaultOpen = false,
  currentSlug,
}: Props) => {
  const [open, setOpen] = useState(defaultOpen);
  const heading = it.title || `${it.brand} ${it.model} ${it.year || ''}`.trim();
  const hasMore = it.gallery?.length > 0 || !!it.video || !!it.place;

  /* На странице товара незачем ссылаться на неё же — показываем
     остальное из комплекта, это и есть подсказка «что ещё нужно» */
  const others = it.products.filter((s) => s !== currentSlug);

  return (
    <div className="border border-border">
      <InstallPhoto install={it} />

      <div className="p-4">
        <div className="font-head text-[1rem] font-bold uppercase tracking-tight">
          {heading}
        </div>

        {others.length > 0 && (
          <div className="mt-1 text-[0.78rem] leading-snug text-muted-foreground">
            {others
              .map((s) => nameOf(s))
              .filter(Boolean)
              .slice(0, 3)
              .join(' · ')}
          </div>
        )}

        {it.comment && (
          <p className="mt-3 border-l-2 border-primary pl-3 text-[0.83rem] leading-relaxed">
            {it.comment}
          </p>
        )}

        {hasMore && !defaultOpen && (
          <button
            onClick={() => setOpen(!open)}
            className="mt-3 flex items-center gap-1.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-primary"
          >
            {open ? 'Свернуть' : 'Подробнее'}
            <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} />
          </button>
        )}
      </div>

      {open && hasMore && (
        <div className="space-y-5 border-t border-border p-4">
          {/* Вертикальный ролик — узкой колонкой, как в телефоне.
              В общий ряд с фото не встаёт: другая форма кадра */}
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

          {others.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Что ещё стояло в этой машине</div>
              <div className="flex flex-wrap gap-2">
                {others.map((slug) => {
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstallCard;
