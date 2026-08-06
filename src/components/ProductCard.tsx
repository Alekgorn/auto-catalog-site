import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  CARD_FIELDS,
  Product,
  Vehicle,
  formatPrice,
  isCompatible,
  productImages,
  productSku,
} from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
}

const ProductCard = ({ product, vehicle }: Props) => {
  const fits = isCompatible(product, vehicle);
  const { add, has } = useCart();
  const { cardFields } = useCatalog();
  const inCart = has(product.id);

  const rows = CARD_FIELDS.filter((f) => cardFields.includes(f.key))
    .map((f) => ({ label: f.label, value: f.get(product) }))
    .filter((r) => r.value);

  return (
    <article className="group flex flex-col bg-surface p-5 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <span className="eyebrow">
          {product.category} · {productSku(product)}
        </span>
        {product.badge && (
          <span className="bg-primary px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary-foreground">
            {product.badge}
          </span>
        )}
      </div>

      <Link
        to={`/product/${product.id}`}
        className="relative mt-4 block overflow-hidden bg-surface-muted"
      >
        <img
          src={productImages(product)[0]}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {vehicle && fits && (
          <span className="absolute left-0 top-3 flex items-center gap-2 bg-success px-3 py-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-success-foreground">
            <Icon name="Check" size={14} strokeWidth={3} />
            Подходит
          </span>
        )}
      </Link>

      <h3 className="mt-4 font-head text-xl font-medium leading-tight tracking-tight">
        <Link to={`/product/${product.id}`} className="transition-colors hover:text-primary">
          {product.name}
        </Link>
      </h3>

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
        <div className="mt-5 flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
          <Icon name={vehicle ? 'CircleSlash' : 'Info'} size={15} />
          {vehicle
            ? 'Не подходит к выбранной машине'
            : `${product.years[0]}—${product.years[1]}`}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-4 pt-6">
        <div className="flex-none">
          {product.oldPrice && (
            <div className="text-[0.8rem] text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </div>
          )}
          <div className="whitespace-nowrap font-head text-2xl font-bold tracking-tight">
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