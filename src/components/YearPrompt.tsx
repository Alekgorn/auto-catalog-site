import Icon from '@/components/ui/icon';
import { Vehicle } from '@/data/catalog';

interface Props {
  brand: string;
  model: string;
  onPick: (v: Vehicle) => void;
}

/** Сколько лет показываем в подсказке — дальше уже редкость */
const DEPTH = 18;

/**
 * Машину назвали без года («магнитола Toyota Camry»). Год влияет на
 * совместимость, поэтому просим выбрать его — иначе подбор будет неточным.
 */
const YearPrompt = ({ brand, model, onPick }: Props) => {
  const now = new Date().getFullYear();
  const years = Array.from({ length: DEPTH }, (_, i) => now - i);

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
      <div className="mt-4 flex flex-wrap gap-2">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => onPick({ brand, model, year: y })}
            className="border border-border px-3.5 py-2 text-[0.82rem] transition-colors hover:border-primary hover:text-primary"
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
};

export default YearPrompt;
