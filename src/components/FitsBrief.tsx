import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Product, isUniversal } from '@/data/catalog';
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

  /**
   * Товар подходит любой машине — список моделей не нужен: под карточкой
   * уже стоит зелёная отметка «Подходит ко всем автомобилям».
   * Правило то же, что и у этой отметки, иначе получалось расхождение.
   */
  if (isUniversal(product, brands.length)) return null;

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
