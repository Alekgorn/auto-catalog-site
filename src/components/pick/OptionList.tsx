import { RefObject } from 'react';
import Icon from '@/components/ui/icon';

export interface PickOption {
  value: string;
  /** Сколько товаров под эту марку/модель — 0 означает «пока ничего нет» */
  count?: number;
}

interface Props {
  id: string;
  options: PickOption[];
  value: string;
  highlight: number;
  /** Показывать число товаров рядом с названием */
  showCount: boolean;
  /** Значок автомобиля слева от названия */
  carIcon?: boolean;
  emptyText: string;
  columns: boolean;
  listRef: RefObject<HTMLDivElement>;
  onHighlight: (i: number) => void;
  onPick: (value: string) => void;
}

/**
 * Ровный алфавитный список вариантов.
 *
 * Без заголовков-букв и групп: сплошной перечень по алфавиту привычнее —
 * глаз сам находит нужное место. Разделители только дробили список, особенно
 * там, где на букву приходится одна-единственная марка.
 */
const OptionList = ({
  id,
  options,
  value,
  highlight,
  showCount,
  carIcon = false,
  emptyText,
  columns,
  listRef,
  onHighlight,
  onPick,
}: Props) => (
  <div
    id={id}
    ref={listRef}
    role="listbox"
    className={
      columns
        ? 'grid flex-1 grid-cols-2 content-start gap-x-1 overflow-y-auto overscroll-contain lg:grid-cols-3'
        : 'flex-1 overflow-y-auto overscroll-contain'
    }
  >
    {options.length === 0 ? (
      <div className="col-span-full px-4 py-6 text-[0.9rem] text-muted-foreground">
        {emptyText}
      </div>
    ) : (
      options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="option"
          aria-selected={o.value === value}
          data-index={i}
          onMouseEnter={() => onHighlight(i)}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(o.value);
          }}
          className={`flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-[0.95rem] transition-colors ${
            i === highlight
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          {carIcon && (
            <Icon
              name="Car"
              size={16}
              className={`flex-none ${
                i === highlight
                  ? 'text-primary-foreground/80'
                  : 'text-muted-foreground'
              }`}
            />
          )}
          <span className="min-w-0 flex-1 truncate">{o.value}</span>
          {showCount && !!o.count && (
            <span
              className={`flex-none text-[0.78rem] tabular-nums ${
                i === highlight
                  ? 'text-primary-foreground/80'
                  : 'text-muted-foreground'
              }`}
            >
              {o.count}
            </span>
          )}
          {o.value === value && <Icon name="Check" size={15} className="flex-none" />}
        </button>
      ))
    )}
  </div>
);

export default OptionList;
