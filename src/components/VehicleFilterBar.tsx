import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SearchSelect from '@/components/SearchSelect';
import { Vehicle, YEARS } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  vehicle: Vehicle | null;
  onApply: (v: Vehicle) => void;
  onReset: () => void;
  /** Сколько товаров осталось после подбора */
  count?: number;
}

/**
 * Панель подбора по машине над списком товаров.
 * Марка, модель и год — после выбора выдача фильтруется по совместимости.
 */
const VehicleFilterBar = ({ vehicle, onApply, onReset, count }: Props) => {
  const { brands: BRANDS } = useCatalog();
  const [open, setOpen] = useState(false);

  const [brand, setBrand] = useState(vehicle?.brand ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(String(vehicle?.year ?? 2021));

  useEffect(() => {
    if (vehicle) {
      setBrand(vehicle.brand);
      setModel(vehicle.model);
      setYear(String(vehicle.year));
    }
  }, [vehicle]);

  const models = useMemo(
    () => BRANDS.find((b) => b.name === brand)?.models ?? [],
    [brand, BRANDS],
  );

  const apply = () => {
    if (!brand || !model) return;
    onApply({ brand, model, year: Number(year) });
    setOpen(false);
  };

  /* Машина уже выбрана — показываем компактную плашку */
  if (vehicle && !open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border border-foreground bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon name="Car" size={18} className="flex-none text-primary" />
          <div>
            <div className="font-head text-[0.98rem] font-bold tracking-tight">
              {vehicle.brand} {vehicle.model}, {vehicle.year}
            </div>
            {typeof count === 'number' && (
              <div className="text-[0.75rem] text-muted-foreground">
                Подходит товаров: {count}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="border border-border px-3.5 py-2 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
          >
            Сменить
          </button>
          <button
            onClick={onReset}
            className="border border-border px-3.5 py-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Сбросить
          </button>
        </div>
      </div>
    );
  }

  /* Машина не выбрана — свёрнутая подсказка */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary"
      >
        <span className="flex items-center gap-3">
          <Icon name="Car" size={18} className="flex-none text-muted-foreground" />
          <span className="text-[0.9rem]">
            Подобрать по моей машине
            <span className="ml-2 text-[0.8rem] text-muted-foreground">
              останутся только совместимые
            </span>
          </span>
        </span>
        <Icon name="ChevronDown" size={16} className="flex-none" />
      </button>
    );
  }

  /* Развёрнутая форма */
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="border border-foreground bg-surface px-4 py-3"
    >
      <div className="grid grid-cols-1 items-end gap-x-5 gap-y-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <SearchSelect
            id="vf-brand"
            label="Марка"
            value={brand}
            options={BRANDS.map((b) => b.name)}
            placeholder="Введите марку"
            emptyText="Такой марки нет — напишите нам"
            onChange={(b) => {
              setBrand(b);
              setModel(BRANDS.find((x) => x.name === b)?.models[0] ?? '');
            }}
          />
        </div>

        <div className="md:col-span-4">
          <SearchSelect
            id="vf-model"
            label="Модель"
            value={model}
            options={models}
            placeholder="Введите модель"
            emptyText="Модель не найдена"
            onChange={setModel}
          />
        </div>

        <div className="md:col-span-2">
          <SearchSelect
            id="vf-year"
            label="Год"
            value={year}
            options={YEARS.map(String)}
            placeholder="Год"
            emptyText="Нет такого года"
            onChange={setYear}
          />
        </div>

        <div className="flex gap-2 md:col-span-2">
          <button
            type="submit"
            className="flex-1 bg-primary px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-foreground"
          >
            Подобрать
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть"
            className="flex-none border border-border px-3 transition-colors hover:border-primary hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default VehicleFilterBar;
