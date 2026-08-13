import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Vehicle } from '@/data/catalog';

interface Props {
  brand: string;
  model: string;
  onPick: (v: Vehicle) => void;
}

const YEAR_FROM = 1989;
const YEAR_TO = 2026;

/**
 * Машину назвали без года («магнитола Toyota Camry»). Год влияет на
 * совместимость, поэтому просим выбрать его — иначе подбор будет неточным.
 */
const YearPrompt = ({ brand, model, onPick }: Props) => {
  const [year, setYear] = useState('');
  const years = Array.from(
    { length: YEAR_TO - YEAR_FROM + 1 },
    (_, i) => YEAR_TO - i,
  );

  return (
    <div className="border border-primary px-5 py-5">
      <div className="flex items-center gap-2 font-head text-[1rem] font-bold uppercase">
        <Icon name="Calendar" size={17} className="text-primary" />
        {brand} {model} — какой год?
      </div>
      <p className="mt-2 max-w-[42em] text-[0.85rem] leading-relaxed text-muted-foreground">
        От года выпуска зависит, какой переходник и рамка подойдут. Выберите год
        — оставим только совместимое.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border border-foreground bg-surface px-4 py-3 text-[0.9rem] outline-none transition-colors hover:border-primary focus:border-primary"
        >
          <option value="">Год выпуска</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          onClick={() => year && onPick({ brand, model, year: Number(year) })}
          disabled={!year}
          className="flex items-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          Показать
          <Icon name="ArrowRight" size={15} />
        </button>
      </div>
    </div>
  );
};

export default YearPrompt;
