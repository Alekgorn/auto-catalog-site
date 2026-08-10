import { Product, formatPrice } from '@/data/catalog';
import { usePrice } from '@/hooks/use-price';

interface Props {
  product: Product;
  /** Крупный вариант — для страницы товара */
  large?: boolean;
}

/**
 * Цена товара. Для дилера показывает закупочную, розничную рядом
 * и выгоду с продажи одной штуки.
 */
const PriceBlock = ({ product, large = false }: Props) => {
  const { priceOf, strikeOf, hasDealerPrice, profitOf, profitPercent } =
    usePrice();

  const strike = strikeOf(product);
  const isDealer = hasDealerPrice(product);

  return (
    <div>
      {strike && (
        <div
          className={`text-muted-foreground line-through ${
            large ? 'text-base' : 'text-[0.8rem]'
          }`}
        >
          {formatPrice(strike)}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={`whitespace-nowrap font-head font-bold tracking-tight ${
            large ? 'text-4xl' : 'text-xl sm:text-2xl'
          }`}
        >
          {formatPrice(priceOf(product))}
        </span>

        {isDealer && (
          <span
            className={`flex-none bg-primary px-1.5 py-0.5 font-bold uppercase tracking-[0.08em] text-primary-foreground ${
              large ? 'text-[0.68rem] px-2 py-1' : 'text-[0.6rem]'
            }`}
          >
            Ваша цена
          </span>
        )}
      </div>

      {isDealer && (
        <div
          className={`mt-1.5 space-y-0.5 ${
            large ? 'text-[0.9rem]' : 'text-[0.78rem]'
          }`}
        >
          <div className="text-muted-foreground">
            Розница:{' '}
            <span className="text-foreground">{formatPrice(product.price)}</span>
          </div>
          <div className="font-medium text-primary">
            Выгода: {formatPrice(profitOf(product))} ({profitPercent(product)}%)
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceBlock;
