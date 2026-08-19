import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Product, productImages } from '@/data/catalog';

interface Props {
  /** Все товары сравнения — между ними листаем стрелками */
  products: Product[];
  /** С какого начинаем; null — окно закрыто */
  startId: string | null;
  onClose: () => void;
}

/**
 * Фото товаров сравнения крупно. Часть отличий видна только глазами —
 * форма рамки, разъём, вид панели, — поэтому из таблицы можно открыть
 * снимки и пролистать их, не уходя со страницы.
 */
const ComparePhotos = ({ products, startId, onClose }: Props) => {
  const startIndex = Math.max(
    0,
    products.findIndex((p) => p.id === startId),
  );
  const [pos, setPos] = useState(startIndex);
  const [shot, setShot] = useState(0);

  /* Открыли на другом товаре — показываем его */
  useEffect(() => {
    if (!startId) return;
    const i = products.findIndex((p) => p.id === startId);
    setPos(i >= 0 ? i : 0);
    setShot(0);
  }, [startId, products]);

  useEffect(() => {
    if (!startId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setPos((v) => (v + 1) % products.length);
      if (e.key === 'ArrowLeft')
        setPos((v) => (v - 1 + products.length) % products.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [startId, onClose, products.length]);

  if (!startId || !products.length) return null;

  const product = products[pos] ?? products[0];
  const shots = productImages(product);
  const image = shots[Math.min(shot, shots.length - 1)];

  const step = (delta: number) => {
    setPos((v) => (v + delta + products.length) % products.length);
    setShot(0);
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-foreground/95">
      <div className="flex flex-none items-center justify-between gap-4 px-4 py-3 text-background">
        <div className="min-w-0">
          <div className="truncate font-head text-[0.95rem] font-bold uppercase tracking-tight">
            {product.name}
          </div>
          <div className="text-[0.72rem] opacity-70">
            Товар {pos + 1} из {products.length}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="flex-none p-1 transition-opacity hover:opacity-70"
        >
          <Icon name="X" size={24} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {products.length > 1 && (
          <button
            onClick={() => step(-1)}
            aria-label="Предыдущий товар"
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center border-2 border-background/70 bg-foreground/60 text-background transition-colors hover:border-background"
          >
            <Icon name="ChevronLeft" fallback="ArrowLeft" size={22} />
          </button>
        )}

        <img
          src={image}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
        />

        {products.length > 1 && (
          <button
            onClick={() => step(1)}
            aria-label="Следующий товар"
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center border-2 border-background/70 bg-foreground/60 text-background transition-colors hover:border-background"
          >
            <Icon name="ChevronRight" fallback="ArrowRight" size={22} />
          </button>
        )}
      </div>

      {/* Свои снимки товара — если их несколько */}
      {shots.length > 1 && (
        <div className="flex flex-none justify-center gap-2 overflow-x-auto px-4 py-3">
          {shots.map((src, i) => (
            <button
              key={src}
              onClick={() => setShot(i)}
              aria-label={`Снимок ${i + 1}`}
              className={`h-14 w-14 flex-none border-2 bg-background/90 transition-colors ${
                i === shot ? 'border-primary' : 'border-transparent'
              }`}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Переключение между товарами миниатюрами — быстрее стрелок */}
      {products.length > 1 && (
        <div className="flex flex-none justify-center gap-2 overflow-x-auto border-t border-background/20 px-4 py-3">
          {products.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setPos(i);
                setShot(0);
              }}
              title={p.name}
              className={`h-14 w-14 flex-none border-2 bg-background/90 transition-colors ${
                i === pos ? 'border-primary' : 'border-transparent opacity-60'
              }`}
            >
              <img
                src={productImages(p)[0]}
                alt=""
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComparePhotos;
