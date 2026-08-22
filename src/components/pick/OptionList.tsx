import { Fragment, RefObject } from 'react';
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
  /** Буква перед элементом — рисуем «липкий» заголовок раздела */
  letterAt: Record<number, string>;
  /** Показывать число товаров рядом с названием */
  showCount: boolean;
  /** Подпись над списком — например, что сверху идут ходовые модели */
  note?: string;
  emptyText: string;
  columns: boolean;
  listRef: RefObject<HTMLDivElement>;
  onHighlight: (i: number) => void;
  onPick: (value: string) => void;
}

/**
 * Список вариантов с «липкими» буквами.
 *
 * Буква держится у верхнего края, пока идёт её раздел — так на длинном
 * списке всегда понятно, где находишься. Это заменяет прежнюю полоску
 * букв сбоку: в неё было не попасть пальцем на телефоне.
 */
const OptionList = ({
  id,
  options,
  value,
  highlight,
  letterAt,
  showCount,
  note,
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
    {note && options.length > 0 && (
      <div className="col-span-full border-b border-border px-4 py-1.5 text-[0.74rem] text-muted-foreground">
        {note}
      </div>
    )}
    {options.length === 0 ? (
      <div className="col-span-full px-4 py-6 text-[0.9rem] text-muted-foreground">
        {emptyText}
      </div>
    ) : (
      options.map((o, i) => (
        <Fragment key={o.value}>
          {letterAt[i] && (
            <div
              className="sticky top-0 z-10 col-span-full border-b border-border bg-surface px-4 py-1.5 font-head text-[0.72rem] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              aria-hidden
            >
              {letterAt[i]}
            </div>
          )}
          <button
            type="button"
            role="option"
            aria-selected={o.value === value}
            data-index={i}
            onMouseEnter={() => onHighlight(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(o.value);
            }}
            className={`flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-[0.95rem] transition-colors ${
              i === highlight
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{o.value}</span>
            {showCount && !!o.count && (
              <span
                className={`flex-none text-[0.78rem] tabular-nums ${
                  i === highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {o.count}
              </span>
            )}
            {o.value === value && <Icon name="Check" size={15} className="flex-none" />}
          </button>
        </Fragment>
      ))
    )}
  </div>
);

export default OptionList;
