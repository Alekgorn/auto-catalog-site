import { YEARS } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import SearchSelect from '@/components/SearchSelect';
import { useBrandPicker } from '@/hooks/use-brand-picker';

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
  /** Форма стоит на тёмной плашке подбора */
  onDark?: boolean;
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
  onDark = false,
}: Props) => {
  const { brands: BRANDS } = useCatalog();
  const { popular, brandCounts, models, modelCounts } = useBrandPicker(brand);

  /** Пока машина не названа целиком, подбирать нечего */
  const ready = Boolean(brand && model && year);

  /* Разделители колонок: на тёмной плашке обычная граница не видна */
  const line = onDark
    ? 'border-b border-pick-border md:border-b-0 md:border-r'
    : 'border-b border-border md:border-b-0 md:border-r';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid grid-cols-1 items-stretch gap-x-6 md:grid-cols-12"
    >
      <div className={`py-4 md:col-span-3 md:pr-5 ${line}`}>
        <SearchSelect
          id={`${idPrefix}-brand`}
          label="Марка"
          value={brand}
          options={BRANDS.map((b) => b.name)}
          placeholder="Выберите марку"
          alphabet
          popular={popular}
          counts={brandCounts}
          emptyText="Такой марки нет — напишите нам"
          onDark={onDark}
          onChange={(b) => {
            onBrand(b);
            // Модель от прежней марки сбрасываем — пусть выберет свою
            onModel('');
          }}
        />
      </div>

      <div className={`py-4 md:col-span-3 md:pr-5 ${line}`}>
        <SearchSelect
          id={`${idPrefix}-model`}
          label="Модель"
          value={model}
          options={models}
          placeholder={brand ? 'Выберите модель' : 'Сначала марка'}
          alphabet
          counts={modelCounts}
          emptyText="Сначала выберите марку"
          onDark={onDark}
          onChange={onModel}
        />
      </div>

      <div className={`py-4 md:col-span-2 md:pr-5 ${line}`}>
        <SearchSelect
          id={`${idPrefix}-year`}
          label="Год"
          value={year}
          options={YEARS.map(String)}
          placeholder="Выберите год"
          emptyText="Нет такого года"
          onDark={onDark}
          onChange={onYear}
        />
      </div>

      <button
        type="submit"
        disabled={!ready}
        className={`my-4 flex items-center justify-between bg-primary px-6 py-5 font-head text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed md:col-span-4 ${
          onDark
            ? 'hover:bg-white hover:text-pick focus-visible:outline-white disabled:bg-pick-field disabled:text-pick-muted'
            : 'hover:bg-foreground focus-visible:outline-foreground disabled:bg-muted disabled:text-muted-foreground'
        }`}
      >
        <span>{ready ? buttonLabel : 'Выберите марку и модель'}</span>
        <span aria-hidden>→</span>
      </button>

    </form>
  );
};

export default VehicleSelector;