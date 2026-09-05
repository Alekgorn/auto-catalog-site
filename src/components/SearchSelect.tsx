import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useIsMobile } from '@/hooks/use-mobile';
import OptionList, { PickOption } from '@/components/pick/OptionList';
import { matchRank, searchKeys } from '@/lib/pick-search';
import { lockScroll } from '@/lib/scroll-lock';

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
 *  • порядок всегда алфавитный — привычнее всего искать глазами.
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
   * Длинный список: включает поиск и раскладку в колонки.
   * Для года не нужен — там всё умещается сразу.
   */
  alphabet?: boolean;
  /** Цветной значок марки у каждой строки — помогает найти нужную глазом */
  brandMark?: boolean;
  /** Поле стоит на тёмной плашке — светлый текст вместо чёрного */
  onDark?: boolean;
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
  alphabet = false,
  brandMark = false,
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
    return lockScroll();
  }, [open, isMobile]);

  /**
   * На компьютере ставим курсор в поиск сразу — можно печатать, не целясь
   * мышью. На телефоне так делать нельзя: автофокус поднимает клавиатуру,
   * она занимает пол-экрана, хотя человек ещё даже не собирался печатать —
   * обычно он листает список. Там фокус только по касанию поля.
   */
  useEffect(() => {
    if (open && searchable && !isMobile) inputRef.current?.focus();
    if (!open) setQuery('');
  }, [open, searchable, isMobile]);

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
    () => filtered.map((o) => ({ value: o })),
    [filtered],
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

      <OptionList
        id={`${id}-list`}
        options={items}
        value={value}
        highlight={highlight}
        brandMark={brandMark}
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