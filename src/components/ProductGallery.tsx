import { useState } from 'react';
import Icon from '@/components/ui/icon';
import PhotoViewer from '@/components/PhotoViewer';

interface Props {
  images: string[];
  alt: string;
}

const ProductGallery = ({ images, alt }: Props) => {
  const [active, setActive] = useState(0);
  /** Какое фото открыто во весь экран; null — просмотр закрыт */
  const [zoom, setZoom] = useState<number | null>(null);

  return (
    <div>
      <div className="group relative border border-border bg-surface shadow-card">
        <button
          onClick={() => setZoom(active)}
          aria-label="Открыть фото на весь экран"
          className="block w-full cursor-zoom-in"
        >
          <img
            src={images[active]}
            alt={`${alt} — фото ${active + 1}`}
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

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
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
