import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

/**
 * Выбор из списка без поля ввода.
 *
 * Раньше здесь была текстовая строка с поиском, но на телефоне при нажатии
 * выезжала клавиатура и закрывала сам список. Теперь это кнопка: нажал —
 * открылся перечень, выбрал — закрылся.
 */
interface Props {
  id: string;
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const SearchSelect = ({
  id,
  label,
  value,
  options,
  placeholder = 'Выберите',
  emptyText = 'Ничего не найдено',
  disabled = false,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = options;

  // При открытии подсвечиваем текущее значение
  useEffect(() => {
    if (!open) return;
    const i = options.indexOf(value);
    setHighlight(i >= 0 ? i : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const pick = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[highlight]) {
        e.preventDefault();
        pick(filtered[highlight]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative flex flex-col justify-center gap-1.5">
      {label && (
        <label className="eyebrow" htmlFor={id}>
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-2 border-0 bg-transparent text-left font-head text-lg font-medium tracking-tight text-foreground outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4 disabled:opacity-50"
      >
        <span className={`min-w-0 truncate ${value ? '' : 'text-muted-foreground'}`}>
          {value || placeholder}
        </span>
        <Icon
          name={open ? 'ChevronUp' : 'ChevronDown'}
          size={16}
          className="flex-none text-muted-foreground"
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 border border-foreground bg-surface shadow-card-hover">
          <ul
            id={`${id}-list`}
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-4 text-[0.88rem] text-muted-foreground">
                {emptyText}
              </li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={o}
                  role="option"
                  aria-selected={o === value}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(o);
                  }}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 text-[0.95rem] transition-colors ${
                    i === highlight
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {o}
                  {o === value && <Icon name="Check" size={14} />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchSelect;