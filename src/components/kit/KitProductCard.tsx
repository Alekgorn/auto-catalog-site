import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Product, Vehicle, isCompatible } from '@/data/catalog';
import PriceBlock from '@/components/PriceBlock';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
  picked: boolean;
  onPick: () => void;
}

/**
 * Карточка товара внутри сборки комплекта. В корзину сразу не кладём —
 * покупатель набирает позиции, а корзина заполняется одной кнопкой в конце.
 */
const KitProductCard = ({ product, vehicle, picked, onPick }: Props) => {
  const fits = vehicle ? isCompatible(product, vehicle) : false;

  return (
    <article
      className={`flex flex-col bg-surface p-3 transition-shadow sm:p-4 ${
        picked ? 'shadow-card-hover ring-2 ring-primary' : 'shadow-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="eyebrow truncate">{product.category}</span>
        {picked && (
          <span className="flex-none bg-primary px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-primary-foreground">
            Выбрано
          </span>
        )}
      </div>

      <h3 className="mt-2 font-head text-[0.95rem] font-bold leading-snug tracking-tight">
        <Link
          to={`/product/${product.id}`}
          className="transition-colors hover:text-primary"
        >
          {product.name}
        </Link>
      </h3>

      {vehicle && fits && (
        <div className="mt-3 flex items-center gap-2 text-[0.75rem] font-medium text-success">
          <Icon name="Check" size={14} strokeWidth={3} />
          Подходит вашей машине
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-3 pt-4">
        <PriceBlock product={product} />
        <button
          onClick={onPick}
          className={`flex w-full items-center justify-center gap-2 border px-4 py-2.5 font-head text-[0.75rem] font-medium uppercase tracking-[0.08em] transition-colors sm:w-auto ${
            picked
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          {picked ? (
            <>
              <Icon name="Check" size={14} strokeWidth={3} />
              В заказе
            </>
          ) : (
            'В заказ'
          )}
        </button>
      </div>
    </article>
  );
};

export default KitProductCard;
