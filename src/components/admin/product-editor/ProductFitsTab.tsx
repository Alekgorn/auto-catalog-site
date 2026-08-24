import Icon from '@/components/ui/icon';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from './product-types';
import { findFitModels, hasFitModel } from '@/lib/fits-match';
import { FitMode } from '@/data/catalog';

interface Props {
  form: AdminProduct;
  brands: AdminBrand[];
  allSelected: boolean;
  selectedCount: number;
  totalModels: number;
  /** Что стоит у категории — показываем как подпись «как в категории» */
  categoryMode?: FitMode;
  onFitMode: (mode: '' | FitMode) => void;
  toggleAll: () => void;
  toggleBrand: (brand: AdminBrand) => void;
  toggleModel: (brand: string, model: string) => void;
}

const MODE_LABEL: Record<FitMode, string> = {
  vehicle: 'Подбирается по машине',
  universal: 'Подходит любой машине',
};

const MODE_HINT: Record<FitMode, string> = {
  vehicle: 'Рамки, переходники, разъёмы. Покажем только тем, у кого подходящая машина.',
  universal:
    'Регистраторы, камеры, шумоизоляция, магнитолы. Отмечать модели не нужно.',
};

/** Вкладка «Совместимость»: отметки марок и моделей, к которым подходит товар. */
const ProductFitsTab = ({
  form,
  brands,
  allSelected,
  selectedCount,
  totalModels,
  categoryMode = 'universal',
  onFitMode,
  toggleAll,
  toggleBrand,
  toggleModel,
}: Props) => {
  // Пустое поле у товара — берём то, что стоит у категории
  const mode: FitMode = form.fitMode || categoryMode;
  const inherited = !form.fitMode;

  return (
  <div className="space-y-6">
    <div className="border border-border p-5">
      <span className="eyebrow mb-3 block">Как подбирается</span>
      <div className="flex flex-wrap gap-3">
        {(['vehicle', 'universal'] as FitMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onFitMode(m)}
            className={`border px-4 py-2.5 text-left text-[0.85rem] transition-colors ${
              mode === m
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
        {!inherited && (
          <button
            onClick={() => onFitMode('')}
            title="Вернуть значение категории"
            className="flex items-center gap-2 px-3 py-2.5 text-[0.78rem] text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="RotateCcw" size={14} />
            Как в категории
          </button>
        )}
      </div>
      <p className="mt-3 text-[0.8rem] leading-relaxed text-muted-foreground">
        {MODE_HINT[mode]}
        {inherited && (
          <span className="ml-1 opacity-70">
            Взято из категории — меняется вместе с ней.
          </span>
        )}
      </p>
    </div>

    {mode === 'universal' ? (
      <p className="text-[0.85rem] text-muted-foreground">
        Товар подходит любой машине — отмечать марки и модели не нужно.
      </p>
    ) : (
    <>
    <p className="text-[0.85rem] text-muted-foreground">
      Отметьте модели, к которым подходит товар. Годы выпуска задаются на вкладке
      «Основное».
    </p>

    {brands.length > 0 && (
      <div className="flex flex-wrap items-center gap-3 border-y border-border py-3">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 border border-foreground px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Icon name={allSelected ? 'Square' : 'CheckCheck'} size={15} />
          {allSelected ? 'Снять все марки и модели' : 'Все марки и модели'}
        </button>
        <span className="text-[0.78rem] text-muted-foreground">
          Выбрано {selectedCount} из {totalModels}
        </span>
      </div>
    )}

    {brands.length === 0 && (
      <div className="text-muted-foreground">
        Сначала добавьте марки на вкладке «Марки».
      </div>
    )}
    {brands.map((b) => {
      /* Марка в товаре может быть записана иначе, чем в справочнике
         («Fiat» против «FIAT») — ищем с поправкой на написание,
         иначе отметки выглядят снятыми, хотя в товаре они есть */
      const selected = findFitModels(form.fits, b.name) ?? [];
      return (
        <div key={b.name} className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="font-head text-lg font-bold uppercase tracking-tight">
              {b.name}
            </div>
            <button
              onClick={() => toggleBrand(b)}
              className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
            >
              {selected.length === b.models.length ? 'Снять все' : 'Выбрать все'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {b.models.map((m) => {
              const on = hasFitModel(selected, m);
              return (
                <button
                  key={m}
                  onClick={() => toggleModel(b.name, m)}
                  className={`border px-3 py-2 text-[0.85rem] transition-colors ${
                    on
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
    </>
    )}
  </div>
  );
};

export default ProductFitsTab;