import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Product } from '@/data/catalog';

interface Props {
  product: Product;
}

const PREVIEW = 2;

/** Совместимость в карточке: две модели, остальные — по кнопке. */
const FitsBrief = ({ product }: Props) => {
  const [open, setOpen] = useState(false);

  const models: string[] = [];
  Object.entries(product.fits ?? {}).forEach(([brand, list]) => {
    (list ?? []).forEach((m) => models.push(`${brand} ${m}`));
  });

  if (models.length === 0) return null;

  const visible = open ? models : models.slice(0, PREVIEW);
  const hidden = models.length - visible.length;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.8rem] text-muted-foreground">
        {visible.map((m) => (
          <span key={m} className="border border-border px-2 py-1">
            {m}
          </span>
        ))}

        {(hidden > 0 || open) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setOpen((v) => !v);
            }}
            className="flex items-center gap-1 border border-foreground px-2 py-1 text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {open ? 'Свернуть' : `Ещё ${hidden}`}
            <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FitsBrief;
