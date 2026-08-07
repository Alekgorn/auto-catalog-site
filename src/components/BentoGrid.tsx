import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import ProductCard from '@/components/ProductCard';
import { Product, Vehicle } from '@/data/catalog';

interface Props {
  products: Product[];
  vehicle: Vehicle | null;
}

/**
 * Бенто-раскладка: товары идут блоками по шесть, где первая позиция
 * занимает две колонки и две строки — сетка перестаёт быть однообразной.
 * Схема повторяется, поэтому подходит любому количеству товаров.
 */
const spanFor = (index: number): string => {
  const slot = index % 6;
  if (slot === 0) return 'md:col-span-2 md:row-span-2';
  if (slot === 3) return 'lg:col-span-2';
  return '';
};

const BentoGrid = ({ products, vehicle }: Props) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {products.map((p, i) => (
      <div key={p.id} className={spanFor(i)}>
        <ProductCard product={p} vehicle={vehicle} featured={i % 6 === 0} />
      </div>
    ))}
  </div>
);

export const BentoEmpty = ({ onReset }: { onReset: () => void }) => (
  <div className="tex-dots flex flex-col items-center border border-border/70 py-24 text-center">
    <Icon name="SearchX" size={28} className="text-muted-foreground" />
    <div className="display mt-5 text-2xl">Ничего не нашлось</div>
    <button
      onClick={onReset}
      className="mt-6 border border-foreground px-6 py-3 text-[0.8rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
    >
      Сбросить фильтры
    </button>
  </div>
);

export const BentoLink = ({ to, label }: { to: string; label: string }) => (
  <Link
    to={to}
    className="flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.1em] transition-colors hover:text-primary"
  >
    {label}
    <Icon name="ArrowRight" size={15} />
  </Link>
);

export default BentoGrid;
