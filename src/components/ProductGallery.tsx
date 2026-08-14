import { useState } from 'react';

interface Props {
  images: string[];
  alt: string;
}

const ProductGallery = ({ images, alt }: Props) => {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="border border-border bg-surface shadow-card">
        <img
          src={images[active]}
          alt={`${alt} — фото ${active + 1}`}
          /* Главное фото на первом экране — грузим сразу, в первую очередь */
          fetchPriority="high"
          decoding="async"
          width={800}
          height={600}
          className="aspect-[4/3] max-h-[420px] w-full object-contain p-4"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
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
    </div>
  );
};

export default ProductGallery;
