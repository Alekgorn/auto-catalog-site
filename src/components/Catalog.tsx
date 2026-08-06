import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import ProductCard from '@/components/ProductCard';
import { Category, Vehicle, isCompatible } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  vehicle: Vehicle | null;
  onReset: () => void;
}

const Catalog = ({ vehicle, onReset }: Props) => {
  const { products, categories } = useCatalog();
  const [category, setCategory] = useState<Category | 'Всё'>('Всё');
  const [onlyFits, setOnlyFits] = useState(true);

  const list = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'Всё' && p.category !== category) return false;
      if (vehicle && onlyFits && !isCompatible(p, vehicle)) return false;
      return true;
    }).sort((a, b) => {
      const fa = Number(isCompatible(a, vehicle));
      const fb = Number(isCompatible(b, vehicle));
      return fb - fa;
    });
  }, [category, onlyFits, vehicle, products]);

  const fitCount = vehicle
    ? products.filter((p) => isCompatible(p, vehicle)).length
    : products.length;

  return (
    <section id="catalog" className="section-pad scroll-mt-[76px]">
      <div className="rule" />
      <SectionHead
        index="01"
        eyebrow="Каталог оборудования"
        title={vehicle ? 'Подходит вашей машине' : 'Всё оборудование'}
        note={
          vehicle
            ? `Для ${vehicle.brand} ${vehicle.model} ${vehicle.year} года подходит ${fitCount} позиций. Совместимость проверена по штатным точкам крепления кузова.`
            : 'Выберите марку, модель и год выпуска в форме подбора — в списке останется только совместимое оборудование.'
        }
      />

      <div className="rule-hair" />

      <div className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {['Всё', ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`border-b pb-1 text-[0.78rem] uppercase tracking-[0.1em] transition-colors ${
                category === c
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-5">
          {vehicle && (
            <>
              <label className="flex cursor-pointer select-none items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-primary"
                  checked={onlyFits}
                  onChange={(e) => setOnlyFits(e.target.checked)}
                />
                Только совместимое
              </label>
              <button
                onClick={onReset}
                className="flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="X" size={14} />
                Сбросить авто
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rule-hair" />

      {list.length === 0 ? (
        <div className="py-24 text-center">
          <div className="font-head text-2xl font-medium uppercase tracking-tight">
            Ничего не нашлось
          </div>
          <p className="mx-auto mt-3 max-w-[28em] text-muted-foreground">
            Для этой комбинации марки, модели и года в выбранной категории позиций нет.
            Снимите фильтр совместимости или оставьте заявку — подберём вручную.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} vehicle={vehicle} />
          ))}
        </div>
      )}
    </section>
  );
};

export default Catalog;