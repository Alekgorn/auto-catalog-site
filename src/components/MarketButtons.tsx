import Icon from '@/components/ui/icon';
import { Product } from '@/data/catalog';

interface Props {
  product: Product;
}

/**
 * Кнопки покупки на маркетплейсах.
 * Ссылка не заполнена — кнопка серая и сообщает, что товара там нет.
 */
const MarketButtons = ({ product }: Props) => {
  const markets = [
    {
      key: 'ozon',
      label: 'Купить на Ozon',
      empty: 'Нет в наличии на Ozon',
      url: (product.ozonUrl ?? '').trim(),
      // Фирменный синий Ozon
      className: 'bg-[#005BFF] text-white hover:bg-[#0047CC]',
    },
    {
      key: 'wb',
      label: 'Купить на Wildberries',
      empty: 'Нет в наличии на Wildberries',
      url: (product.wbUrl ?? '').trim(),
      // Фирменный фиолетовый Wildberries
      className: 'bg-[#CB11AB] text-white hover:bg-[#A50D8A]',
    },
  ];

  return (
    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
      {markets.map((m) =>
        m.url ? (
          <a
            key={m.key}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 font-head text-[0.88rem] font-bold uppercase tracking-[0.02em] transition-colors ${m.className}`}
          >
            {m.label}
            <Icon name="ExternalLink" size={16} />
          </a>
        ) : (
          <span
            key={m.key}
            title="Ссылка на маркетплейс не указана"
            className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 border border-border bg-surface-muted px-6 py-4 font-head text-[0.88rem] font-medium uppercase tracking-[0.02em] text-muted-foreground"
          >
            {m.empty}
          </span>
        ),
      )}
    </div>
  );
};

export default MarketButtons;
