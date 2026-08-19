import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import PriceBlock from '@/components/PriceBlock';
import StockLine from '@/components/StockLine';
import { Product, productImages, productSpecs } from '@/data/catalog';

interface Props {
  products: Product[];
  /** Убрать товар из сравнения */
  onRemove: (id: string) => void;
  /** Открыть фото крупно */
  onPhoto: (product: Product) => void;
  /**
   * Режим сборки: под каждым столбцом кнопка «Выбрать» — комплект
   * пополняется прямо со сравнения, без возврата к списку.
   */
  onPick?: (product: Product) => void;
  /** Показывать только различия — одинаковые строки прячем */
  onlyDiff: boolean;
}

/**
 * Таблица сравнения: характеристики выбранных моделей в колонках рядом.
 * Первый столбец — названия параметров, дальше по столбцу на товар.
 */
const CompareTable = ({
  products,
  onRemove,
  onPhoto,
  onPick,
  onlyDiff,
}: Props) => {
  /* Все характеристики всех товаров — в порядке первого появления */
  const rows: string[] = [];
  const values = new Map<string, Map<string, string>>();

  products.forEach((p) => {
    productSpecs(p).forEach(([key, value]) => {
      const label = key.trim();
      if (!label) return;
      if (!values.has(label)) {
        values.set(label, new Map());
        rows.push(label);
      }
      values.get(label)!.set(p.id, value);
    });
  });

  const valueOf = (label: string, id: string) =>
    values.get(label)?.get(id) ?? '—';

  /** Строка, где у всех одно и то же — её можно спрятать */
  const isSame = (label: string) => {
    const list = products.map((p) => valueOf(label, p.id));
    return list.every((v) => v === list[0]);
  };

  const shownRows = onlyDiff ? rows.filter((r) => !isSame(r)) : rows;

  /* Колонки одной ширины — иначе на телефоне они схлопываются */
  const colWidth = 'min-w-[13rem] w-[13rem] sm:min-w-[15rem] sm:w-[15rem]';

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {/* Пустой угол над названиями характеристик */}
            <th className="sticky left-0 z-10 w-[9rem] min-w-[9rem] bg-background align-top sm:w-[12rem] sm:min-w-[12rem]" />
            {products.map((p) => (
              <th
                key={p.id}
                className={`${colWidth} border-b-2 border-foreground p-3 align-top font-normal`}
              >
                <div className="relative">
                  <button
                    onClick={() => onRemove(p.id)}
                    aria-label={`Убрать ${p.name}`}
                    className="absolute right-0 top-0 z-10 flex h-7 w-7 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name="X" size={14} />
                  </button>

                  <button
                    onClick={() => onPhoto(p)}
                    aria-label={`Открыть фото: ${p.name}`}
                    className="group relative block w-full overflow-hidden bg-surface-muted"
                  >
                    <img
                      src={productImages(p)[0]}
                      alt={p.name}
                      loading="lazy"
                      className="aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-foreground/80 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-background">
                      <Icon name="Maximize2" size={12} />
                      Фото
                      {productImages(p).length > 1 && (
                        <span className="opacity-80">
                          ({productImages(p).length})
                        </span>
                      )}
                    </span>
                  </button>

                  <Link
                    to={`/product/${p.id}`}
                    className="mt-2 block font-bold leading-snug text-foreground transition-colors hover:text-primary"
                  >
                    <span className="line-clamp-3 text-[0.88rem]">{p.name}</span>
                  </Link>

                  <div className="mt-2">
                    <PriceBlock product={p} />
                    <StockLine product={p} />
                  </div>

                  <button
                    onClick={() => onPick?.(p)}
                    className={`mt-3 flex w-full items-center justify-center gap-1.5 border px-3 py-2.5 font-head text-[0.72rem] font-bold uppercase tracking-[0.06em] transition-colors ${
                      onPick
                        ? 'border-foreground bg-foreground text-background hover:border-primary hover:bg-primary hover:text-primary-foreground'
                        : 'hidden'
                    }`}
                  >
                    Выбрать
                    <Icon name="Check" size={14} />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {shownRows.map((label, i) => (
            <tr key={label} className={i % 2 ? 'bg-surface-muted' : ''}>
              <th
                scope="row"
                className={`sticky left-0 z-10 p-3 align-top text-[0.78rem] font-medium leading-snug text-muted-foreground ${
                  i % 2 ? 'bg-surface-muted' : 'bg-background'
                }`}
              >
                {label}
              </th>
              {products.map((p) => (
                <td
                  key={p.id}
                  className={`${colWidth} border-l border-border p-3 align-top text-[0.85rem] leading-snug`}
                >
                  {valueOf(label, p.id)}
                </td>
              ))}
            </tr>
          ))}

          {shownRows.length === 0 && (
            <tr>
              <td
                colSpan={products.length + 1}
                className="p-6 text-center text-[0.88rem] text-muted-foreground"
              >
                Характеристики у этих моделей совпадают — различий нет.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CompareTable;
