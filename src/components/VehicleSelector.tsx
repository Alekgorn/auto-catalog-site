import { useMemo } from 'react';
import { YEARS } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import SearchSelect from '@/components/SearchSelect';
import PhotoRecognize from '@/components/PhotoRecognize';
import { Vehicle } from '@/data/catalog';

interface Props {
  brand: string;
  model: string;
  year: string;
  onBrand: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onSubmit: () => void;
  buttonLabel?: string;
  idPrefix?: string;
  /** Применить машину, распознанную по фото */
  onPhoto?: (v: Vehicle) => void;
}

const VehicleSelector = ({
  brand,
  model,
  year,
  onBrand,
  onModel,
  onYear,
  onSubmit,
  buttonLabel = 'Показать оборудование',
  idPrefix = 'sel',
  onPhoto,
}: Props) => {
  const { brands: BRANDS } = useCatalog();
  const models = useMemo(
    () => BRANDS.find((b) => b.name === brand)?.models ?? [],
    [brand, BRANDS],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid grid-cols-1 items-stretch gap-x-6 md:grid-cols-12"
    >
      <div className="border-b border-border py-4 md:col-span-3 md:border-b-0 md:border-r md:pr-5">
        <SearchSelect
          id={`${idPrefix}-brand`}
          label="Марка"
          value={brand}
          options={BRANDS.map((b) => b.name)}
          placeholder="Выберите марку"
            alphabet
          emptyText="Такой марки нет — напишите нам"
          onChange={(b) => {
            onBrand(b);
            onModel(BRANDS.find((x) => x.name === b)?.models[0] ?? '');
          }}
        />
      </div>

      <div className="border-b border-border py-4 md:col-span-3 md:border-b-0 md:border-r md:pr-5">
        <SearchSelect
          id={`${idPrefix}-model`}
          label="Модель"
          value={model}
          options={models}
          placeholder="Выберите модель"
            alphabet
          emptyText="Модель не найдена"
          onChange={onModel}
        />
      </div>

      <div className="border-b border-border py-4 md:col-span-2 md:border-b-0 md:border-r md:pr-5">
        <SearchSelect
          id={`${idPrefix}-year`}
          label="Год"
          value={year}
          options={YEARS.map(String)}
          placeholder="Год"
          emptyText="Нет такого года"
          onChange={onYear}
        />
      </div>

      <button
        type="submit"
        className="my-4 flex items-center justify-between bg-primary px-6 py-5 font-head text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-4 md:col-span-4"
      >
        <span>{buttonLabel}</span>
        <span aria-hidden>→</span>
      </button>

      {onPhoto && (
        <div className="mb-2 md:col-span-4">
          <PhotoRecognize onApply={onPhoto} />
          <p className="mt-2 text-center text-[0.8rem] text-muted-foreground">
            Не знаете модель? Снимите торпедо или магнитолу — подскажем.
          </p>
        </div>
      )}
    </form>
  );
};

export default VehicleSelector;
