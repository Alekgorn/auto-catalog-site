import Icon from '@/components/ui/icon';
import { Product, Vehicle, formatPrice, isCompatible } from '@/data/catalog';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
  onRequest: (p: Product) => void;
}

const ProductCard = ({ product, vehicle, onRequest }: Props) => {
  const fits = isCompatible(product, vehicle);

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

      <h3 className="mt-4 font-head text-xl font-medium leading-tight tracking-tight">
        {product.name}
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
        <button
          onClick={() => onRequest(product)}
          className="flex items-center gap-2 border border-foreground px-4 py-3 font-head text-[0.78rem] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
        >
          Заявка
          <Icon name="ArrowRight" size={15} />
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
