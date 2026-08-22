import { Fragment } from 'react';
import Icon from '@/components/ui/icon';
import ProductCard from '@/components/ProductCard';
import UniversalDivider from '@/components/UniversalDivider';
import { Vehicle } from '@/data/catalog';
import { SearchHit } from '@/lib/smart-search';

interface Props {
  title: string;
  /** Все товары раздела — с учётом фильтров и подбора по машине */
  items: SearchHit[];
  /** Сколько показываем сейчас */
  shown: number;
  /** Сколько из показанных точно встают на машину */
  exactCount: number;
  vehicle: Vehicle | null;
  onShowMore: () => void;
}

/** По сколько добавляем за нажатие */
export const CATEGORY_STEP = 4;

/**
 * Раздел каталога: название, число товаров и сетка карточек.
 *
 * Показываем по четыре позиции, пятой ячейкой в том же ряду стоит кнопка
 * «Показать ещё» такого же размера, что и карточка. Так покупатель видит
 * сразу все разделы каталога и разворачивает только нужный, вместо того
 * чтобы листать общий список из сотен товаров.
 */
const CategorySection = ({
  title,
  items,
  shown,
  exactCount,
  vehicle,
  onShowMore,
}: Props) => {
  const visible = items.slice(0, shown);
  const rest = items.length - visible.length;

  return (
    <section className="pb-9">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2">
        <h2 className="font-head text-[1.05rem] font-bold uppercase tracking-tight md:text-[1.15rem]">
          {title}
        </h2>
        <span className="text-[0.8rem] text-muted-foreground">
          {items.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((h, i) => (
          <Fragment key={h.product.id}>
            {/* Граница между «точно встанет» и «подойдёт почти всем» */}
            {i === exactCount && exactCount < visible.length && (
              <UniversalDivider count={items.length - exactCount} />
            )}
            <ProductCard product={h.product} vehicle={vehicle} />
          </Fragment>
        ))}

        {rest > 0 && (
          /* Кнопка занимает ячейку сетки — тот же размер, что у карточки */
          <button
            onClick={onShowMore}
            className="group flex min-h-[13rem] flex-col items-center justify-center gap-2 border border-dashed border-foreground bg-surface px-3 py-6 text-center transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Icon name="Plus" size={22} className="flex-none" />
            <span className="font-head text-[0.8rem] font-bold uppercase tracking-[0.06em]">
              Показать ещё
            </span>
            <span className="text-[0.78rem] text-muted-foreground transition-colors group-hover:text-primary-foreground/80">
              ещё {rest}
            </span>
          </button>
        )}
      </div>
    </section>
  );
};

export default CategorySection;
