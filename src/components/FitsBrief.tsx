import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Product } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  product: Product;
}

const PREVIEW = 2;
/** Больше этого числа моделей списком не показываем — каталог поплывёт */
const MAX_EXPANDED = 20;

/** Совместимость в карточке: две модели, остальные — по кнопке. */
const FitsBrief = ({ product }: Props) => {
  const { brands } = useCatalog();
  const [open, setOpen] = useState(false);

  const models: string[] = [];
  Object.entries(product.fits ?? {}).forEach(([brand, list]) => {
    (list ?? []).forEach((m) => models.push(`${brand} ${m}`));
  });

  if (models.length === 0) return null;

  // Отмечены все модели из справочника — товар подходит любой машине
  const totalModels = brands.reduce((n, b) => n + b.models.length, 0);
  const universal = totalModels > 0 && models.length >= totalModels;

  if (universal) {
    return (
      <div className="mt-4 flex items-center gap-2 text-[0.8rem]">
        <span className="flex items-center gap-1.5 border border-border px-2 py-1 text-muted-foreground">
          <Icon name="Check" size={13} className="text-success" />
          Совместим с любым авто
        </span>
      </div>
    );
  }

  const visible = open ? models.slice(0, MAX_EXPANDED) : models.slice(0, PREVIEW);
  const hidden = models.length - visible.length;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.8rem] text-muted-foreground">
        {visible.map((m) => (
          <span key={m} className="border border-border px-2 py-1">
            {m}
          </span>
        ))}

        {open && hidden > 0 && <span className="px-1">и другие…</span>}

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
