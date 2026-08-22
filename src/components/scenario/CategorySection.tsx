import { Fragment } from 'react';
import Icon from '@/components/ui/icon';
import ProductCard from '@/components/ProductCard';
import UniversalDivider from '@/components/UniversalDivider';
import { Vehicle } from '@/data/catalog';
import { SearchHit } from '@/lib/smart-search';
import { plural } from '@/lib/kit-filter';

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
  onCollapse: () => void;
}

/** Сколько товаров раздела видно сразу — ровно один ряд на большом экране */
export const CATEGORY_FIRST = 4;

/** По сколько добавляем за нажатие «Показать ещё» */
export const CATEGORY_STEP = 15;

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
  onCollapse,
}: Props) => {
  const visible = items.slice(0, shown);
  const rest = items.length - visible.length;
  /** Раздел развернули — даём вернуть его к первому ряду */
  const expanded = shown > CATEGORY_FIRST && items.length > CATEGORY_FIRST;

  return (
    <section className="pb-9">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-2">
        <h2 className="font-head text-[1.05rem] font-bold uppercase tracking-tight md:text-[1.15rem]">
          {title}
        </h2>
        <span className="flex-none bg-primary px-2.5 py-1 font-head text-[0.72rem] font-bold uppercase tracking-[0.04em] text-primary-foreground">
          всего {items.length} {plural(items.length, 'товар', 'товара', 'товаров')}
        </span>
        {expanded && (
          <button
            onClick={onCollapse}
            className="ml-auto flex flex-none items-center gap-1.5 text-[0.78rem] text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="ChevronUp" size={15} />
            Свернуть
          </button>
        )}
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

      {/* Раздел раскрыт целиком — до заголовка далеко, повторяем «свернуть» */}
      {expanded && rest === 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={onCollapse}
            className="inline-flex items-center gap-1.5 border border-foreground px-4 py-2 font-head text-[0.74rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
          >
            <Icon name="ChevronUp" size={15} />
            Свернуть раздел
          </button>
        </div>
      )}
    </section>
  );
};

export default CategorySection;