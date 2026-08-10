import { Product } from '@/data/catalog';
import { useDealer } from '@/context/DealerContext';

/**
 * Цены с учётом дилерского режима.
 *
 * Обычный покупатель видит розничную цену. Дилер, вошедший по номеру
 * телефона, — свою закупочную, рядом розничную и выгоду с продажи.
 * Если дилерская цена у товара не заполнена, показываем розничную.
 */
export const usePrice = () => {
  const { active } = useDealer();

  /** Цена, по которой покупает текущий посетитель */
  const priceOf = (product: Product): number =>
    active && product.proPrice ? product.proPrice : product.price;

  /** Есть ли для товара своя дилерская цена */
  const hasDealerPrice = (product: Product): boolean =>
    active && !!product.proPrice && product.proPrice < product.price;

  /** Зачёркнутая цена для обычного покупателя — старая цена по акции */
  const strikeOf = (product: Product): number | null => {
    if (active) return null;
    return product.oldPrice ?? null;
  };

  /** Выгода дилера с продажи одной штуки: розница минус закупка */
  const profitOf = (product: Product): number =>
    hasDealerPrice(product) ? product.price - (product.proPrice as number) : 0;

  /** Та же выгода в процентах от розничной цены */
  const profitPercent = (product: Product): number => {
    if (!hasDealerPrice(product) || !product.price) return 0;
    return Math.round((profitOf(product) / product.price) * 100);
  };

  return {
    dealer: active,
    priceOf,
    strikeOf,
    hasDealerPrice,
    profitOf,
    profitPercent,
  };
};
