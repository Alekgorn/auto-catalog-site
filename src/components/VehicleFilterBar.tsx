import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import SearchSelect from '@/components/SearchSelect';
import { Vehicle, YEARS } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { useBrandPicker } from '@/hooks/use-brand-picker';
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

  const { models } = useBrandPicker(brand);

  const apply = () => {
    if (!brand || !model || !year) return;
    onApply({ brand, model, year: Number(year) });
    setOpen(false);
  };

  /* Машина уже выбрана — показываем компактную плашку */
  if (vehicle && !open) {
    return (
      <div className="flex flex-col gap-4 border-2 border-foreground bg-surface px-5 py-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-6 md:py-6">
        <div className="flex min-w-0 items-center gap-4">
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

        {/*
         * Три кнопки в ряд на телефон не влезали — «Сбросить» уезжала
         * за край экрана. Теперь на узком экране «Сменить» и «Сбросить»
         * делят строку пополам, а «Фото нам» встаёт под ними.
         */}
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <button
            onClick={() => setOpen(true)}
            className="min-w-0 whitespace-nowrap border border-foreground px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
          >
            Сменить
          </button>
          <button
            onClick={onReset}
            className="min-w-0 whitespace-nowrap border border-border px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Сбросить
          </button>
          <div className="col-span-2 flex sm:col-auto">
            <PhotoToMessenger inline />
          </div>
        </div>
      </div>
    );
  }

  /* Машина не выбрана — свёрнутая подсказка */
  if (!open) {
    return (
      <div className="flex flex-col gap-4 border-2 border-foreground bg-surface px-5 py-5 sm:flex-row sm:flex-wrap sm:items-center md:px-6 md:py-6">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full min-w-0 items-center gap-4 text-left sm:w-auto sm:flex-1"
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

        <div className="flex w-full flex-none items-center gap-2 sm:w-auto">
          <PhotoToMessenger inline />
          <button
            onClick={() => setOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-3 text-[0.78rem] uppercase tracking-[0.1em] text-background transition-colors hover:bg-primary hover:text-primary-foreground sm:flex-none"
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
            carIcon
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
            carIcon
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