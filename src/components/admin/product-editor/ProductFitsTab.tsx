import Icon from '@/components/ui/icon';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from './product-types';

interface Props {
  form: AdminProduct;
  brands: AdminBrand[];
  allSelected: boolean;
  selectedCount: number;
  totalModels: number;
  toggleAll: () => void;
  toggleBrand: (brand: AdminBrand) => void;
  toggleModel: (brand: string, model: string) => void;
}

/** Вкладка «Совместимость»: отметки марок и моделей, к которым подходит товар. */
const ProductFitsTab = ({
  form,
  brands,
  allSelected,
  selectedCount,
  totalModels,
  toggleAll,
  toggleBrand,
  toggleModel,
}: Props) => (
  <div className="space-y-6">
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
      const selected = form.fits[b.name] ?? [];
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
              const on = selected.includes(m);
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
  </div>
);

export default ProductFitsTab;
