import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import ProductCard from '@/components/ProductCard';
import { Product, Vehicle } from '@/data/catalog';

interface Props {
  eyebrow: string;
  title: string;
  items: Product[];
  vehicle: Vehicle | null;
}

/** Сколько позиций видно сразу — ряд из четырёх, пятой встаёт кнопка */
const FIRST = 4;

/** По сколько добавляем за нажатие «Показать ещё» */
const STEP = 15;

/**
 * Подборка товаров под карточкой: заголовок, счётчик и сетка карточек.
 *
 * Устроена так же, как разделы каталога: четыре позиции и кнопка пятой
 * ячейкой того же размера. Раньше здесь было три карточки без раскрытия,
 * и подборка обрывалась, даже когда подходящего оставалось много.
 */
const ProductRelated = ({ eyebrow, title, items, vehicle }: Props) => {
  const [shown, setShown] = useState(FIRST);

  /* Перешли на другой товар — сворачиваем обратно к первому ряду */
  useEffect(() => setShown(FIRST), [items]);

  if (!items.length) return null;

  const visible = items.slice(0, shown);
  const rest = items.length - visible.length;

  return (
    <section className="section-pad">
      <div className="rule" />
      <div className="py-10">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 pb-16 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} vehicle={vehicle} />
        ))}

        {rest > 0 && (
          /* Кнопка занимает ячейку сетки — тот же размер, что у карточки */
          <button
            onClick={() => setShown((s) => s + STEP)}
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

export default ProductRelated;
