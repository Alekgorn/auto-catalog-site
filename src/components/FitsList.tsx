import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Vehicle } from '@/data/catalog';

interface Props {
  brands: [string, string[]][];
  vehicle: Vehicle | null;
}

const VISIBLE = 6;
/** Столько моделей марки показываем сразу — дальше по кнопке */
const MODELS_VISIBLE = 12;

/** Модели одной марки: плотной строкой, длинный список сворачиваем. */
const BrandRow = ({
  brand,
  models,
  vehicle,
}: {
  brand: string;
  models: string[];
  vehicle: Vehicle | null;
}) => {
  const [open, setOpen] = useState(false);
  const long = models.length > MODELS_VISIBLE;
  const shown = open || !long ? models : models.slice(0, MODELS_VISIBLE);

  return (
    <div className="break-inside-avoid border-t border-border py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-head text-[1.05rem] font-bold uppercase tracking-tight">
          {brand}
        </div>
        <span className="flex-none text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
          {models.length}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1 text-[0.85rem] leading-snug">
        {shown.map((m, i) => {
          const current = vehicle && vehicle.brand === brand && vehicle.model === m;
          return (
            <span
              key={m}
              className={current ? 'font-medium text-primary' : 'text-muted-foreground'}
            >
              {current && <Icon name="Check" size={12} className="mr-0.5 inline" />}
              {m}
              {i < shown.length - 1 && <span className="text-border">,</span>}
            </span>
          );
        })}

        {long && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="ml-1 text-[0.8rem] text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            {open ? 'свернуть' : `ещё ${models.length - MODELS_VISIBLE}`}
          </button>
        )}
      </div>
    </div>
  );
};

/** Список совместимых марок. Длинный перечень скрываем под кнопку. */
const FitsList = ({ brands, vehicle }: Props) => {
  const [expanded, setExpanded] = useState(false);

  // Марку выбранного автомобиля всегда показываем первой
  const ordered = vehicle
    ? [...brands].sort(
        (a, b) => Number(b[0] === vehicle.brand) - Number(a[0] === vehicle.brand),
      )
    : brands;

  const visible = expanded ? ordered : ordered.slice(0, VISIBLE);
  const hidden = ordered.length - visible.length;

  return (
    <div>
      {/* Колонки заполняются по высоте — марки с разным числом моделей ложатся плотно */}
      <div className="sm:columns-2 sm:gap-x-8">
        {visible.map(([brand, models]) => (
          <BrandRow key={brand} brand={brand} models={models} vehicle={vehicle} />
        ))}
      </div>

      {(hidden > 0 || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-6 flex w-full items-center justify-center gap-2 border border-foreground px-6 py-3.5 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
        >
          {expanded ? 'Свернуть список' : `Показать ещё ${hidden} марок`}
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
        </button>
      )}
    </div>
  );
};

export default FitsList;
