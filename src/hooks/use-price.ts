import { Product } from '@/data/catalog';
import { useDealer } from '@/context/DealerContext';

/**
 * Цена товара с учётом дилерского режима.
 *
 * Обычный покупатель видит розничную цену. Дилер, вошедший по номеру
 * телефона, — свою. Если дилерская цена не заполнена, показываем розничную.
 */
export const usePrice = () => {
  const { active } = useDealer();

  const priceOf = (product: Product): number =>
    active && product.proPrice ? product.proPrice : product.price;

  /** Зачёркнутая цена: для дилера это розница, для покупателя — старая цена */
  const strikeOf = (product: Product): number | null => {
    if (active && product.proPrice) return product.price;
    return product.oldPrice ?? null;
  };

  return { dealer: active, priceOf, strikeOf };
};
