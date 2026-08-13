import { useState } from 'react';
import Icon from '@/components/ui/icon';
import ProductCard from '@/components/ProductCard';
import { Product, Vehicle } from '@/data/catalog';
import { aiSearch } from '@/lib/recognize';

interface Props {
  query: string;
  products: Product[];
  vehicle: Vehicle | null;
  /** Обычный поиск ничего не нашёл — предлагаем помощь заметнее */
  empty: boolean;
}

/**
 * Подбор по смыслу через ИИ. Запускается только по кнопке, чтобы не тратить
 * обращения к ИИ на каждый ввод: обычный поиск бесплатный и мгновенный.
 */
const AiSearchBlock = ({ query, products, vehicle, empty }: Props) => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Product[]>([]);
  const [explain, setExplain] = useState('');

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await aiSearch(query);
      // На фронте id товара — это его слаг из каталога
      const bySlug = new Map(products.map((p) => [p.id, p]));
      setFound(res.slugs.map((s) => bySlug.get(s)).filter(Boolean) as Product[]);
      setExplain(res.explain);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось, попробуйте ещё раз');
    } finally {
      setBusy(false);
    }
  };

  if (!done) {
    return (
      <div
        className={`flex flex-col gap-4 border px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${
          empty ? 'border-primary' : 'border-border'
        }`}
      >
        <div className="max-w-[40em]">
          <div className="flex items-center gap-2 font-head text-[1rem] font-bold uppercase">
            <Icon name="Sparkles" size={17} className="text-primary" />
            Найти по смыслу
          </div>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted-foreground">
            {empty
              ? 'Опишите задачу своими словами — например «хочу чтобы в машине было тише». Подберём по смыслу, а не по совпадению слов.'
              : 'Не то, что искали? Разберём запрос по смыслу и предложим подходящее.'}
          </p>
          {error && <p className="mt-2 text-[0.82rem] text-primary">{error}</p>}
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="flex flex-none items-center justify-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
        >
          {busy ? 'Подбираем…' : 'Подобрать'}
          {!busy && <Icon name="ArrowRight" size={15} />}
        </button>
      </div>
    );
  }

  if (!found.length) {
    return (
      <div className="border border-border px-5 py-5">
        <div className="font-head text-[1rem] font-bold uppercase">
          Подходящего не нашлось
        </div>
        <p className="mt-2 max-w-[40em] text-[0.85rem] leading-relaxed text-muted-foreground">
          В каталоге пока нет того, что решает эту задачу. Позвоните — подберём и
          привезём под заказ.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-primary px-5 py-5">
      <div className="flex items-center gap-2 font-head text-[1rem] font-bold uppercase">
        <Icon name="Sparkles" size={17} className="text-primary" />
        Подобрали по смыслу
      </div>
      {explain && (
        <p className="mt-2 text-[0.85rem] text-muted-foreground">{explain}</p>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        {found.map((p) => (
          <ProductCard key={p.id} product={p} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
};

export default AiSearchBlock;