import Icon from '@/components/ui/icon';
import { Product, formatPrice } from '@/data/catalog';
import { KitStep } from '@/data/scenarios';

interface Props {
  steps: KitStep[];
  picked: Record<string, Product | undefined>;
  onRemove: (category: string) => void;
  onAddAll: () => void;
  /** Комплект уже отправлен в корзину */
  added: boolean;
}

/**
 * Плавающая панель внизу экрана: что уже выбрано, итоговая цена и кнопка
 * положить весь комплект в корзину разом.
 */
const KitBar = ({ steps, picked, onRemove, onAddAll, added }: Props) => {
  const chosen = steps
    .map((s) => ({ step: s, product: picked[s.category] }))
    .filter((x): x is { step: KitStep; product: Product } => !!x.product);

  if (!chosen.length) return null;

  const total = chosen.reduce((sum, x) => sum + x.product.price, 0);
  const old = chosen.reduce(
    (sum, x) => sum + (x.product.oldPrice ?? x.product.price),
    0,
  );
  const save = old - total;

  return (
    <div className="sticky bottom-0 z-40 -mx-4 border-t-2 border-foreground bg-background px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] md:-mx-6 md:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground sm:block">
            Ваш комплект
          </span>
          {chosen.map(({ step, product }) => (
            <span
              key={step.category}
              className="flex max-w-[16em] items-center gap-2 border border-border bg-surface px-2.5 py-1.5"
            >
              <Icon
                name={step.icon}
                fallback="Package"
                size={14}
                className="flex-none text-primary"
              />
              <span className="truncate text-[0.76rem]">{product.name}</span>
              <button
                onClick={() => onRemove(step.category)}
                aria-label="Убрать из комплекта"
                className="flex-none text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="X" size={13} />
              </button>
            </span>
          ))}
          <span className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
            {chosen.length} из {steps.length}
          </span>
        </div>

        <div className="flex flex-none items-center justify-between gap-4">
          <div className="leading-none">
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
              Итого
            </div>
            <div className="mt-1 font-head text-[1.35rem] font-bold tracking-tight">
              {formatPrice(total)}
            </div>
            {save > 0 && (
              <div className="mt-1 text-[0.72rem] text-success">
                выгода {formatPrice(save)}
              </div>
            )}
          </div>

          <button
            onClick={onAddAll}
            className={`flex flex-none items-center gap-2 px-5 py-3.5 font-head text-[0.78rem] font-bold uppercase tracking-[0.08em] transition-colors ${
              added
                ? 'bg-success text-success-foreground'
                : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {added ? (
              <>
                <Icon name="Check" size={16} strokeWidth={3} />
                Комплект в корзине
              </>
            ) : (
              <>
                Добавить комплект
                <Icon name="ShoppingCart" size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KitBar;
