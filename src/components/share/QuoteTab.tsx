import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Product, Vehicle, formatPrice } from '@/data/catalog';
import {
  QuoteLine,
  downloadFile,
  quoteCsv,
  quoteFileName,
  quoteText,
  quoteTotal,
  withMarkup,
} from '@/lib/quote';

export interface QuoteItem {
  product: Product;
  qty: number;
}

interface Props {
  items: QuoteItem[];
  vehicle: Vehicle | null;
  /** Дилерская цена товара — если она есть у этого посетителя */
  dealerPriceOf: (p: Product) => number;
  /** Есть ли вообще дилерские цены: без них переключатель прятать */
  hasDealer: boolean;
}

const input =
  'w-full border border-border bg-transparent px-3 py-2 text-[0.85rem] outline-none transition-colors focus:border-primary';

/**
 * Смета для клиента: свои цены, свои работы, без нашего имени.
 *
 * Установщик всё равно перепишет наш список в блокнот — пусть делает это
 * здесь, быстро и с правильными названиями. Ссылок на сайт в смете нет
 * намеренно: иначе мастер ею не воспользуется.
 */
const QuoteTab = ({ items, vehicle, dealerPriceOf, hasDealer }: Props) => {
  /** От какой цены считаем: закупочной или розничной */
  const [base, setBase] = useState<'dealer' | 'retail'>(
    hasDealer ? 'dealer' : 'retail',
  );
  const [markup, setMarkup] = useState(30);
  const [perLine, setPerLine] = useState(true);
  const [title, setTitle] = useState('');
  /** Свои строки: работы, выезд, расходники */
  const [extra, setExtra] = useState<{ name: string; price: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const lines: QuoteLine[] = useMemo(() => {
    const goods = items.map(({ product, qty }) => ({
      name: product.name,
      price: withMarkup(
        base === 'dealer' ? dealerPriceOf(product) : product.price,
        markup,
      ),
      qty,
    }));
    const own = extra
      .filter((e) => e.name.trim())
      .map((e) => ({
        name: e.name.trim(),
        price: Number(e.price) || 0,
        qty: 1,
        custom: true,
      }));
    return [...goods, ...own];
    // dealerPriceOf стабилен по смыслу, в зависимости не берём
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, base, markup, extra]);

  const total = quoteTotal(lines);
  /** Что мастер заплатит нам — по ней он видит свою прибыль */
  const cost = items.reduce(
    (a, i) => a + dealerPriceOf(i.product) * i.qty,
    0,
  );
  const profit = total - cost;

  const opts = { markup, perLine, vehicle, title };
  const text = quoteText(lines, opts);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="eyebrow">Подпись сметы</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Автосервис на Ленина"
          maxLength={80}
          className={`${input} mt-1.5`}
        />
      </label>

      {/* От какой цены считать. Мастер может показать клиенту и нашу
          розницу — тогда его наценка выглядит как скидка от рынка */}
      {hasDealer && (
        <div>
          <span className="eyebrow">Считать от</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(
              [
                ['dealer', 'Дилерских цен'],
                ['retail', 'Розничных цен'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setBase(key)}
                className={`border px-3 py-2 text-[0.8rem] font-medium transition-colors ${
                  base === key
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:border-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <span className="eyebrow">Наценка на товары</span>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex flex-1 items-center border border-border">
            <input
              type="number"
              value={markup}
              min={0}
              max={300}
              onChange={(e) =>
                setMarkup(Math.max(0, Math.min(300, Number(e.target.value) || 0)))
              }
              className="w-full bg-transparent px-3 py-2 text-[0.9rem] outline-none"
            />
            <span className="px-3 text-[0.85rem] text-muted-foreground">%</span>
          </div>
          {[0, 20, 30, 50].map((v) => (
            <button
              key={v}
              onClick={() => setMarkup(v)}
              className={`border px-2.5 py-2 text-[0.78rem] transition-colors ${
                markup === v
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground'
              }`}
            >
              {v ? `+${v}%` : '0'}
            </button>
          ))}
        </div>
      </div>

      {/* Работы и выезд: без них смета неполная, и мастер всё равно
          дописал бы их руками уже в переписке */}
      <div>
        <span className="eyebrow">Свои строки</span>
        <div className="mt-1.5 space-y-2">
          {extra.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={e.name}
                onChange={(ev) =>
                  setExtra((prev) =>
                    prev.map((x, idx) =>
                      idx === i ? { ...x, name: ev.target.value } : x,
                    ),
                  )
                }
                placeholder="Установка"
                className={input}
              />
              <input
                type="number"
                value={e.price}
                onChange={(ev) =>
                  setExtra((prev) =>
                    prev.map((x, idx) =>
                      idx === i ? { ...x, price: ev.target.value } : x,
                    ),
                  )
                }
                placeholder="6000"
                className="w-28 flex-none border border-border bg-transparent px-3 py-2 text-[0.85rem] outline-none transition-colors focus:border-primary"
              />
              <button
                onClick={() =>
                  setExtra((prev) => prev.filter((_, idx) => idx !== i))
                }
                aria-label="Убрать строку"
                className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setExtra((prev) => [...prev, { name: '', price: '' }])}
            className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="Plus" size={14} />
            Добавить работу
          </button>
        </div>
      </div>

      <button
        onClick={() => setPerLine((v) => !v)}
        className="flex w-full items-center gap-3 border border-border px-3 py-2.5 text-left transition-colors hover:border-foreground"
      >
        <span
          className={`relative flex h-5 w-9 flex-none items-center rounded-full transition-colors ${
            perLine ? 'bg-primary' : 'bg-muted-foreground/40'
          }`}
        >
          <span
            className={`absolute h-4 w-4 rounded-full bg-background transition-transform ${
              perLine ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </span>
        <span className="text-[0.82rem] leading-snug">
          Цены по каждой позиции
          <span className="block text-[0.75rem] text-muted-foreground">
            {perLine
              ? 'Клиент видит стоимость каждой строки'
              : 'Клиент видит только состав и общую сумму'}
          </span>
        </span>
      </button>

      {/* Готовый текст — то, что реально уедет клиенту */}
      <div>
        <span className="eyebrow">Смета для клиента</span>
        <pre className="mt-1.5 max-h-44 overflow-y-auto whitespace-pre-wrap border border-border bg-surface-muted px-3 py-2.5 font-body text-[0.82rem] leading-relaxed">
          {text}
        </pre>
      </div>

      <div className="flex items-end justify-between border-t border-border pt-3">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
            Клиент заплатит
          </div>
          {profit > 0 && (
            <div className="mt-1 text-[0.78rem] text-success">
              ваша прибыль {formatPrice(profit)}
            </div>
          )}
        </div>
        <span className="font-head text-2xl font-bold tracking-tight">
          {formatPrice(total)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={copy}
          className={`flex items-center justify-center gap-2 px-4 py-3 font-head text-[0.78rem] font-bold uppercase tracking-[0.06em] transition-colors ${
            copied
              ? 'bg-success text-success-foreground'
              : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          <Icon name={copied ? 'Check' : 'Copy'} size={16} />
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
        <button
          onClick={() =>
            downloadFile(
              quoteFileName(vehicle, 'csv'),
              quoteCsv(lines, opts),
              'text/csv',
            )
          }
          className="flex items-center justify-center gap-2 border border-foreground px-4 py-3 font-head text-[0.78rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Download" size={16} />
          Excel
        </button>
      </div>

      <p className="text-[0.76rem] leading-snug text-muted-foreground">
        В смете нет наших ссылок, логотипа и артикулов — только состав и ваши
        цены.
      </p>
    </div>
  );
};

export default QuoteTab;
