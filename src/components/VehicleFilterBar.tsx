import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SearchSelect from '@/components/SearchSelect';
import { Vehicle, YEARS } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import PhotoToMessenger from '@/components/PhotoToMessenger';

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
  // Год не подставляем заранее: чужой год так же вредит подбору, как чужая марка
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : '');

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
    if (!brand || !model || !year) return;
    onApply({ brand, model, year: Number(year) });
    setOpen(false);
  };

  /* Машина уже выбрана — показываем компактную плашку */
  if (vehicle && !open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-2 border-foreground bg-surface px-5 py-5 md:px-6 md:py-6">
        <div className="flex items-center gap-4">
          <Icon name="Car" size={30} className="flex-none text-primary" />
          <div>
            <div className="font-head text-xl font-bold uppercase tracking-tight md:text-2xl">
              {vehicle.brand} {vehicle.model}, {vehicle.year}
            </div>
            {typeof count === 'number' && (
              <div className="mt-0.5 text-[0.85rem] text-muted-foreground">
                Подходит товаров: {count}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PhotoToMessenger inline />
          <button
            onClick={() => setOpen(true)}
            className="border border-foreground px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
          >
            Сменить
          </button>
          <button
            onClick={onReset}
            className="border border-border px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
      <div className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-surface px-5 py-5 md:px-6 md:py-6">
        <button
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <Icon name="Car" size={30} className="flex-none text-primary" />
          <span className="min-w-0">
            <span className="block font-head text-xl font-bold uppercase tracking-tight md:text-2xl">
              Подобрать по моей машине
            </span>
            <span className="mt-0.5 block text-[0.85rem] text-muted-foreground">
              Останутся только совместимые товары
            </span>
          </span>
        </button>

        <div className="flex flex-none items-center gap-2">
          <PhotoToMessenger inline />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-foreground px-5 py-3 text-[0.78rem] uppercase tracking-[0.1em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Выбрать
            <Icon name="ChevronDown" size={16} />
          </button>
        </div>
      </div>
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
            placeholder="Выберите марку"
            alphabet
            emptyText="Такой марки нет — напишите нам"
            onChange={(b) => {
              setBrand(b);
              setModel('');
            }}
          />
        </div>

        <div className="md:col-span-4">
          <SearchSelect
            id="vf-model"
            label="Модель"
            value={model}
            options={models}
            placeholder={brand ? 'Выберите модель' : 'Сначала марка'}
            alphabet
            emptyText="Сначала выберите марку"
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
            disabled={!brand || !model || !year}
            className="flex-1 bg-primary px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
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