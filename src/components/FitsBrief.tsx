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
      <div className="mt-3 flex items-center gap-2 text-[0.7rem] sm:mt-4 sm:text-[0.8rem]">
        <span className="flex items-center gap-1.5 border border-border px-1.5 py-0.5 text-muted-foreground sm:px-2 sm:py-1">
          <Icon name="Check" size={13} className="text-success" />
          Совместим с любым авто
        </span>
      </div>
    );
  }

  const visible = open ? models.slice(0, MAX_EXPANDED) : models.slice(0, PREVIEW);
  const hidden = models.length - visible.length;

  return (
    <div className="mt-3 sm:mt-4">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.7rem] text-muted-foreground sm:gap-x-2 sm:gap-y-1.5 sm:text-[0.8rem]">
        {visible.map((m) => (
          <span key={m} className="max-w-full truncate border border-border px-1.5 py-0.5 sm:px-2 sm:py-1">
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
            className="flex items-center gap-1 border border-foreground px-1.5 py-0.5 text-foreground transition-colors hover:border-primary hover:text-primary sm:px-2 sm:py-1"
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
