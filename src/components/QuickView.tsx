import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  Product,
  Vehicle,
  formatPrice,
  isCompatible,
  isUniversal,
  productImages,
  productKit,
  productSku,
  productSpecs,
} from '@/data/catalog';
import { isVehicle } from '@/lib/vehicle';
import { useCatalog } from '@/context/CatalogContext';
import { useKit } from '@/context/KitContext';

interface Props {
  product: Product | null;
  vehicle: Vehicle | null;
  onClose: () => void;
}

/** Быстрый просмотр: характеристики товара без ухода из каталога. */
const QuickView = ({ product, vehicle: rawVehicle, onClose }: Props) => {
  // Неполные данные машины = машина не выбрана
  const vehicle = isVehicle(rawVehicle) ? rawVehicle : null;
  const { brands } = useCatalog();
  /**
   * Идёт сборка комплекта — товар кладём в плавающую панель внизу,
   * а не сразу в корзину. В корзину всё уходит одной кнопкой из панели.
   */
  const { pick, has: inKit } = useKit();
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [product, onClose]);

  const specs = useMemo(() => {
    if (!product) return [];
    const base = productSpecs(product);
    const has = (k: string) => base.some(([n]) => n.toLowerCase() === k);
    const extra: [string, string][] = [];
    if (!has('гарантия')) extra.push(['Гарантия', product.warranty]);
    if (!has('артикул')) extra.push(['Артикул', productSku(product)]);
    return [...base, ...extra];
  }, [product]);

  if (!product) return null;

  const images = productImages(product);
  const fits = isCompatible(product, vehicle);
  /** Подходит любой машине по данным товара, а не «машина не выбрана» */
  const universal = isUniversal(product, brands.length);
  const inCart = inKit(product.id);
  const kit = productKit(product);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-0 sm:p-4 md:items-center">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/50 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-4xl bg-surface shadow-panel">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <div className="eyebrow">Быстрый просмотр</div>
            <h2 className="mt-1 truncate font-head text-lg font-bold uppercase leading-tight tracking-tight sm:text-xl">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-7 px-5 py-5 sm:px-7 md:grid-cols-2">
          <div>
            <div className="border border-border bg-surface-muted">
              <img
                src={images[active]}
                alt={product.name}
                className="aspect-[4/3] w-full object-contain p-4"
              />
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((src, i) => (
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
                      alt=""
                      className="aspect-square w-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 md:mt-0">
            {/* Машина не выбрана — товар доступен всем */}
            <div
              className={`mb-4 flex items-center gap-2.5 border px-3 py-2.5 text-[0.85rem] ${
                (!vehicle && universal) || (vehicle && fits)
                  ? 'border-success bg-success-soft text-success'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <Icon
                name={
                  (!vehicle && universal) || (vehicle && fits)
                    ? 'Check'
                    : !vehicle
                      ? 'Car'
                      : 'CircleSlash'
                }
                size={16}
                strokeWidth={(!vehicle && universal) || (vehicle && fits) ? 3 : 2}
              />
              {!vehicle
                ? universal
                  ? 'Подходит ко всем автомобилям'
                  : 'Подходит не всем машинам — укажите свою'
                : fits
                  ? `Подходит к ${vehicle.brand} ${vehicle.model}`
                  : `Не подходит к ${vehicle.brand} ${vehicle.model}`}
            </div>

            <div className="flex items-end gap-3">
              {product.oldPrice && (
                <span className="pb-0.5 text-[0.9rem] text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              <span className="font-head text-3xl font-bold tracking-tight">
                {formatPrice(product.price)}
              </span>
            </div>

            <div className="eyebrow mt-6">Технические данные</div>
            <dl className="mt-2 max-h-[280px] overflow-y-auto text-[0.88rem]">
              {specs.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-5 border-b border-border py-2.5"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>

            {kit.length > 0 && (
              <>
                <div className="eyebrow mt-5">Комплектация</div>
                <ul className="mt-2 space-y-1.5 text-[0.88rem]">
                  {kit.map((k) => (
                    <li key={k} className="flex items-start gap-2.5">
                      <Icon
                        name="Check"
                        size={14}
                        className="mt-1 flex-none text-primary"
                      />
                      {k}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:px-7">
          {/* Закрыть можно снизу — не нужно тянуться к крестику наверху */}
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 border border-border px-6 py-3.5 font-head text-[0.85rem] font-medium uppercase tracking-[0.02em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:flex-none"
          >
            <Icon name="X" size={16} />
            Закрыть
          </button>
          <button
            onClick={() => pick(product)}
            className={`flex flex-1 items-center justify-center gap-2 px-6 py-3.5 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] transition-colors ${
              inCart
                ? 'bg-primary text-primary-foreground'
                : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {inCart ? 'В заказе' : 'В заказ'}
            <Icon name={inCart ? 'Check' : 'Plus'} size={17} />
          </button>
          <Link
            to={`/product/${product.id}`}
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 border border-foreground px-6 py-3.5 font-head text-[0.85rem] font-medium uppercase tracking-[0.02em] transition-colors hover:border-primary hover:text-primary"
          >
            Открыть страницу
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuickView;
