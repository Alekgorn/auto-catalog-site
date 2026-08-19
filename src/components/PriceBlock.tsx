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
  const price = priceOf(product);

  /**
   * Со скидкой цену показываем красным и рядом ставим зачёркнутую старую —
   * так покупатель считывает выгоду мгновенно, как на маркетплейсах.
   * Без скидки цифра обычная, чёрная: подсвечивать нечего.
   */
  const discount =
    strike && strike > price ? Math.round((1 - price / strike) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={`whitespace-nowrap font-head font-bold tracking-tight ${
            discount ? 'text-primary' : 'text-foreground'
          } ${large ? 'text-4xl' : 'text-xl sm:text-2xl'}`}
        >
          {formatPrice(price)}
        </span>

        {/* Старая цена и процент — одним блоком, чтобы в узкой карточке
            процент не срывался на отдельную строку. Зачёркнута при этом
            только сама цена, процент остаётся читаемым */}
        {strike && (
          <span
            className={`flex items-baseline gap-1.5 whitespace-nowrap ${
              large ? 'text-base' : 'text-[0.78rem]'
            }`}
          >
            <span className="text-muted-foreground line-through">
              {formatPrice(strike)}
            </span>
            {discount > 0 && (
              <span className="font-bold text-primary">−{discount}%</span>
            )}
          </span>
        )}

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
