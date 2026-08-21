import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import PhotoViewer from '@/components/PhotoViewer';
import { Guide, GuideBlock } from '@/data/catalog';

interface Props {
  guide: Guide;
  compact?: boolean;
}

/** Фото идущие подряд собираем в один ряд-галерею */
type Row =
  | { kind: 'block'; block: GuideBlock; index: number }
  | { kind: 'gallery'; items: { src: string; caption?: string }[] };

const GuideContent = ({ guide, compact = false }: Props) => {
  /** Какое фото открыто во весь экран; null — просмотр закрыт */
  const [zoom, setZoom] = useState<number | null>(null);

  const blocks = useMemo(() => guide.blocks ?? [], [guide.blocks]);

  /**
   * Все снимки материала в одном списке — просмотрщик листает их
   * подряд, включая фото шагов, а не только галереи.
   */
  const allPhotos = useMemo(() => {
    const out: string[] = [];
    blocks.forEach((b) => {
      if (b.type === 'image' && b.image) out.push(b.image);
      if (b.type === 'step' && b.image) out.push(b.image);
    });
    return out;
  }, [blocks]);

  const photoIndex = (src: string) => allPhotos.indexOf(src);

  /**
   * Несколько фото подряд — это галерея: показываем их плиткой,
   * а не колонкой во всю ширину. Так десяток скриншотов занимает
   * экран, а не полкилометра прокрутки.
   */
  const rows = useMemo(() => {
    const out: Row[] = [];
    blocks.forEach((block, index) => {
      if (block.type === 'image' && block.image) {
        const last = out[out.length - 1];
        const item = { src: block.image, caption: block.caption };
        if (last && last.kind === 'gallery') last.items.push(item);
        else out.push({ kind: 'gallery', items: [item] });
        return;
      }
      out.push({ kind: 'block', block, index });
    });
    return out;
  }, [blocks]);

  let stepNo = 0;

  return (
    <div>
      {!compact && guide.cover && (
        <img
          src={guide.cover}
          alt={guide.title}
          className="mb-8 aspect-[16/7] w-full bg-card object-cover"
        />
      )}

      {(guide.duration || guide.difficulty || guide.tools?.length > 0) && (
        <div className="mb-8 grid grid-cols-1 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
          {guide.duration && (
            <div>
              <div className="eyebrow">Время работ</div>
              <div className="mt-1 font-head text-lg font-medium">{guide.duration}</div>
            </div>
          )}
          {guide.difficulty && (
            <div>
              <div className="eyebrow">Сложность</div>
              <div className="mt-1 font-head text-lg font-medium">{guide.difficulty}</div>
            </div>
          )}
          {guide.tools?.length > 0 && (
            <div>
              <div className="eyebrow">Инструмент</div>
              <div className="mt-1 text-[0.9rem] text-muted-foreground">
                {guide.tools.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-8">
        {rows.map((row, ri) => {
          if (row.kind === 'gallery') {
            return (
              <div
                key={`g${ri}`}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                {row.items.map((item, k) => (
                  <figure key={item.src + k}>
                    <button
                      onClick={() => setZoom(photoIndex(item.src))}
                      aria-label="Открыть фото на весь экран"
                      className="group relative block w-full cursor-zoom-in border border-border bg-card"
                    >
                      <img
                        src={item.src}
                        alt={item.caption ?? ''}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full object-contain p-1.5"
                      />
                      <span className="pointer-events-none absolute bottom-1.5 right-1.5 bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100">
                        <Icon name="Maximize2" size={12} />
                      </span>
                    </button>
                    {item.caption && (
                      <figcaption className="mt-1.5 text-[0.78rem] leading-snug text-muted-foreground">
                        {item.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            );
          }

          const b = row.block;

          if (b.type === 'text') {
            return (
              <p
                key={row.index}
                className="max-w-[46em] leading-relaxed text-muted-foreground"
              >
                {b.text}
              </p>
            );
          }

          if (b.type === 'note') {
            return (
              <div
                key={row.index}
                className="flex max-w-[46em] items-start gap-3 border-l-2 border-primary bg-card px-5 py-4"
              >
                <Icon name="Info" size={17} className="mt-0.5 flex-none text-primary" />
                <span className="text-[0.92rem] leading-relaxed">{b.text}</span>
              </div>
            );
          }

          // Одиночные фото уже разобраны выше в галерею
          if (b.type === 'image') {
            return null;
          }

          stepNo += 1;
          return (
            <div
              key={row.index}
              className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-12"
            >
              <div className="md:col-span-6">
                <div className="flex items-baseline gap-4 border-t border-foreground pt-4">
                  <span className="font-head text-[0.72rem] font-medium tracking-[0.16em] text-primary">
                    {String(stepNo).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-head text-xl font-medium leading-tight tracking-tight">
                      {b.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{b.text}</p>
                  </div>
                </div>
              </div>
              {b.image && (
                <div className="md:col-span-4 md:col-start-8">
                  <button
                    onClick={() => setZoom(photoIndex(b.image as string))}
                    aria-label="Открыть фото на весь экран"
                    className="group relative block w-full cursor-zoom-in border border-border bg-card"
                  >
                    <img
                      src={b.image}
                      alt={b.title}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-contain p-1.5"
                    />
                    <span className="pointer-events-none absolute bottom-1.5 right-1.5 bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100">
                      <Icon name="Maximize2" size={12} />
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <PhotoViewer
        images={allPhotos}
        alt={guide.title}
        index={zoom}
        onClose={() => setZoom(null)}
      />
    </div>
  );
};

export default GuideContent;