import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SearchSelect from '@/components/SearchSelect';
import FitsList from '@/components/FitsList';
import { Product, Vehicle, YEARS, isCompatible } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { saveVehicle } from '@/lib/vehicle';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
  onVehicle: (v: Vehicle) => void;
  onRequest: () => void;
}

/**
 * Совместимость рядом с ценой: быстрая проверка своей машины
 * и полный список марок под сворачиваемой панелью.
 */
const FitsCheck = ({ product, vehicle, onVehicle, onRequest }: Props) => {
  const { brands: BRANDS } = useCatalog();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');

  const entries = Object.entries(product.fits) as [string, string[]][];
  const modelCount = entries.reduce((n, [, m]) => n + m.length, 0);
  const fits = isCompatible(product, vehicle);

  const models = useMemo(
    () => BRANDS.find((b) => b.name === brand)?.models ?? [],
    [brand, BRANDS],
  );

  const check = () => {
    if (!brand || !model || !year) return;
    const v: Vehicle = { brand, model, year: Number(year) };
    saveVehicle(v);
    onVehicle(v);
  };

  return (
    <div className="mt-6 border border-border">
      {vehicle ? (
        <div
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 ${
            fits ? 'bg-success-soft' : ''
          }`}
        >
          <span
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${
              fits
                ? 'bg-success text-success-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon name={fits ? 'Check' : 'X'} size={17} strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block font-head text-[0.95rem] font-bold uppercase tracking-tight ${
                fits ? 'text-success' : ''
              }`}
            >
              {fits ? 'Подходит к вашей машине' : 'Не подходит к вашей машине'}
            </span>
            <span
              className={`block text-[0.85rem] ${
                fits ? 'text-success' : 'text-muted-foreground'
              }`}
            >
              {vehicle.brand} {vehicle.model}, {vehicle.year} г.
            </span>
          </span>
          {!fits && (
            <button
              onClick={onRequest}
              className="text-[0.8rem] uppercase tracking-[0.08em] underline underline-offset-4 transition-colors hover:text-primary"
            >
              Подобрать аналог
            </button>
          )}
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
            <Icon name="Car" size={15} />
            Проверьте свою машину
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <SearchSelect
              id="fits-brand"
              label=""
              value={brand}
              options={BRANDS.map((b) => b.name)}
              placeholder="Марка"
              emptyText="Такой марки нет"
              onChange={(b) => {
                setBrand(b);
                setModel(BRANDS.find((x) => x.name === b)?.models[0] ?? '');
              }}
            />
            <SearchSelect
              id="fits-model"
              label=""
              value={model}
              options={models}
              placeholder="Модель"
              emptyText="Сначала выберите марку"
              onChange={setModel}
            />
            <SearchSelect
              id="fits-year"
              label=""
              value={year}
              options={YEARS.map(String)}
              placeholder="Год"
              emptyText="—"
              onChange={setYear}
            />
          </div>

          <button
            onClick={check}
            disabled={!brand || !model || !year}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground"
          >
            Проверить совместимость
            <Icon name="ArrowRight" size={15} />
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-left transition-colors hover:text-primary"
      >
        <span className="flex items-center gap-2.5 text-[0.85rem]">
          <Icon name="List" size={16} />
          Весь список — {modelCount} моделей
        </span>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} />
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-1">
          <FitsList brands={entries} vehicle={vehicle} />
          <p className="mt-5 text-[0.85rem] text-muted-foreground">
            Вашей модели нет в списке?{' '}
            <button
              onClick={onRequest}
              className="underline underline-offset-2 transition-colors hover:text-primary"
            >
              Проверим по VIN
            </button>{' '}
            и предложим аналог.
          </p>
        </div>
      )}
    </div>
  );
};

export default FitsCheck;
