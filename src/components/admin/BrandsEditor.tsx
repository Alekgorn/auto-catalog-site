import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

export interface AdminBrand {
  name: string;
  models: string[];
}

interface Props {
  brands: AdminBrand[];
  onSave: (brands: AdminBrand[]) => void;
}

const BrandsEditor = ({ brands, onSave }: Props) => {
  const [list, setList] = useState<AdminBrand[]>(brands);

  useEffect(() => {
    setList(brands);
  }, [brands]);

  const update = (i: number, next: AdminBrand) =>
    setList((l) => l.map((b, idx) => (idx === i ? next : b)));

  return (
    <div className="py-6">
      <p className="max-w-[40em] text-muted-foreground">
        Марки и модели используются в подборе на сайте и при отметке совместимости
        товаров. Модели указывайте через запятую.
      </p>

      <div className="mt-8 border-t border-foreground">
        {list.map((b, i) => (
          <div key={i} className="grid grid-cols-1 gap-4 border-b border-border py-5 md:grid-cols-12">
            <div className="md:col-span-3">
              <span className="eyebrow mb-1 block">Марка</span>
              <input
                value={b.name}
                onChange={(e) => update(i, { ...b, name: e.target.value })}
                className="w-full border-b border-border bg-transparent py-2 font-head text-lg font-medium outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="md:col-span-8">
              <span className="eyebrow mb-1 block">Модели</span>
              <input
                value={b.models.join(', ')}
                onChange={(e) =>
                  update(i, {
                    ...b,
                    models: e.target.value.split(',').map((m) => m.trim()),
                  })
                }
                className="w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <button
                onClick={() => setList((l) => l.filter((_, idx) => idx !== i))}
                aria-label="Удалить марку"
                className="pb-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="Trash2" size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setList((l) => [...l, { name: '', models: [] }])}
          className="flex items-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Plus" size={16} />
          Добавить марку
        </button>
        <button
          onClick={() =>
            onSave(
              list
                .filter((b) => b.name.trim())
                .map((b) => ({
                  name: b.name.trim(),
                  models: b.models.filter((m) => m.trim()),
                })),
            )
          }
          className="flex items-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Icon name="Check" size={16} />
          Сохранить марки
        </button>
      </div>
    </div>
  );
};

export default BrandsEditor;
