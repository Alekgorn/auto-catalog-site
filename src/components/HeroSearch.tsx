import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { formatPrice, productImages, productSku } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { smartSearch } from '@/lib/smart-search';
import PhotoRecognize from '@/components/PhotoRecognize';
import { Vehicle } from '@/data/catalog';
import { saveVehicle } from '@/lib/vehicle';

const EXAMPLES = [
  'магнитола для Toyota',
  'камера 360',
  'разъём Honda',
  'шумоизоляция дверей',
];

/**
 * Крупный поиск на главной: строка, подсказки и загрузка фото.
 * Поиск понимает живые формулировки — «магнитола для Тойоты», «хочу тише».
 */
const HeroSearch = () => {
  const navigate = useNavigate();
  const { products } = useCatalog();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const hits = useMemo(
    () => (query.trim() ? smartSearch(products, query, 5) : []),
    [products, query],
  );

  const go = (q: string) => {
    const value = q.trim();
    if (!value) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  /** Машина распознана по фото — открываем подборку под неё */
  const onPhoto = (v: Vehicle) => {
    saveVehicle(v);
    navigate('/scenario/vse-po-mashine');
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
        className="flex items-center gap-3 border-2 border-foreground bg-surface px-4 py-4 transition-colors focus-within:border-primary md:px-5 md:py-5"
      >
        <Icon
          name="Search"
          size={22}
          className="flex-none text-muted-foreground"
        />

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Что нужно для машины? Например, магнитола для Toyota"
          className="w-full min-w-0 border-0 bg-transparent font-head text-[1rem] outline-none placeholder:font-body placeholder:text-[0.92rem] placeholder:text-muted-foreground md:text-[1.15rem]"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Очистить"
            className="flex-none text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        )}

        <div className="flex-none border-l border-border pl-3 md:pl-4">
          <PhotoRecognize accent onApply={onPhoto} />
        </div>

        <button
          type="submit"
          aria-label="Найти"
          className="flex-none bg-foreground px-4 py-3 text-background transition-colors hover:bg-primary hover:text-primary-foreground md:px-5"
        >
          <Icon name="ArrowRight" size={20} />
        </button>
      </form>

      {/* Подсказки под строкой */}
      {open && hits.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 border border-foreground bg-surface shadow-card-hover">
          <ul>
            {hits.map((h) => (
              <li key={h.product.id}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    navigate(`/product/${h.product.id}`);
                  }}
                  className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-muted"
                >
                  <img
                    src={productImages(h.product)[0]}
                    alt=""
                    className="h-12 w-12 flex-none bg-surface-muted object-contain p-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-head text-[0.95rem] font-medium">
                      {h.product.name}
                    </span>
                    <span className="mt-0.5 block text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                      {h.product.category} · {productSku(h.product)}
                    </span>
                  </span>
                  <span className="flex-none font-head text-[1rem] font-bold">
                    {formatPrice(h.product.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              go(query);
            }}
            className="flex w-full items-center justify-between px-4 py-3 text-[0.8rem] uppercase tracking-[0.1em] transition-colors hover:text-primary"
          >
            Показать все результаты
            <Icon name="ArrowRight" size={15} />
          </button>
        </div>
      )}

      {/* Подсказка к кнопке фото — стрелка указывает вверх, на кнопку */}
      <div className="mt-2 flex justify-end pr-16 md:pr-20">
        <span className="flex items-start gap-1.5 text-right text-[0.78rem] text-primary">
          <span className="max-w-[17rem] leading-snug">
            Не знаете, что подойдёт? Сфотографируйте торпедо или штатную магнитолу
          </span>
          <Icon name="CornerRightUp" size={16} className="mt-0.5 flex-none" />
        </span>
      </div>

      {/* Два способа найти товар */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="flex items-start gap-2.5 border border-border bg-surface px-3.5 py-3">
          <Icon name="Keyboard" size={17} className="mt-0.5 flex-none text-primary" />
          <span className="text-[0.82rem] leading-snug">
            <span className="font-head font-bold uppercase tracking-[0.04em]">
              Напишите словами
            </span>
            <span className="mt-0.5 block text-muted-foreground">
              Своими словами: «магнитола на Тойоту», «хочу тише в салоне»
            </span>
          </span>
        </div>
        <div className="flex items-start gap-2.5 border border-border bg-surface px-3.5 py-3">
          <Icon name="Camera" size={17} className="mt-0.5 flex-none text-primary" />
          <span className="text-[0.82rem] leading-snug">
            <span className="font-head font-bold uppercase tracking-[0.04em]">
              Или пришлите фото
            </span>
            <span className="mt-0.5 block text-muted-foreground">
              Снимок торпедо или штатной магнитолы — определим вашу машину
            </span>
          </span>
        </div>
      </div>

      {/* Примеры запросов */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.78rem]">
        <span className="text-muted-foreground">Например:</span>
        {EXAMPLES.map((e) => (
          <button
            key={e}
            onClick={() => go(e)}
            className="border border-border bg-surface px-3 py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroSearch;
