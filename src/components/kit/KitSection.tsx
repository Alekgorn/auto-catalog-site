import { Fragment, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Product, Vehicle, formatPrice, splitByFit } from '@/data/catalog';
import { kitStepList } from '@/lib/kit-filter';
import { KitStep } from '@/data/scenarios';
import ProductCard from '@/components/ProductCard';
import UniversalDivider from '@/components/UniversalDivider';
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
  /**
   * Шаг ещё не открыт: магнитола не выбрана, подбирать не от чего.
   * Показываем товары обесцвеченными, чтобы был виден масштаб раздела.
   */
  locked?: boolean;
  /** Диагональ выбранной магнитолы — под неё подбираем рамку */
  size?: number | null;
  /** Машина покупателя строкой — для пояснения, почему список такой */
  vehicleLabel?: string;
  /** Прокрутить к первому шагу — выбору магнитолы */
  onNeedLead?: () => void;
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
  locked,
  size,
  vehicleLabel,
  onNeedLead,
}: Props) => {
  const [shown, setShown] = useState(STEP_SIZE);
  /** Ограничение по цене снято — «бюджетно» у каждого своё */
  const [allPrices, setAllPrices] = useState(false);
  /** Показать список снова, когда позиция уже выбрана */
  const [replacing, setReplacing] = useState(false);
  const [help, setHelp] = useState(false);

  /** Все товары раздела, подходящие машине и экрану магнитолы */
  const full = useMemo(
    () => kitStepList({ step, products, vehicle, brandsCount, size }),
    [step, products, vehicle, brandsCount, size],
  );

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

  /** Сколько в списке позиций, точно подходящих машине */
  const exactCount = useMemo(
    () => splitByFit(list, (p) => p, vehicle).exact.length,
    [list, vehicle],
  );

  /**
   * Витрина для закрытого шага: раздел ещё не фильтруется под магнитолу,
   * поэтому просто берём начало каталога — показать, что здесь будет.
   */
  const preview = useMemo(
    () =>
      products
        .filter((p) => p.category === step.category)
        .slice(0, 4),
    [products, step.category],
  );

  const needCar = step.needVehicle && !vehicle;
  const chosen = full.find((p) => p.id === pickedId);
  /** Позиция выбрана или шаг пропущен — прячем остальные */
  const collapsed = (!!chosen || !!skipped) && !replacing;

  return (
    /* Страница длинная — шаги нужно отделять друг от друга воздухом,
       иначе они читаются как один сплошной список */
    <section
      id={anchorId}
      className={`scroll-mt-24 ${locked ? 'py-7 md:py-8' : 'py-11 md:py-14'}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 flex-none items-center justify-center border transition-colors ${
            locked
              ? 'border-border bg-muted text-muted-foreground'
              : 'border-foreground bg-primary text-primary-foreground'
          }`}
        >
          <Icon name={locked ? 'Lock' : step.icon} fallback="Package" size={24} />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2
              className={`font-head text-[1.45rem] font-bold uppercase leading-[1.15] tracking-tight md:text-[1.7rem] ${
                locked ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
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
            {helpOffer && !collapsed && !locked && (
              <button
                onClick={() => setHelp(true)}
                className="flex items-center gap-2 border-2 border-dashed border-foreground px-4 py-2 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Icon name="CircleHelp" size={16} />
                Не уверен, нужна помощь
              </button>
            )}
            {/* Камера и регистратор — дело вкуса: даём спокойно пройти мимо */}
            {step.optional && !chosen && !locked && (
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

            {/* Покупатель должен видеть, почему список именно такой */}
            {step.matchScreen && !locked && size ? (
              <span className="flex w-full items-center gap-2 border border-success/60 bg-success/5 px-3 py-2 text-[0.82rem] leading-snug text-foreground">
                <Icon
                  name="Filter"
                  size={14}
                  className="flex-none text-success"
                />
                Показаны рамки под {String(size).replace('.', ',')} дюймов
                {vehicleLabel ? ` для ${vehicleLabel}` : ''}
              </span>
            ) : null}

            {/* Порог цены условен: что «бюджетно» — решает покупатель */}
            {!needCar && !collapsed && !locked && overLimit > 0 && (
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
            {collapsed && !locked && (
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

      {locked ? (
        /* Пока магнитола не выбрана, подбирать не от чего: размер рамки и
           разъём зависят от неё. Товары показываем, но обесцвеченными —
           видно, что раздел не пустой, но выбрать пока нельзя */
        <div className="relative mt-4 h-[136px] overflow-hidden md:h-[124px]">
          {/* Карточки видны только верхушками — намёк, что раздел не пустой */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 select-none grid grid-cols-2 gap-3 opacity-30 grayscale md:gap-4 lg:grid-cols-4"
          >
            {preview.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                vehicle={vehicle}
                onPick={() => {}}
              />
            ))}
          </div>

          <div className="absolute inset-0 flex items-center bg-background/75 backdrop-blur-[2px]">
            <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 border border-foreground bg-background px-4 py-3.5 md:px-5">
              <Icon
                name="Lock"
                size={20}
                className="flex-none text-muted-foreground"
              />
              <div className="min-w-[14em] flex-1">
                <div className="font-head text-[0.95rem] font-bold uppercase leading-tight tracking-tight">
                  {step.matchScreen
                    ? 'Сначала выберите магнитолу — тогда появятся подходящие рамки'
                    : 'Сначала выберите магнитолу и рамку'}
                </div>
                <p className="mt-1 text-[0.8rem] leading-snug text-muted-foreground">
                  {step.matchScreen
                    ? 'Рамка зависит от диагонали экрана: под 9 и под 10 дюймов нужны разные.'
                    : 'Разъёмы и питание зависят от магнитолы и от того, как она встаёт в панель.'}
                </p>
              </div>
              <button
                onClick={onNeedLead}
                className="flex flex-none items-center gap-2 border border-foreground bg-foreground px-4 py-2.5 font-head text-[0.74rem] font-bold uppercase tracking-[0.08em] text-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Icon name="ArrowUp" size={14} />
                {step.matchScreen ? 'К магнитоле' : 'К сборке'}
              </button>
            </div>
          </div>
        </div>
      ) : needCar ? (
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
              Для{' '}
              <span className="font-medium text-foreground">
                {vehicle?.brand} {vehicle?.model} {vehicle?.year} г.
              </span>{' '}
              {step.matchScreen && size ? ` под экран ${size}″` : ''} сейчас нет
              подходящих позиций. Мы фильтруем только то, что гарантированно
              встанет, поэтому список пуст.{' '}
              {/* Отправляем к кнопке помощи выше — это единственный
                  осмысленный выход с пустого шага */}
              <button
                onClick={() => setHelp(true)}
                className="font-bold text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
              >
                Свяжитесь с нами по кнопке выше
              </button>{' '}
              – мы посмотрим, что можно привезти под заказ.
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
            {(collapsed ? [chosen!] : list.slice(0, shown)).map((p, i) => (
              <Fragment key={p.id}>
                {/* Ниже — то, что подходит почти всем, а не именно этой машине */}
                {!collapsed &&
                  i === exactCount &&
                  exactCount < list.length && (
                    <UniversalDivider count={list.length - exactCount} />
                  )}
                <ProductCard
                  product={p}
                  vehicle={vehicle}
                  picked={pickedId === p.id}
                  onPick={(prod) => {
                    onPick(prod);
                    // Выбрали замену — снова сворачиваем список
                    setReplacing(false);
                  }}
                />
              </Fragment>
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
        topic={step.helpTopic}
      />
    </section>
  );
};

export default KitSection;