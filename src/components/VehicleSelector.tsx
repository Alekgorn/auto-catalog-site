import { useMemo } from 'react';
import { BRANDS, YEARS } from '@/data/catalog';

interface Props {
  brand: string;
  model: string;
  year: string;
  onBrand: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onSubmit: () => void;
  buttonLabel?: string;
}

const fieldClass =
  'w-full cursor-pointer appearance-none border-0 bg-transparent font-head text-lg font-medium tracking-tight text-foreground outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4';

const VehicleSelector = ({
  brand,
  model,
  year,
  onBrand,
  onModel,
  onYear,
  onSubmit,
  buttonLabel = 'Показать оборудование',
}: Props) => {
  const models = useMemo(
    () => BRANDS.find((b) => b.name === brand)?.models ?? [],
    [brand],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid grid-cols-1 items-stretch gap-x-6 md:grid-cols-12"
    >
      <div className="flex flex-col justify-center gap-1.5 border-b border-border py-4 md:col-span-3 md:border-b-0 md:border-r md:pr-5">
        <label className="eyebrow" htmlFor="sel-brand">
          Марка
        </label>
        <select
          id="sel-brand"
          className={fieldClass}
          value={brand}
          onChange={(e) => {
            const b = e.target.value;
            onBrand(b);
            const first = BRANDS.find((x) => x.name === b)?.models[0] ?? '';
            onModel(first);
          }}
        >
          {BRANDS.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col justify-center gap-1.5 border-b border-border py-4 md:col-span-3 md:border-b-0 md:border-r md:pr-5">
        <label className="eyebrow" htmlFor="sel-model">
          Модель
        </label>
        <select
          id="sel-model"
          className={fieldClass}
          value={model}
          onChange={(e) => onModel(e.target.value)}
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col justify-center gap-1.5 border-b border-border py-4 md:col-span-2 md:border-b-0 md:border-r md:pr-5">
        <label className="eyebrow" htmlFor="sel-year">
          Год
        </label>
        <select
          id="sel-year"
          className={fieldClass}
          value={year}
          onChange={(e) => onYear(e.target.value)}
        >
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="my-4 flex items-center justify-between bg-primary px-6 py-5 font-head text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 md:col-span-4"
      >
        <span>{buttonLabel}</span>
        <span aria-hidden>→</span>
      </button>
    </form>
  );
};

export default VehicleSelector;
