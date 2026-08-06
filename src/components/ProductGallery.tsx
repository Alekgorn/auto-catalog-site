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
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3">
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
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
