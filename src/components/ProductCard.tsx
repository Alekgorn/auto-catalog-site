import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { slugify } from '@/lib/slug';
import FitsBrief from '@/components/FitsBrief';
import {
  CARD_FIELDS,
  Product,
  Vehicle,
  formatPrice,
  isCompatible,
  productImages,
  productSpecs,
} from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
  /** Крупная плитка бенто-сетки: выше изображение, увеличенный заголовок */
  featured?: boolean;
}

const ProductCard = ({ product, vehicle, featured = false }: Props) => {
  const fits = isCompatible(product, vehicle);
  const { add, has } = useCart();
  const { cardFields, categorySpecs } = useCatalog();
  const inCart = has(product.id);

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
    <article
      className={`tex-grain lift group relative flex h-full flex-col border border-border/70 bg-surface ${
        featured ? 'p-6' : 'p-5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <Link
          to={`/catalog/${slugify(product.category)}`}
          className="eyebrow transition-colors hover:text-primary"
        >
          {product.category}
        </Link>
        {product.badge && (
          <span className="bg-primary px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary-foreground">
            {product.badge}
          </span>
        )}
      </div>

      <Link
        to={`/product/${product.id}`}
        className={`tex-hatch relative mt-4 block overflow-hidden border border-border/60 ${
          featured ? 'min-h-[240px] flex-1' : ''
        }`}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/[0.05]" />
        <img
          src={productImages(product)[0]}
          alt={product.name}
          loading="lazy"
          className={`relative object-contain p-4 drop-shadow-[0_10px_18px_rgba(17,17,17,0.16)] transition-transform duration-500 group-hover:scale-[1.06] ${
            featured ? 'h-full w-full' : 'aspect-[4/3] w-full'
          }`}
        />
        {vehicle && fits && (
          <span className="absolute left-0 top-3 flex items-center gap-2 bg-success px-3 py-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-success-foreground">
            <Icon name="Check" size={14} strokeWidth={3} />
            Подходит
          </span>
        )}
      </Link>

      <h3
        className={`mt-4 font-head font-extrabold uppercase leading-[1.02] tracking-[-0.035em] ${
          featured ? 'text-[1.9rem] sm:text-[2.2rem]' : 'text-[1.35rem]'
        }`}
      >
        <Link to={`/product/${product.id}`} className="transition-colors hover:text-primary">
          {product.name}
        </Link>
      </h3>

      <FitsBrief product={product} />

      {rows.length > 0 && (
        <dl className="mt-5 space-y-2 text-[0.82rem] text-muted-foreground">
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
        <dl className="mt-4 space-y-2 text-[0.82rem] text-muted-foreground">
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
        <div className="mt-5 flex items-start gap-3 border border-success bg-success-soft px-4 py-3">
          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success text-success-foreground">
            <Icon name="Check" size={13} strokeWidth={3} />
          </span>
          <span className="text-[0.85rem] font-medium leading-snug text-success">
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

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-4 pt-6">
        <div className="flex-none">
          {product.oldPrice && (
            <div className="text-[0.8rem] text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </div>
          )}
          <div
            className={`whitespace-nowrap font-head font-black tracking-[-0.04em] ${
              featured ? 'text-[2.6rem]' : 'text-[1.9rem]'
            }`}
          >
            {formatPrice(product.price)}
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Link
            to={`/product/${product.id}`}
            className="border border-border px-4 py-3 font-head text-[0.78rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-foreground"
          >
            Подробнее
          </Link>
          <button
            onClick={() => add(product)}
            className={`flex items-center gap-2 border px-4 py-3 font-head text-[0.78rem] font-medium uppercase tracking-[0.08em] transition-colors ${
              inCart
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground'
            }`}
          >
            {inCart ? 'В заказе' : 'В заказ'}
            <Icon name={inCart ? 'Check' : 'Plus'} size={15} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;