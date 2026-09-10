import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import PhotoViewer from '@/components/PhotoViewer';
import VideoPlayer from '@/components/VideoPlayer';
import ProductCard from '@/components/ProductCard';
import { useCatalog } from '@/context/CatalogContext';
import { useVehicle } from '@/hooks/use-vehicle';
import { Article, ArticleBlock } from '@/data/catalog';
import { renderRich } from '@/lib/rich-text';

interface Props {
  article: Article;
}

/**
 * Тело статьи.
 *
 * Абзацы, подзаголовки и списки дают странице структуру, которую читает
 * поисковик. Товары не копируются в текст, а подтягиваются из каталога
 * по ссылке — цена и наличие в статье всегда те же, что в магазине.
 */
/**
 * Приводим адрес кнопки к внутреннему пути.
 *
 * В редактор адрес нередко вставляют прямо из адресной строки, целиком
 * со своим доменом. Тогда получалось «/https://штатно.рф/scenario/...»
 * — ссылка вела в никуда, а сборщик страниц ругался на двойной слэш.
 * Отрезаем свой домен и лишний слэш; чужие ссылки не трогаем — они
 * отдаются как есть.
 */
const innerHref = (raw?: string): string => {
  const href = (raw ?? '').trim();
  if (!href) return '/';
  // Свой домен в любом написании — и кириллицей, и в служебном виде
  const own = href.replace(
    /^\/?https?:\/\/(?:www\.)?(?:штатно\.рф|xn--80a0adnb7a\.xn--p1ai)/i,
    '',
  );
  if (own !== href) return own || '/';
  // Чужая ссылка — оставляем как есть
  if (/^https?:\/\//i.test(href)) return href;
  return href.startsWith('/') ? href : `/${href}`;
};

const ArticleContent = ({ article }: Props) => {
  const { allProducts } = useCatalog();
  const { vehicle } = useVehicle();
  const [zoom, setZoom] = useState<number | null>(null);

  const blocks = useMemo(() => article.blocks ?? [], [article.blocks]);

  const photos = useMemo(
    () =>
      blocks.flatMap((b) =>
        b.type === 'image' && b.image ? [b.image] : b.type === 'step' && b.image ? [b.image] : [],
      ),
    [blocks],
  );

  const bySlug = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts],
  );

  const render = (b: ArticleBlock, i: number) => {
    switch (b.type) {
      case 'heading': {
        const Tag = (b.level ?? 2) === 3 ? 'h3' : 'h2';
        return (
          <Tag
            key={i}
            className={
              (b.level ?? 2) === 3
                ? 'pt-2 font-head text-xl font-medium leading-snug tracking-tight'
                : 'border-t border-foreground pt-5 font-head text-2xl font-medium leading-snug tracking-tight sm:text-[1.7rem]'
            }
          >
            {b.text}
          </Tag>
        );
      }

      case 'text':
        return (
          <p key={i} className="leading-relaxed text-muted-foreground">
            {renderRich(b.text)}
          </p>
        );

      case 'list': {
        const Tag = b.ordered ? 'ol' : 'ul';
        return (
          <Tag key={i} className="space-y-2.5">
            {b.items
              .filter((x) => x.trim())
              .map((item, k) => (
                <li key={k} className="flex gap-3 leading-relaxed text-muted-foreground">
                  <span className="flex-none font-head text-[0.8rem] font-bold text-primary">
                    {b.ordered ? `${k + 1}.` : '—'}
                  </span>
                  <span>{renderRich(item)}</span>
                </li>
              ))}
          </Tag>
        );
      }

      case 'table':
        return (
          <figure key={i} className="overflow-x-auto">
            <table className="w-full min-w-[32em] border-collapse text-[0.87rem]">
              <thead>
                <tr>
                  {b.head.map((h, c) => (
                    <th
                      key={c}
                      className="border border-border bg-card p-3 text-left font-head text-[0.75rem] font-bold uppercase tracking-[0.06em]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className="border border-border p-3 leading-snug text-muted-foreground"
                      >
                        {renderRich(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {b.caption && (
              <figcaption className="mt-2 text-[0.8rem] text-muted-foreground">
                {b.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'note':
        return (
          <div
            key={i}
            className="flex items-start gap-3 border-l-2 border-primary bg-card px-5 py-4"
          >
            <Icon name="Info" size={17} className="mt-0.5 flex-none text-primary" />
            <span className="text-[0.92rem] leading-relaxed">{renderRich(b.text)}</span>
          </div>
        );

      case 'quote':
        return (
          <blockquote key={i} className="border-l-2 border-foreground pl-5">
            <p className="font-head text-lg leading-relaxed">{renderRich(b.text)}</p>
            {b.author && (
              <footer className="mt-2 text-[0.82rem] uppercase tracking-[0.08em] text-muted-foreground">
                {b.author}
              </footer>
            )}
          </blockquote>
        );

      case 'faq':
        return (
          <div key={i} className="space-y-4">
            {b.items
              .filter((x) => x.q.trim())
              .map((qa, k) => (
                <div key={k} className="border-t border-border pt-4">
                  <h3 className="font-head text-[1.05rem] font-medium leading-snug">
                    {qa.q}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {renderRich(qa.a)}
                  </p>
                </div>
              ))}
          </div>
        );

      case 'product': {
        const p = bySlug.get(b.slug);
        if (!p) return null;
        return (
          <div key={i} className="max-w-[26em]">
            <ProductCard product={p} vehicle={vehicle} />
            {b.note && (
              <p className="mt-2 text-[0.83rem] leading-snug text-muted-foreground">
                {b.note}
              </p>
            )}
          </div>
        );
      }

      case 'products': {
        const items = b.slugs.map((s) => bySlug.get(s)).filter(Boolean);
        if (!items.length) return null;
        return (
          <div key={i}>
            {b.title && (
              <h2 className="mb-5 border-t border-foreground pt-5 font-head text-2xl font-medium tracking-tight">
                {b.title}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p!.id} product={p!} vehicle={vehicle} />
              ))}
            </div>
          </div>
        );
      }

      case 'cta':
        return (
          <div
            key={i}
            className="border border-foreground bg-card px-6 py-7 sm:px-8"
          >
            <h2 className="font-head text-2xl font-medium leading-tight tracking-tight">
              {b.title}
            </h2>
            {b.text && (
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {renderRich(b.text)}
              </p>
            )}
            <Link
              to={innerHref(b.buttonHref)}
              className="mt-5 inline-flex items-center gap-2 bg-primary px-6 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.08em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              {b.buttonText}
              <Icon name="ArrowRight" size={15} />
            </Link>
          </div>
        );

      case 'image':
        if (!b.image) return null;
        return (
          <figure key={i}>
            <button
              onClick={() => setZoom(photos.indexOf(b.image))}
              aria-label="Открыть фото на весь экран"
              className="group relative block w-full cursor-zoom-in border border-border bg-card"
            >
              <img
                src={b.image}
                alt={b.caption ?? article.title}
                loading="lazy"
                decoding="async"
                className="w-full object-contain p-1.5"
              />
              <span className="pointer-events-none absolute bottom-1.5 right-1.5 bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100">
                <Icon name="Maximize2" size={12} />
              </span>
            </button>
            {b.caption && (
              <figcaption className="mt-2 text-[0.83rem] leading-snug text-muted-foreground">
                {b.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'video':
        return (
          <figure key={i}>
            <VideoPlayer url={b.video} title={article.title} />
            {b.caption && (
              <figcaption className="mt-2 text-[0.85rem] leading-snug text-muted-foreground">
                {b.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'step':
        return (
          <div key={i}>
            <h3 className="font-head text-lg font-medium leading-snug">{b.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {renderRich(b.text)}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="space-y-7">{blocks.map(render)}</div>
      <PhotoViewer
        images={photos}
        alt={article.title}
        index={zoom}
        onClose={() => setZoom(null)}
      />
    </div>
  );
};

export default ArticleContent;
