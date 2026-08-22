import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useIsMobile } from '@/hooks/use-mobile';
import OptionList, { PickOption } from '@/components/pick/OptionList';
import PopularGrid from '@/components/pick/PopularGrid';
import { matchRank, searchKeys } from '@/lib/pick-search';

/**
 * Выбор марки, модели и года.
 *
 * Списки здесь длинные — 54 марки и до 95 моделей у одной марки, поэтому
 * простым перечнем не обойтись. Устроено так:
 *  • на телефоне выбор открывается на весь экран, поле поиска закреплено
 *    сверху — клавиатура поджимает список снизу и ничего не закрывает
 *    (раньше поиск жил в шторке на 256px, и его пришлось убрать);
 *  • на компьютере выпадающая панель шире поля и разложена в 2–3 колонки,
 *    так все марки видны почти без прокрутки;
 *  • сверху — часто выбираемые марки, ниже общий список с «липкими» буквами
 *    вместо прежней полоски A–Z, в которую было не попасть пальцем.
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
   * Длинный список: включает поиск, буквы-разделители и колонки.
   * Для года не нужен — там всё умещается сразу.
   */
  alphabet?: boolean;
  /** Марки, которые показываем плитками сверху */
  popular?: string[];
  /** Значение → сколько товаров под него */
  counts?: Record<string, number>;
  /** Поле стоит на тёмной плашке — светлый текст вместо чёрного */
  onDark?: boolean;
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
  popular = [],
  counts,
  onDark = false,
  onChange,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  /** Поиск нужен там же, где длинный список */
  const searchable = alphabet;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  /* Список на весь экран — фон под ним не должен уезжать */
  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  /* Открыли — сразу можно печатать, не целясь в поле */
  useEffect(() => {
    if (open && searchable) inputRef.current?.focus();
    if (!open) setQuery('');
  }, [open, searchable]);

  /**
   * Ищем и по-русски, и на латинице, и с забытой раскладкой: «тойо»,
   * «toyot», «Njqjnf» — всё это Toyota. Совпадение с начала слова важнее.
   */
  const filtered = useMemo(() => {
    const keys = searchKeys(query);
    if (!keys.length) return options;
    const scored: { o: string; rank: number }[] = [];
    options.forEach((o) => {
      const rank = matchRank(o, keys);
      if (rank !== null) scored.push({ o, rank });
    });
    return scored.sort((a, b) => a.rank - b.rank).map((s) => s.o);
  }, [options, query]);

  const items: PickOption[] = useMemo(
    () => filtered.map((o) => ({ value: o, count: counts?.[o] })),
    [filtered, counts],
  );

  /**
   * Буквы-разделители нужны только алфавитному списку. Модели идут по числу
   * товаров (у Toyota их 95, и ходовые должны быть сверху), при поиске —
   * по точности совпадения. Там буквы шли бы вразнобой и мешали.
   */
  const alphabetical = useMemo(() => {
    if (!alphabet || query.trim()) return false;
    for (let i = 1; i < filtered.length; i += 1) {
      if (firstLetter(filtered[i - 1]) > firstLetter(filtered[i])) return false;
    }
    return true;
  }, [filtered, alphabet, query]);

  /** Перед какими позициями рисуем букву-разделитель */
  const letterAt = useMemo(() => {
    if (!alphabetical) return {};
    const map: Record<number, string> = {};
    let prev = '';
    filtered.forEach((o, i) => {
      const l = firstLetter(o);
      if (l !== prev) {
        map[i] = l;
        prev = l;
      }
    });
    return map;
  }, [filtered, alphabetical]);

  /** Плитки популярных прячем, как только начали искать */
  const popularShown = useMemo(
    () => (query.trim() ? [] : popular.filter((p) => options.includes(p))),
    [popular, options, query],
  );

  // При открытии подсвечиваем текущее значение
  useEffect(() => {
    if (!open) return;
    const i = filtered.indexOf(value);
    setHighlight(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlight}"]`,
    );
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

  const showCount = !!counts;

  const panel = (
    <>
      {/* На телефоне это шапка окна, на компьютере — строка поиска */}
      {searchable && (
        <div className="flex flex-none items-center gap-2 border-b border-border bg-surface px-3 py-2.5">
          <Icon name="Search" size={17} className="flex-none text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Поиск: ${label.toLowerCase()}`}
            aria-label={`Поиск: ${label}`}
            className="min-w-0 flex-1 border-0 bg-transparent py-1 text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              aria-label="Очистить"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery('');
                inputRef.current?.focus();
              }}
              className="flex-none text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon name="X" size={17} />
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              className="flex-none border border-foreground px-2.5 py-1.5 font-head text-[0.72rem] font-bold uppercase tracking-[0.06em]"
            >
              Закрыть
            </button>
          )}
        </div>
      )}

      {popularShown.length > 0 && (
        <PopularGrid items={popularShown} value={value} onPick={pick} />
      )}

      <OptionList
        id={`${id}-list`}
        options={items}
        value={value}
        highlight={highlight}
        letterAt={letterAt}
        showCount={showCount}
        note={
          /* Порядок не алфавитный — объясняем, почему список идёт так */
          !alphabetical && !query.trim() && showCount && alphabet
            ? 'Сверху — модели, под которые больше всего оборудования'
            : undefined
        }
        emptyText={query.trim() ? `Ничего не нашлось по «${query.trim()}»` : emptyText}
        columns={alphabet && !isMobile}
        listRef={listRef}
        onHighlight={setHighlight}
        onPick={pick}
      />
    </>
  );

  return (
    <div ref={boxRef} className="relative flex flex-col justify-center gap-1.5">
      {label && (
        <label className={`eyebrow ${onDark ? '!text-pick-muted' : ''}`} htmlFor={id}>
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
        className={`flex w-full items-center justify-between gap-2 border-0 bg-transparent text-left font-head text-lg font-medium tracking-tight outline-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4 disabled:opacity-50 ${
          onDark ? 'text-pick-foreground' : 'text-foreground'
        }`}
      >
        <span
          className={`min-w-0 truncate ${
            value ? '' : onDark ? 'text-pick-muted' : 'text-muted-foreground'
          }`}
        >
          {value || placeholder}
        </span>
        <Icon
          name={open ? 'ChevronUp' : 'ChevronDown'}
          size={16}
          className={`flex-none ${onDark ? 'text-pick-muted' : 'text-muted-foreground'}`}
        />
      </button>

      {open && isMobile && (
        /* Во весь экран: поиск закреплён сверху, список скроллится под ним */
        <div className="fixed inset-0 z-50 flex flex-col bg-surface">
          {!searchable && (
            <div className="flex flex-none items-center justify-between border-b border-border px-4 py-3">
              <span className="font-head text-base font-bold">{label}</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                }}
                className="border border-foreground px-2.5 py-1.5 font-head text-[0.72rem] font-bold uppercase tracking-[0.06em]"
              >
                Закрыть
              </button>
            </div>
          )}
          {panel}
        </div>
      )}

      {open && !isMobile && (
        <div
          className={`absolute top-full z-30 mt-2 flex max-h-[26rem] flex-col border border-foreground bg-surface shadow-card-hover ${
            /* Панель шире поля: 54 марки в колонках видны почти целиком */
            alphabet ? 'left-0 w-[min(46rem,calc(100vw-3rem))]' : 'left-0 right-0'
          }`}
        >
          {panel}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;