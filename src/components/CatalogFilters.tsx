import Icon from '@/components/ui/icon';
import { formatPrice } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { FilterBlockKey } from '@/lib/site-settings';

export type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'name';

export interface FilterState {
  categories: string[];
  priceMin: number;
  priceMax: number;
  onlyHits: boolean;
  onlySale: boolean;
  warranties: string[];
}

interface Props {
  state: FilterState;
  bounds: { min: number; max: number };
  categories: string[];
  warranties: string[];
  counts: Record<string, number>;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

const Group = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border-t border-border py-5">
    <div className="eyebrow mb-3">{title}</div>
    {children}
  </div>
);

const Check = ({
  label,
  checked,
  count,
  onToggle,
}: {
  label: string;
  checked: boolean;
  count?: number;
  onToggle: () => void;
}) => (
  <label className="flex cursor-pointer select-none items-center gap-3 py-1.5 text-[0.9rem]">
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      className="h-4 w-4 flex-none cursor-pointer accent-primary"
    />
    <span className="flex-1">{label}</span>
    {count !== undefined && (
      <span className="text-[0.75rem] text-muted-foreground">{count}</span>
    )}
  </label>
);

const CatalogFilters = ({
  state,
  bounds,
  categories,
  warranties,
  counts,
  onChange,
  onReset,
}: Props) => {
  const { filterBlocks } = useCatalog();
  const shows = (key: FilterBlockKey) => filterBlocks.includes(key);
  const toggleIn = (key: 'categories' | 'warranties', value: string) => {
    const list = state[key];
    onChange({
      ...state,
      [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
    });
  };

  return (
    <div>
      {/* Заголовок «Фильтры» рисует плавающая панель — здесь оставляем
          только сброс, иначе слово дублировалось бы дважды подряд */}
      <div className="flex items-center justify-end pb-3">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
        >
          <Icon name="RotateCcw" size={13} />
          Сброс
        </button>
      </div>

      {shows('categories') && (
      <Group title="Категория">
        {categories.map((c) => (
          <Check
            key={c}
            label={c}
            count={counts[c]}
            checked={state.categories.includes(c)}
            onToggle={() => toggleIn('categories', c)}
          />
        ))}
      </Group>
      )}

      {shows('price') && (
      <Group title="Цена">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={state.priceMin}
            min={bounds.min}
            max={state.priceMax}
            onChange={(e) => onChange({ ...state, priceMin: Number(e.target.value) })}
            className="w-full border-b border-border bg-transparent py-2 text-[0.9rem] outline-none transition-colors focus:border-primary"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            value={state.priceMax}
            min={state.priceMin}
            max={bounds.max}
            onChange={(e) => onChange({ ...state, priceMax: Number(e.target.value) })}
            className="w-full border-b border-border bg-transparent py-2 text-[0.9rem] outline-none transition-colors focus:border-primary"
          />
        </div>
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={100}
          value={state.priceMax}
          onChange={(e) => onChange({ ...state, priceMax: Number(e.target.value) })}
          className="mt-4 w-full cursor-pointer accent-primary"
        />
        <div className="mt-1 flex justify-between text-[0.75rem] text-muted-foreground">
          <span>{formatPrice(bounds.min)}</span>
          <span>{formatPrice(bounds.max)}</span>
        </div>
      </Group>
      )}

      {shows('badges') && (
      <Group title="Отметки">
        <Check
          label="Только хиты"
          checked={state.onlyHits}
          onToggle={() => onChange({ ...state, onlyHits: !state.onlyHits })}
        />
        <Check
          label="Со скидкой"
          checked={state.onlySale}
          onToggle={() => onChange({ ...state, onlySale: !state.onlySale })}
        />
      </Group>
      )}

      {shows('warranties') && warranties.length > 0 && (
        <Group title="Гарантия">
          {warranties.map((w) => (
            <Check
              key={w}
              label={w}
              checked={state.warranties.includes(w)}
              onToggle={() => toggleIn('warranties', w)}
            />
          ))}
        </Group>
      )}
    </div>
  );
};

export default CatalogFilters;