import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Product,
  Vehicle,
  formatPrice,
  isCompatible,
  matchVehicle,
} from '@/data/catalog';
import { KitStep } from '@/data/scenarios';
import ProductCard from '@/components/ProductCard';
import KitHelpDialog from '@/components/kit/KitHelpDialog';

interface Props {
  step: KitStep;
  products: Product[];
  vehicle: Vehicle | null;
  brandsCount: number;
  /** id выбранной позиции на этом шаге */
  pickedId?: string;
  onPick: (product: Product) => void;
  /** Прокрутить наверх, к выбору машины */
  onNeedVehicle: () => void;
  /** Якорь для автоматической прокрутки между шагами */
  anchorId: string;
  /** Показать кнопку «Не уверен» — шаг сложный для покупателя */
  helpOffer?: boolean;
  /** Шаг пропущен покупателем — сворачиваем список */
  skipped?: boolean;
  /** Пропустить/вернуть необязательный шаг */
  onSkip?: (skip: boolean) => void;
}

const STEP_SIZE = 6;

/**
 * Один шаг сборки комплекта: раздел каталога с товарами.
 * Рамки и проводка без выбранной машины не показываются — вместо списка
 * покупатель видит просьбу указать авто, иначе подойдёт что угодно.
 */
const KitSection = ({
  step,
  products,
  vehicle,
  brandsCount,
  pickedId,
  onPick,
  onNeedVehicle,
  anchorId,
  helpOffer,
  skipped,
  onSkip,
}: Props) => {
  const [shown, setShown] = useState(STEP_SIZE);
  /** Ограничение по цене снято — «бюджетно» у каждого своё */
  const [allPrices, setAllPrices] = useState(false);
  /** Показать список снова, когда позиция уже выбрана */
  const [replacing, setReplacing] = useState(false);
  const [help, setHelp] = useState(false);

  /** Все товары раздела, подходящие машине */
  const full = useMemo(() => {
    let out = products.filter((p) => p.category === step.category);
    if (vehicle) {
      // Рамки и проводка — только точное совпадение по машине.
      // «Универсальные» переходники сюда не пускаем: они подходят формально,
      // а на деле покупатель возьмёт не тот разъём
      out = step.strictFit
        ? out.filter((p) => isCompatible(p, vehicle))
        : out.filter((p) => matchVehicle(p, vehicle, brandsCount) !== null);
    }
    // В премиум-подборке сначала топовые, в остальных — доступные
    return [...out].sort((a, b) =>
      step.minPrice ? b.price - a.price : a.price - b.price,
    );
  }, [
    products,
    step.category,
    step.strictFit,
    step.minPrice,
    vehicle,
    brandsCount,
  ]);

  /** Сколько позиций скрывает ценовой порог */
  const overLimit = useMemo(() => {
    if (step.maxPrice) return full.filter((p) => p.price > step.maxPrice!).length;
    if (step.minPrice) return full.filter((p) => p.price < step.minPrice!).length;
    return 0;
  }, [full, step.maxPrice, step.minPrice]);

  const list = useMemo(() => {
    if (allPrices) return full;
    if (step.maxPrice) return full.filter((p) => p.price <= step.maxPrice!);
    if (step.minPrice) return full.filter((p) => p.price >= step.minPrice!);
    return full;
  }, [full, step.maxPrice, step.minPrice, allPrices]);

  /**
   * Что предложить сомневающемуся: самый доступный из подходящих,
   * но не дешевле 500 ₽ — совсем дешёвые позиции это отдельные
   * мелочи (антенна, USB), а не полноценный жгут для магнитолы.
   */
  const fallback = useMemo(
    () => full.find((p) => p.price >= 500) ?? null,
    [full],
  );

  const needCar = step.needVehicle && !vehicle;
  const chosen = full.find((p) => p.id === pickedId);
  /** Позиция выбрана или шаг пропущен — прячем остальные */
  const collapsed = (!!chosen || !!skipped) && !replacing;

  return (
    <section id={anchorId} className="scroll-mt-24 py-7">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 flex-none items-center justify-center border border-foreground bg-primary text-primary-foreground">
          <Icon name={step.icon} fallback="Package" size={24} />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-head text-[1.25rem] font-bold uppercase tracking-tight">
              {step.title}
            </h2>
            {pickedId && (
              <span className="flex items-center gap-1.5 border border-success px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-success">
                <Icon name="Check" size={12} strokeWidth={3} />
                Выбрано
              </span>
            )}

            {/* Разъёмы — самое непонятное место. Кнопка стоит у заголовка,
                чтобы сомневающийся увидел её сразу, не пролистывая список */}
            {helpOffer && !collapsed && (
              <button
                onClick={() => setHelp(true)}
                className="flex items-center gap-2 border-2 border-dashed border-foreground px-4 py-2 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Icon name="CircleHelp" size={16} />
                Не уверен, нужна помощь
              </button>
            )}
            {/* Камера и регистратор — дело вкуса: даём спокойно пройти мимо */}
            {step.optional && !chosen && (
              <button
                onClick={() => onSkip?.(!skipped)}
                className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name={skipped ? 'Undo2' : 'SkipForward'} size={14} />
                {skipped ? 'Вернуть шаг' : 'Пропустить'}
              </button>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
              {allPrices && (step.maxPrice || step.minPrice)
                ? 'Показаны все модели раздела — вместе с теми, что вне подборки.'
                : step.text}
            </p>

            {/* Порог цены условен: что «бюджетно» — решает покупатель */}
            {!needCar && !collapsed && overLimit > 0 && (
              <button
                onClick={() => {
                  setAllPrices((v) => !v);
                  setShown(STEP_SIZE);
                }}
                className="flex flex-none items-center gap-1.5 border border-foreground px-3.5 py-2 font-head text-[0.72rem] font-bold uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name={allPrices ? 'ChevronUp' : 'ChevronDown'} size={14} />
                {allPrices
                  ? step.minPrice
                    ? `Только от ${formatPrice(step.minPrice)}`
                    : `Только до ${formatPrice(step.maxPrice!)}`
                  : step.minPrice
                    ? `Показать дешевле (+${overLimit})`
                    : `Показать все (+${overLimit})`}
              </button>
            )}

            {/* Выбор сделан — даём заменить, не листая весь список */}
            {collapsed && (
              <button
                onClick={() => setReplacing(true)}
                className="flex flex-none items-center gap-1.5 border border-foreground px-3.5 py-2 font-head text-[0.72rem] font-bold uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name="RefreshCw" size={14} />
                Заменить {step.unit ?? 'позицию'}
              </button>
            )}
          </div>
        </div>
      </div>

      {needCar ? (
        <div className="mt-5 border border-primary bg-surface px-5 py-6">
          <div className="flex items-start gap-3">
            <Icon
              name="CarFront"
              size={22}
              className="mt-0.5 flex-none text-primary"
            />
            <div>
              <div className="font-head text-[1rem] font-bold tracking-tight">
                Сначала укажите свой автомобиль
              </div>
              <p className="mt-2 max-w-[42em] text-[0.87rem] leading-relaxed text-muted-foreground">
                Рамки и переходники подбираются строго под конкретную машину:
                марку, модель и год. Выберите авто в панели вверху страницы —
                покажем только то, что действительно встанет, без лишнего
                списка.
              </p>
              <button
                onClick={onNeedVehicle}
                className="mt-4 inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 font-head text-[0.78rem] font-bold uppercase tracking-[0.08em] text-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Выбрать автомобиль
                <Icon name="ArrowUp" size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="mt-5 border border-border bg-surface px-5 py-6">
          <div className="flex items-start gap-3">
            <Icon
              name="PhoneCall"
              size={20}
              className="mt-0.5 flex-none text-primary"
            />
            <div className="text-[0.88rem] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Под {vehicle?.brand} {vehicle?.model} {vehicle?.year} г. в этом
                разделе подходящего нет.
              </span>{' '}
              Показываем только то, что точно встанет на вашу машину, — поэтому
              список пуст, а не забит «универсальным». Позвоните: подберём по
              вашему штатному разъёму и привезём под заказ.
            </div>
          </div>
        </div>
      ) : skipped && !chosen ? (
        <div className="mt-5 flex items-center gap-3 border border-dashed border-border bg-surface px-5 py-4 text-[0.85rem] text-muted-foreground">
          <Icon name="SkipForward" size={18} className="flex-none" />
          Шаг пропущен — комплект соберётся без этой позиции. Передумаете —
          нажмите «Вернуть шаг».
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {(collapsed ? [chosen!] : list.slice(0, shown)).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                vehicle={vehicle}
                picked={pickedId === p.id}
                onPick={(prod) => {
                  onPick(prod);
                  // Выбрали замену — снова сворачиваем список
                  setReplacing(false);
                }}
              />
            ))}
          </div>

          {!collapsed && shown < list.length && (
            <div className="mt-5 text-center">
              <button
                onClick={() => setShown((s) => s + STEP_SIZE)}
                className="border border-foreground px-6 py-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
              >
                Показать ещё ({list.length - shown})
              </button>
            </div>
          )}
        </>
      )}

      <KitHelpDialog
        open={help}
        onClose={() => setHelp(false)}
        vehicle={vehicle}
        fallback={fallback}
        onTake={onPick}
      />
    </section>
  );
};

export default KitSection;