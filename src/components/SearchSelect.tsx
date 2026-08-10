import { useEffect, useMemo, useRef, useState } from 'react';
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
  /**
   * Показывать боковую полосу с буквами. Нужна для длинных списков —
   * марок и моделей, где иначе приходится долго листать.
   */
  alphabet?: boolean;
  onChange: (value: string) => void;
}

/** Первая буква названия: цифры и прочее сводим в «#». */
const firstLetter = (value: string): string => {
  const ch = value.trim().charAt(0).toUpperCase();
  return /[A-ZА-ЯЁ]/.test(ch) ? ch : '#';
};

const SearchSelect = ({
  id,
  label,
  value,
  options,
  placeholder = 'Выберите',
  emptyText = 'Ничего не найдено',
  disabled = false,
  alphabet = false,
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

  /** Буквы, которые реально встречаются в списке */
  const letters = useMemo(() => {
    if (!alphabet) return [];
    const set: string[] = [];
    options.forEach((o) => {
      const l = firstLetter(o);
      if (!set.includes(l)) set.push(l);
    });
    // Латиница, затем кириллица, «#» в конец
    return set.sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      const la = /[A-Z]/.test(a);
      const lb = /[A-Z]/.test(b);
      if (la !== lb) return la ? -1 : 1;
      return a.localeCompare(b, 'ru');
    });
  }, [options, alphabet]);

  /** Первый элемент каждой буквы — к нему прокручиваем */
  const anchors = useMemo(() => {
    const map: Record<string, number> = {};
    options.forEach((o, i) => {
      const l = firstLetter(o);
      if (!(l in map)) map[l] = i;
    });
    return map;
  }, [options]);

  const jumpTo = (letter: string) => {
    const index = anchors[letter];
    if (index === undefined || !listRef.current) return;
    const el = listRef.current.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'start' });
    setHighlight(index);
  };

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
        <div className="absolute left-0 right-0 top-full z-30 mt-2 flex border border-foreground bg-surface shadow-card-hover">
          <ul
            id={`${id}-list`}
            ref={listRef}
            role="listbox"
            className="max-h-64 flex-1 overflow-y-auto"
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

          {alphabet && letters.length > 3 && (
            <div className="flex max-h-64 flex-none flex-col items-center overflow-y-auto border-l border-border bg-background px-1 py-1">
              {letters.map((l) => (
                <button
                  key={l}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    jumpTo(l);
                  }}
                  className="w-6 py-[3px] text-[0.68rem] font-medium leading-none text-muted-foreground transition-colors hover:text-primary"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;