import Icon from '@/components/ui/icon';
import { Product } from '@/data/catalog';

/** Что писать, если склад пуст, а своего текста у товара нет */
export const DEFAULT_STOCK_NOTE = 'Под заказ - Отправка 1–3 дня';

interface Props {
  product: Product;
  /** Крупный вариант — для страницы товара и быстрого просмотра */
  large?: boolean;
}

/**
 * Строка наличия под ценой. Есть остаток — зелёная отметка «отправка
 * сегодня», нет — синяя со сроком под заказ. Покупатель видит срок
 * до того, как положит товар в корзину.
 */
const StockLine = ({ product, large = false }: Props) => {
  const inStock = (product.stock ?? 0) > 0;
  /* В карточке каталога места мало — там текст короче, без потери смысла */
  const text = inStock
    ? large
      ? 'На складе – отправка сегодня'
      : 'На складе'
    : product.stockNote || DEFAULT_STOCK_NOTE;

  return (
    <div
      className={`mt-2 flex items-center gap-1.5 font-medium leading-snug ${
        large ? 'text-[0.9rem]' : 'text-[0.78rem]'
      } ${large ? '' : 'truncate'} ${inStock ? 'text-success' : 'text-info'}`}
    >
      <Icon
        name="CircleCheck"
        size={large ? 17 : 14}
        className="flex-none"
        strokeWidth={2.4}
      />
      {text}
    </div>
  );
};

export default StockLine;
