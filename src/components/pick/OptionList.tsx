import { RefObject } from 'react';
import Icon from '@/components/ui/icon';
import BrandMark from '@/components/pick/BrandMark';

export interface PickOption {
  value: string;
}

interface Props {
  id: string;
  options: PickOption[];
  value: string;
  highlight: number;
  /** Значок марки слева от названия — цветная буква вместо логотипа */
  brandMark?: boolean;
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
  brandMark = false,
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
          {brandMark && <BrandMark name={o.value} active={i === highlight} />}
          <span className="min-w-0 flex-1 truncate">{o.value}</span>
          {o.value === value && <Icon name="Check" size={15} className="flex-none" />}
        </button>
      ))
    )}
  </div>
);

export default OptionList;
