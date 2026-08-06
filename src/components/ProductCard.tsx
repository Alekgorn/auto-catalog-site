import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import {
  Product,
  Vehicle,
  formatPrice,
  isCompatible,
  productImages,
} from '@/data/catalog';
import { useCart } from '@/context/CartContext';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
}

const ProductCard = ({ product, vehicle }: Props) => {
  const fits = isCompatible(product, vehicle);
  const { add, has } = useCart();
  const inCart = has(product.id);

  return (
    <article className="group flex flex-col border-t border-foreground pt-5 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <span className="eyebrow">{product.category}</span>
        {product.badge && (
          <span className="bg-primary px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary-foreground">
            {product.badge}
          </span>
        )}
      </div>

      <Link to={`/product/${product.id}`} className="mt-4 block overflow-hidden bg-card">
        <img
          src={productImages(product)[0]}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <h3 className="mt-4 font-head text-xl font-medium leading-tight tracking-tight">
        <Link to={`/product/${product.id}`} className="transition-colors hover:text-primary">
          {product.name}
        </Link>
      </h3>

      <dl className="mt-5 space-y-2 text-[0.82rem] text-muted-foreground">
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt>Крепление</dt>
          <dd className="text-right text-foreground">{product.mount}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt>Установка</dt>
          <dd className="text-right text-foreground">{product.install}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border pb-2">
          <dt>Гарантия</dt>
          <dd className="text-right text-foreground">{product.warranty}</dd>
        </div>
      </dl>

      <div
        className={`mt-5 flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.1em] ${
          vehicle ? (fits ? 'text-primary' : 'text-muted-foreground') : 'text-muted-foreground'
        }`}
      >
        <Icon
          name={vehicle ? (fits ? 'CircleCheck' : 'CircleSlash') : 'Info'}
          size={15}
        />
        {vehicle
          ? fits
            ? `Подходит: ${vehicle.brand} ${vehicle.model}, ${vehicle.year}`
            : 'Не подходит к выбранной машине'
          : `${product.years[0]}—${product.years[1]}`}
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <div>
          {product.oldPrice && (
            <div className="text-[0.8rem] text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </div>
          )}
          <div className="font-head text-2xl font-bold tracking-tight">
            {formatPrice(product.price)}
          </div>
        </div>
        <div className="flex items-center gap-2">
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