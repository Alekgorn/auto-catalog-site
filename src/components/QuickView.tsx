import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import StockLine from '@/components/StockLine';
import {
  Product,
  Vehicle,
  formatPrice,
  isCompatible,
  fitsAll,
  isUniversal,
  productImages,
  productKit,
  productSku,
  productSpecs,
} from '@/data/catalog';
import { isVehicle } from '@/lib/vehicle';
import { useCatalog } from '@/context/CatalogContext';
import { useKit } from '@/context/KitContext';
import { useCart } from '@/context/CartContext';

interface Props {
  product: Product | null;
  vehicle: Vehicle | null;
  onClose: () => void;
}

/** Сколько характеристик показываем сразу — остальные под кнопкой */
const SPECS_SHOWN = 5;

/** Быстрый просмотр: главное о товаре без ухода из каталога. */
const QuickView = ({ product, vehicle: rawVehicle, onClose }: Props) => {
  // Неполные данные машины = машина не выбрана
  const vehicle = isVehicle(rawVehicle) ? rawVehicle : null;
  const { brands } = useCatalog();
  /**
   * Идёт сборка комплекта — товар отмечается на своём шаге и попадает
   * в плавающую панель внизу. Вне сборки такой панели нет, поэтому
   * товар должен уходить прямо в корзину: раньше кнопка «В заказ»
   * всегда звала сборку, и вне сценария товар пропадал в никуда.
   */
  const { pick, has: inKit, steps, slug } = useKit();
  const { add: addToCart, has: inCart } = useCart();
  const { pathname } = useLocation();
  /* Ровно то же правило, что и у панели сборки внизу: иначе товар
     уходил бы в сборку там, где панели нет, и покупатель его терял */
  const kitFlow =
    (!!slug && steps.length > 0 && pathname === `/scenario/${slug}`) ||
    pathname.startsWith('/compare');

  const [active, setActive] = useState(0);
  const [allSpecs, setAllSpecs] = useState(false);

  useEffect(() => {
    setActive(0);
    setAllSpecs(false);
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
  /** Марки не заданы — ограничений по авто нет */
  const anyCar = fitsAll(product);
  const chosen = kitFlow ? inKit(product.id) : inCart(product.id);
  const kit = productKit(product);

  const goodFit = anyCar || (!vehicle && universal) || (!!vehicle && fits);
  const shownSpecs = allSpecs ? specs : specs.slice(0, SPECS_SHOWN);
  const hiddenCount = specs.length - shownSpecs.length;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/50 backdrop-blur-[2px]"
      />

      {/* Окно не выше экрана: прокручивается только середина,
          шапка с ценой и кнопки всегда на виду */}
      <div className="relative flex h-[94vh] w-full max-w-3xl sm:h-auto flex-col bg-surface shadow-panel sm:max-h-[88vh]">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="eyebrow">Быстрый просмотр</div>
            <h2 className="mt-0.5 font-head text-[1.02rem] font-bold uppercase leading-tight tracking-tight sm:text-lg">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 flex-none p-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] sm:items-start">
            <div>
              <div className="border border-border bg-surface-muted">
                <img
                  src={images[active]}
                  alt={product.name}
                  className="aspect-[16/10] w-full object-contain p-3 sm:aspect-[4/3]"
                />
              </div>

              {images.length > 1 && (
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {images.slice(0, 5).map((src, i) => (
                    <button
                      key={src + i}
                      onClick={() => setActive(i)}
                      aria-label={`Фото ${i + 1}`}
                      className={`border bg-surface transition-colors ${
                        i === active
                          ? 'border-primary'
                          : 'border-border hover:border-foreground'
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

              {/* Комплектация — под фото: в правой колонке она уводила
                  окно вниз, а место слева пустовало */}
              {kit.length > 0 && (
                <div className="mt-4 hidden sm:block">
                  <div className="eyebrow">Комплектация</div>
                  <ul className="mt-1.5 space-y-1 text-[0.85rem]">
                    {kit.map((k) => (
                      <li key={k} className="flex items-start gap-2">
                        <Icon
                          name="Check"
                          size={13}
                          className="mt-1 flex-none text-primary"
                        />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              {/* Совместимость — первое, что нужно знать о товаре */}
              <div
                className={`flex items-center gap-2 border px-3 py-2 text-[0.82rem] ${
                  goodFit
                    ? 'border-success bg-success-soft text-success'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {/* У товара без заданных марок галку не ставим:
                    это не подбор под машину, а отсутствие ограничений */}
                {!anyCar && (
                  <Icon
                    name={
                      goodFit ? 'Check' : !vehicle ? 'Car' : 'CircleSlash'
                    }
                    size={15}
                    strokeWidth={goodFit ? 3 : 2}
                    className="flex-none"
                  />
                )}
                {anyCar
                  ? 'Подходит ко всем автомобилям'
                  : !vehicle
                    ? universal
                      ? 'Подходит ко всем автомобилям'
                      : 'Подходит не всем машинам — укажите свою'
                    : fits
                      ? `Подходит к ${vehicle.brand} ${vehicle.model}`
                      : `Не подходит к ${vehicle.brand} ${vehicle.model}`}
              </div>

              <div className="mt-3 flex items-end gap-3">
                {product.oldPrice && (
                  <span className="pb-0.5 text-[0.88rem] text-muted-foreground line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                <span className="font-head text-[1.75rem] font-bold leading-none tracking-tight">
                  {formatPrice(product.price)}
                </span>
              </div>

              <StockLine product={product} />

              {specs.length > 0 && (
                <>
                  <div className="eyebrow mt-4">Технические данные</div>
                  <dl className="mt-1.5 text-[0.85rem]">
                    {shownSpecs.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between gap-4 border-b border-border py-1.5"
                      >
                        <dt className="flex-none text-muted-foreground">{k}</dt>
                        <dd className="text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setAllSpecs(true)}
                      className="mt-2 flex items-center gap-1.5 text-[0.8rem] text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="ChevronDown" size={14} />
                      Ещё {hiddenCount}
                    </button>
                  )}
                </>
              )}

            </div>

            {/* На телефоне колонок нет — комплектация идёт последней */}
            {kit.length > 0 && (
              <div className="sm:hidden">
                <div className="eyebrow">Комплектация</div>
                <ul className="mt-1.5 space-y-1 text-[0.85rem]">
                  {kit.map((k) => (
                    <li key={k} className="flex items-start gap-2">
                      <Icon
                        name="Check"
                        size={13}
                        className="mt-1 flex-none text-primary"
                      />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:px-6">
          <button
            onClick={() => (kitFlow ? pick(product) : addToCart(product))}
            className={`flex flex-1 items-center justify-center gap-2 px-5 py-3 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] transition-colors ${
              chosen
                ? 'bg-primary text-primary-foreground'
                : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {/* В сборке товар отмечается на шаге, вне её — уходит в корзину.
                Подпись честно называет то, что произойдёт */}
            {kitFlow
              ? chosen
                ? 'Выбрано'
                : 'Выбрать'
              : chosen
                ? 'В корзине'
                : 'В корзину'}
            <Icon name={chosen ? 'Check' : 'Plus'} size={16} />
          </button>
          <Link
            to={`/product/${product.id}`}
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 border border-foreground px-5 py-3 font-head text-[0.85rem] font-medium uppercase tracking-[0.02em] transition-colors hover:border-primary hover:text-primary"
          >
            Все характеристики
            <Icon name="ArrowRight" size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuickView;