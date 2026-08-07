import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Vehicle } from '@/data/catalog';

interface Props {
  brands: [string, string[]][];
  vehicle: Vehicle | null;
}

const VISIBLE = 4;

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
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        {visible.map(([brand, models]) => (
          <div key={brand} className="border-t border-foreground py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-head text-lg font-bold uppercase tracking-tight">
                {brand}
              </div>
              <span className="text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">
                {models.length} мод.
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {models.map((m) => {
                const current =
                  vehicle && vehicle.brand === brand && vehicle.model === m;
                return (
                  <li
                    key={m}
                    className={`flex items-center gap-2 text-[0.88rem] ${
                      current ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon
                      name={current ? 'CircleCheck' : 'Minus'}
                      size={13}
                      className="flex-none"
                    />
                    {m}
                  </li>
                );
              })}
            </ul>
          </div>
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
