import { useState } from 'react';
import Icon from '@/components/ui/icon';
import PhotoViewer from '@/components/PhotoViewer';
import VideoPlayer from '@/components/VideoPlayer';
import { parseVideo } from '@/lib/video';

interface Props {
  images: string[];
  alt: string;
  /** Видео товара — своё или ссылка на YouTube/Rutube. Пусто — плитки нет */
  videoUrl?: string;
}

/** Обложка ролика в ленте миниатюр — берём первое фото, чтобы не звать плеер лишний раз */
const ProductGallery = ({ images, alt, videoUrl }: Props) => {
  const video = parseVideo(videoUrl);
  /** Число — открыто фото под этим индексом, 'video' — идёт ролик */
  const [active, setActive] = useState<number | 'video'>(0);
  /** Какое фото открыто во весь экран; null — просмотр закрыт. Видео так не открываем — у него свой fullscreen */
  const [zoom, setZoom] = useState<number | null>(null);

  return (
    <div>
      {active === 'video' && video ? (
        <div className="border border-border bg-surface shadow-card">
          <VideoPlayer url={videoUrl!} title={alt} />
        </div>
      ) : (
        <div className="group relative border border-border bg-surface shadow-card">
          <button
            onClick={() => setZoom(active as number)}
            aria-label="Открыть фото на весь экран"
            className="block w-full cursor-zoom-in"
          >
            <img
              src={images[active as number]}
              alt={`${alt} — фото ${(active as number) + 1}`}
              /* Главное фото на первом экране — грузим сразу, без ленивой загрузки */
              decoding="async"
              width={800}
              height={600}
              className="aspect-[4/3] max-h-[420px] w-full object-contain p-4"
            />
          </button>

          {/* Подсказка, что фото можно рассмотреть крупнее */}
          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 bg-foreground/80 px-2.5 py-1.5 text-[0.72rem] uppercase tracking-[0.06em] text-background opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name="Maximize2" size={13} />
            Увеличить
          </span>
        </div>
      )}

      {(images.length > 1 || video) && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {/* Видео стоит первым: это самый убедительный формат, покупатель
              должен заметить его сразу, не долистав до конца ленты */}
          {video && (
            <button
              onClick={() => setActive('video')}
              aria-label="Смотреть видео"
              className={`relative border bg-surface transition-colors ${
                active === 'video'
                  ? 'border-primary'
                  : 'border-border hover:border-foreground'
              }`}
            >
              <img
                src={images[0]}
                alt=""
                loading="lazy"
                decoding="async"
                width={160}
                height={160}
                className="aspect-square w-full object-contain p-1 opacity-60"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/85 text-background">
                  <Icon name="Play" size={13} className="ml-0.5" />
                </span>
              </span>
            </button>
          )}

          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              onDoubleClick={() => setZoom(i)}
              aria-label={`Фото ${i + 1}`}
              className={`border bg-surface transition-colors ${
                i === active ? 'border-primary' : 'border-border hover:border-foreground'
              }`}
            >
              <img
                src={src}
                alt={`${alt} — миниатюра ${i + 1}`}
                loading="lazy"
                decoding="async"
                width={160}
                height={160}
                className="aspect-square w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      <PhotoViewer
        images={images}
        alt={alt}
        index={zoom}
        onClose={() => setZoom(null)}
      />
    </div>
  );
};

export default ProductGallery;