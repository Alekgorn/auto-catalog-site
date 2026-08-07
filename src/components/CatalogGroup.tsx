import { Link } from 'react-router-dom';
import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { slugify } from '@/lib/slug';
import ProductCard from '@/components/ProductCard';
import { Product, Vehicle } from '@/data/catalog';

interface Props {
  category: string;
  products: Product[];
  vehicle: Vehicle | null;
}

const PREVIEW = 3;

/** Одна смысловая группа подбора: три товара сразу, остальные — по кнопке. */
const CatalogGroup = ({ category, products, vehicle }: Props) => {
  const [open, setOpen] = useState(false);

  const visible = open ? products : products.slice(0, PREVIEW);
  const hidden = products.length - visible.length;

  return (
    <div className="border-t border-foreground py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em]">
          <Link
            to={`/catalog/${slugify(category)}`}
            className="transition-colors hover:text-primary"
          >
            {category}
          </Link>
        </h3>
        <span className="text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
          {products.length}{' '}
          {products.length === 1 ? 'позиция' : products.length < 5 ? 'позиции' : 'позиций'}
        </span>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} vehicle={vehicle} />
        ))}
      </div>

      {(hidden > 0 || open) && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-6 flex w-full items-center justify-center gap-2 border border-foreground px-6 py-3.5 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary sm:w-auto sm:px-10"
        >
          {open ? 'Свернуть' : `Показать больше — ещё ${hidden}`}
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} />
        </button>
      )}
    </div>
  );
};

export default CatalogGroup;
