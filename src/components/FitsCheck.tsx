import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SearchSelect from '@/components/SearchSelect';
import {
  Product,
  Vehicle,
  YEARS,
  isCompatible,
  fitsAll,
  isUniversal,
} from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { saveVehicle } from '@/lib/vehicle';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
  onVehicle: (v: Vehicle | null) => void;
  onRequest: () => void;
}

/**
 * Совместимость рядом с ценой: быстрая проверка своей машины
 * и полный список марок под сворачиваемой панелью.
 */
const FitsCheck = ({ product, vehicle, onVehicle, onRequest }: Props) => {
  const { brands: BRANDS } = useCatalog();
  /** Форма подбора свёрнута: разворачиваем только по просьбе */
  const [picker, setPicker] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');

  const fits = isCompatible(product, vehicle);
  /** Товар действительно подходит любой машине по своим данным */
  const universal = isUniversal(product, BRANDS.length);
  /** Марки не заданы — ограничений по авто нет */
  const anyCar = fitsAll(product);

  
  const models = useMemo(
    () => BRANDS.find((b) => b.name === brand)?.models ?? [],
    [brand, BRANDS],
  );

  const reset = () => {
    saveVehicle(null);
    onVehicle(null);
    setBrand('');
    setModel('');
    setYear('');
  };

  const check = () => {
    if (!brand || !model || !year) return;
    const v: Vehicle = { brand, model, year: Number(year) };
    saveVehicle(v);
    onVehicle(v);
  };

  return (
    <div className="mt-6 border border-border">
      {anyCar || universal ? (
        /* Товар без ограничений по авто: либо марки не заданы, либо он
           прямо помечен универсальным. Зелёная плашка без галки — это
           не подбор под конкретную машину, а «встанет на любую» */
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-success-soft px-5 py-4">
          <span className="min-w-0 flex-1 font-head text-[0.95rem] font-bold uppercase tracking-tight text-success">
            Подходит ко всем автомобилям
          </span>
        </div>
      ) : vehicle ? (
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
          <span className="flex flex-none items-center gap-3">
            {!fits && (
              <button
                onClick={onRequest}
                className="text-[0.8rem] uppercase tracking-[0.08em] underline underline-offset-4 transition-colors hover:text-primary"
              >
                Подобрать аналог
              </button>
            )}
            <button
              onClick={reset}
              title="Проверить другую машину"
              className="flex items-center gap-1.5 border border-border bg-surface px-3 py-2 text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Icon name="RefreshCw" size={13} />
              Другая
            </button>
          </span>
        </div>
      ) : (
        <div className="px-5 py-4">
          {/* «Подходит всем» — только если это правда по данным товара */}
          {universal && (
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-success text-success-foreground">
                <Icon name="Check" size={15} strokeWidth={3} />
              </span>
              <span className="font-head text-[0.92rem] font-bold uppercase tracking-tight text-success">
                Подходит ко всем автомобилям
              </span>
            </div>
          )}

          {/*
            Три списка марок разом занимали четверть экрана и спорили за
            внимание с ценой и кнопкой. Разворачиваем по клику: тому, кто
            уже выбрал машину в шапке, форма вообще не нужна.
          */}
          <button
            onClick={() => setPicker((v) => !v)}
            className={`flex w-full items-center gap-2 text-left text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary ${
              universal ? 'mt-3' : ''
            }`}
          >
            <Icon name="Car" size={15} className="flex-none" />
            <span className="min-w-0 flex-1">Проверьте свою машину</span>
            <Icon
              name={picker ? 'ChevronUp' : 'ChevronDown'}
              size={15}
              className="flex-none"
            />
          </button>

          {picker && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <SearchSelect
              id="fits-brand"
              label=""
              value={brand}
              options={BRANDS.map((b) => b.name)}
              placeholder="Марка"
              alphabet
              brandMark
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
              alphabet
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
          )}

          {picker && (
          <button
            onClick={check}
            disabled={!brand || !model || !year}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground"
          >
            Проверить совместимость
            <Icon name="ArrowRight" size={15} />
          </button>
          )}
        </div>
      )}

      {/* Полный список моделей переехал вниз, к характеристикам:
          рядом с ценой он спорил за внимание с кнопкой покупки */}
    </div>
  );
};

export default FitsCheck;