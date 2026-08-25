import Icon from '@/components/ui/icon';
import { Product } from '@/data/catalog';
import { useDealer } from '@/context/DealerContext';

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
  const { showStock } = useDealer();
  const qty = product.stock ?? 0;
  const inStock = qty > 0;

  /*
   * Дилеру с включёнными остатками показываем точное число: ему важно
   * знать, сколько штук можно забрать прямо сейчас. Покупателю такие
   * подробности ни к чему — он видит обычный текст про сроки.
   */
  const text = showStock
    ? inStock
      ? `На складе ${qty} шт.`
      : /* В узкой карточке длинная строка обрезалась на полуслове —
           срок доставки там показываем только в крупном варианте */
        large
        ? `Нет в наличии — ${product.stockNote || DEFAULT_STOCK_NOTE}`
        : 'Нет в наличии'
    : inStock
      ? /* В карточке каталога места мало — текст короче, без потери смысла */
        large
        ? 'На складе – отправка сегодня'
        : 'На складе'
      : product.stockNote || DEFAULT_STOCK_NOTE;

  return (
    <div
      className={`flex items-center gap-1.5 font-medium leading-snug ${
        large ? 'mt-2 text-[0.9rem]' : 'mt-1 text-[0.72rem]'
      } ${large ? '' : 'truncate'} ${inStock ? 'text-success' : 'text-info'}`}
    >
      <Icon
        name="CircleCheck"
        size={large ? 17 : 13}
        className="flex-none"
        strokeWidth={2.4}
      />
      {text}
    </div>
  );
};

export default StockLine;