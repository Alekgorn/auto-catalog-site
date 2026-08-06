import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useCatalog } from '@/context/CatalogContext';
import { formatPrice, productImages, productSku, searchProducts } from '@/data/catalog';

interface Props {
  autoFocus?: boolean;
  onDone?: () => void;
}

const SearchBar = ({ autoFocus = false, onDone }: Props) => {
  const navigate = useNavigate();
  const { products } = useCatalog();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const results = useMemo(
    () => searchProducts(products, query).slice(0, 6),
    [products, query],
  );

  useEffect(() => setHighlight(0), [query]);

  const goTo = (slug: string) => {
    setOpen(false);
    setQuery('');
    onDone?.();
    navigate(`/product/${slug}`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[highlight]) goTo(results[highlight].id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} className="flex items-center gap-3 border border-foreground bg-background px-4 py-3 transition-colors focus-within:border-primary">
        <Icon name="Search" size={18} className="flex-none text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Фаркоп Kia Sportage или артикул"
          className="w-full min-w-0 border-0 bg-transparent text-[0.95rem] outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Очистить"
            className="flex-none text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </form>

      {open && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 border border-foreground bg-background shadow-lg">
          {results.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <div className="text-[0.9rem]">Ничего не нашлось</div>
              <p className="mt-2 text-[0.82rem] text-muted-foreground">
                Попробуйте иначе: «фаркоп», «багажник Creta» или артикул с коробки.
              </p>
            </div>
          ) : (
            <ul>
              {results.map((p, i) => (
                <li key={p.id}>
                  <button
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goTo(p.id);
                    }}
                    className={`flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors ${
                      i === highlight ? 'bg-card' : ''
                    }`}
                  >
                    <img
                      src={productImages(p)[0]}
                      alt=""
                      className="h-12 w-12 flex-none bg-card object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-head text-[0.95rem] font-medium">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                        {p.category} · {productSku(p)}
                      </span>
                    </span>
                    <span className="flex-none font-head text-[1rem] font-bold">
                      {formatPrice(p.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
