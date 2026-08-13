import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { slugify } from '@/lib/slug';
import FitsBrief from '@/components/FitsBrief';
import {
  CARD_FIELDS,
  Product,
  Vehicle,
  isCompatible,
  productImages,
  productSpecs,
} from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import PriceBlock from '@/components/PriceBlock';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
  /**
   * Режим сборки комплекта: кнопка не кладёт товар в корзину, а отмечает
   * его выбранным на своём шаге. Корзина заполняется одной кнопкой в конце.
   */
  picked?: boolean;
  onPick?: (product: Product) => void;
}

const ProductCard = ({ product, vehicle, picked, onPick }: Props) => {
  const fits = isCompatible(product, vehicle);
  const { add, has } = useCart();
  const { cardFields, categorySpecs } = useCatalog();
  const kitMode = !!onPick;
  const chosen = kitMode ? !!picked : has(product.id);

  const rows = CARD_FIELDS.filter((f) => cardFields.includes(f.key))
    .map((f) => ({ label: f.label, value: f.get(product) }))
    .filter((r) => r.value);

  // Важные параметры категории — видны сразу, без захода в товар
  const categoryRows = (() => {
    const wanted = categorySpecs[product.category] ?? [];
    if (!wanted.length) return [];
    const all = productSpecs(product);
    return wanted
      .map((field) => {
        const hit = all.find(
          ([k]) => k.trim().toLowerCase() === field.trim().toLowerCase(),
        );
        return hit ? { label: field, value: hit[1] } : null;
      })
      .filter((x): x is { label: string; value: string } => !!x);
  })();

  return (
    <article className="group flex flex-col bg-surface p-3 shadow-card transition-shadow duration-300 hover:shadow-card-hover sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <Link
          to={`/catalog/${slugify(product.category)}`}
          className="eyebrow truncate transition-colors hover:text-primary"
        >
          {product.category}
        </Link>
        {product.badge && (
          <span className="bg-primary px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary-foreground">
            {product.badge}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent('quickview:open', { detail: product.id }),
          )
        }
        aria-label={`Быстрый просмотр: ${product.name}`}
        className="relative mt-4 block w-full overflow-hidden bg-surface-muted text-left"
      >
        <img
          src={productImages(product)[0]}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Подсказка: фото открывает характеристики, а не страницу товара */}
        {/* На телефоне — компактный значок в углу, на широком экране — полоса при наведении */}
        <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5 bg-foreground/85 px-2 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.08em] text-background sm:hidden">
          <Icon name="Eye" size={12} />
          Обзор
        </span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-center justify-center gap-2 bg-foreground/80 py-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:flex">
          <Icon name="Eye" size={14} />
          Быстрый просмотр
        </span>

        {vehicle && fits && (
          <span className="absolute left-0 top-2 flex items-center gap-1.5 bg-success px-2 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.08em] text-success-foreground sm:top-3 sm:gap-2 sm:px-3 sm:py-2 sm:text-[0.7rem]">
            <Icon name="Check" size={12} strokeWidth={3} />
            Подходит
          </span>
        )}
      </button>

      <h3 className="mt-3 font-head text-[0.98rem] font-medium leading-tight tracking-tight sm:mt-4 sm:text-xl">
        <Link to={`/product/${product.id}`} className="transition-colors hover:text-primary">
          {product.name}
        </Link>
      </h3>

      <FitsBrief product={product} />

      {rows.length > 0 && (
        <dl className="mt-5 hidden space-y-2 text-[0.82rem] text-muted-foreground sm:block">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex justify-between gap-4 border-b border-border pb-2"
            >
              <dt>{r.label}</dt>
              <dd className="text-right text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {categoryRows.length > 0 && (
        <dl className="mt-4 hidden space-y-2 text-[0.82rem] text-muted-foreground sm:block">
          {categoryRows.map((r) => (
            <div
              key={r.label}
              className="flex justify-between gap-4 border-b border-border pb-2"
            >
              <dt>{r.label}</dt>
              <dd className="text-right text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {vehicle && fits ? (
        <div className="mt-3 flex items-start gap-2 border border-success bg-success-soft px-2.5 py-2 sm:mt-5 sm:gap-3 sm:px-4 sm:py-3">
          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success text-success-foreground">
            <Icon name="Check" size={13} strokeWidth={3} />
          </span>
          <span className="text-[0.78rem] font-medium leading-snug text-success sm:text-[0.85rem]">
            Подходит к вашему автомобилю
            <span className="block font-normal">
              {vehicle.brand} {vehicle.model}, {vehicle.year} г.
            </span>
          </span>
        </div>
      ) : (
        vehicle && (
          <div className="mt-5 flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
            <Icon name="CircleSlash" size={15} />
            Не подходит к выбранной машине
          </div>
        )
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-4 sm:pt-6">
        <div className="flex-none">
          <PriceBlock product={product} />
        </div>
        <div className="flex w-full flex-none items-center gap-2 sm:w-auto">
          <Link
            to={`/product/${product.id}`}
            className="hidden border border-border px-4 py-3 font-head text-[0.78rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-foreground sm:block"
          >
            Подробнее
          </Link>
          <button
            onClick={() => (onPick ? onPick(product) : add(product))}
            className={`flex w-full items-center justify-center gap-2 border px-4 py-2.5 font-head text-[0.75rem] font-medium uppercase tracking-[0.08em] transition-colors sm:w-auto sm:py-3 sm:text-[0.78rem] ${
              chosen
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground'
            }`}
          >
            {chosen ? 'В заказе' : 'В заказ'}
            <Icon name={chosen ? 'Check' : 'Plus'} size={15} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;