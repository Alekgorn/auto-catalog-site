import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  images: string[];
  alt: string;
  /** Какое фото открыть; null — просмотр закрыт */
  index: number | null;
  onClose: () => void;
}

/**
 * Фото товара во весь экран.
 *
 * Закрывается кликом по тёмному фону, крестиком или Esc. Между фото
 * ходим стрелками, клавишами ← → и свайпом на телефоне.
 */
const PhotoViewer = ({ images, alt, index, onClose }: Props) => {
  const [current, setCurrent] = useState(0);
  /** Точка начала касания — чтобы отличить свайп от простого тапа */
  const [touchX, setTouchX] = useState<number | null>(null);

  const open = index !== null && images.length > 0;
  const many = images.length > 1;

  useEffect(() => {
    if (index !== null) setCurrent(index);
  }, [index]);

  const go = useCallback(
    (step: number) => {
      // По кругу: с последнего фото попадаем на первое
      setCurrent((i) => (i + step + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    // Фон не должен ездить под открытым фото
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, go]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-foreground/95 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — просмотр фото`}
    >
      <div className="flex flex-none items-center justify-between gap-4 px-4 py-3 text-background sm:px-6">
        <div className="min-w-0 text-[0.8rem] uppercase tracking-[0.08em] text-background/70">
          {many && `${current + 1} / ${images.length}`}
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть просмотр"
          className="-mr-1 flex items-center gap-2 p-1 text-background/80 transition-colors hover:text-background"
        >
          <span className="hidden text-[0.8rem] uppercase tracking-[0.06em] sm:inline">
            Закрыть
          </span>
          <Icon name="X" size={24} />
        </button>
      </div>

      {/* Клик мимо фото закрывает просмотр: сам снимок клик не пропускает */}
      <button
        aria-label="Закрыть просмотр"
        onClick={onClose}
        className="relative min-h-0 flex-1 cursor-zoom-out"
        onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchX === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
          if (many && Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
          setTouchX(null);
        }}
      >
        <img
          key={images[current]}
          src={images[current]}
          alt={`${alt} — фото ${current + 1}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 m-auto max-h-full max-w-full cursor-default object-contain p-2 sm:p-4"
        />

        {many && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Предыдущее фото"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-background/90 text-foreground transition-colors hover:bg-background sm:left-5 sm:h-14 sm:w-14"
            >
              <Icon name="ChevronLeft" size={26} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Следующее фото"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-background/90 text-foreground transition-colors hover:bg-background sm:right-5 sm:h-14 sm:w-14"
            >
              <Icon name="ChevronRight" size={26} />
            </button>
          </>
        )}
      </button>

      {many && (
        <div className="flex-none overflow-x-auto px-4 py-3 sm:px-6">
          <div className="mx-auto flex w-max gap-2">
            {images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setCurrent(i)}
                aria-label={`Фото ${i + 1}`}
                className={`h-14 w-14 flex-none border bg-background transition-colors sm:h-16 sm:w-16 ${
                  i === current
                    ? 'border-primary'
                    : 'border-background/30 hover:border-background'
                }`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain p-1"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoViewer;
