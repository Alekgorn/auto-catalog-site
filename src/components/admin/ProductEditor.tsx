import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { adminFetch } from '@/lib/api';
import { AdminBrand } from '@/components/admin/BrandsEditor';

export interface AdminProduct {
  id?: number;
  slug?: string;
  sku?: string;
  popularity?: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  /** Цена для дилеров — видна в админке и выгрузке */
  proPrice: number | null;
  ozonUrl: string;
  wbUrl: string;
  install: string;
  warranty: string;
  yearFrom: number;
  yearTo: number;
  badge: string | null;
  images: string[];
  description: string[];
  specs: [string, string][];
  kit: string[];
  fits: Record<string, string[]>;
  sortOrder: number;
  isActive: boolean;
}

export const emptyProduct = (): AdminProduct => ({
  sku: '',
  popularity: 0,
  name: '',
  category: '',
  price: 0,
  oldPrice: null,
  proPrice: null,
  ozonUrl: '',
  wbUrl: '',
  install: '',
  warranty: '',
  yearFrom: 2015,
  yearTo: new Date().getFullYear(),
  badge: null,
  images: [],
  description: [''],
  specs: [],
  kit: [''],
  fits: {},
  sortOrder: 100,
  isActive: true,
});

interface Props {
  product: AdminProduct;
  categories: string[];
  categorySpecs?: Record<string, string[]>;
  brands: AdminBrand[];
  onClose: () => void;
  onSave: (p: AdminProduct) => void;
}

const label = 'eyebrow block mb-1';
const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';

const ProductEditor = ({
  product,
  categories,
  categorySpecs = {},
  brands,
  onClose,
  onSave,
}: Props) => {
  const [form, setForm] = useState<AdminProduct>({
    ...product,
    description: product.description?.length ? product.description : [''],
    kit: product.kit?.length ? product.kit : [''],
    specs: product.specs ?? [],
    images: product.images ?? [],
    fits: product.fits ?? {},
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<'main' | 'content' | 'fits'>('main');

  const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
      });
      const res = await adminFetch('?action=upload', {
        method: 'POST',
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      }
    }
    setUploading(false);
  };

  const toggleModel = (brand: string, model: string) => {
    setForm((f) => {
      const current = f.fits[brand] ?? [];
      const next = current.includes(model)
        ? current.filter((m) => m !== model)
        : [...current, model];
      const fits = { ...f.fits };
      if (next.length) fits[brand] = next;
      else delete fits[brand];
      return { ...f, fits };
    });
  };

  const totalModels = brands.reduce((n, b) => n + b.models.length, 0);
  const selectedCount = Object.values(form.fits).reduce((n, m) => n + m.length, 0);
  const allSelected = totalModels > 0 && selectedCount === totalModels;

  /** Отметить сразу все марки со всеми моделями (или снять всё) */
  const toggleAll = () => {
    setForm((f) => {
      if (allSelected) return { ...f, fits: {} };
      const fits: Record<string, string[]> = {};
      brands.forEach((b) => {
        if (b.models.length) fits[b.name] = [...b.models];
      });
      return { ...f, fits };
    });
  };

  const toggleBrand = (brand: AdminBrand) => {
    setForm((f) => {
      const fits = { ...f.fits };
      if (fits[brand.name]?.length === brand.models.length) delete fits[brand.name];
      else fits[brand.name] = [...brand.models];
      return { ...f, fits };
    });
  };

  // Поля, заданные для категории, но ещё не заполненные у товара
  const missingFields = (categorySpecs[form.category] ?? []).filter(
    (f) => !form.specs.some(([k]) => k.trim().toLowerCase() === f.trim().toLowerCase()),
  );

  const submit = () => {
    if (!form.name.trim()) return setError('Укажите название');
    if (!form.category.trim()) return setError('Укажите категорию');
    setError(null);
    onSave({
      ...form,
      description: form.description.filter((d) => d.trim()),
      kit: form.kit.filter((k) => k.trim()),
      specs: form.specs.filter(([k]) => k.trim()),
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-y-auto rounded-none border-foreground p-0">
        <div className="sticky top-0 z-10 border-b border-foreground bg-primary px-6 py-5 text-primary-foreground">
          <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
            {form.id ? 'Редактирование' : 'Новый товар'}
          </div>
          <div className="mt-1 font-head text-xl font-bold uppercase tracking-tight">
            {form.name || 'Без названия'}
          </div>
        </div>

        <div className="flex gap-6 border-b border-border px-6 pt-4">
          {(
            [
              ['main', 'Основное'],
              ['content', 'Описание и фото'],
              ['fits', 'Совместимость'],
            ] as const
          ).map(([key, text]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`border-b-2 pb-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors ${
                section === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          {section === 'main' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className={label}>Название</span>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Категория</span>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={`${field} cursor-pointer`}
                >
                  <option value="">— выберите категорию —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {form.category && !categories.includes(form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                </select>
              </div>
              <div>
                <span className={label}>Артикул</span>
                <input
                  value={form.sku ?? ''}
                  onChange={(e) => set('sku', e.target.value)}
                  className={field}
                  placeholder="TOW-01"
                />
              </div>
              <div>
                <span className={label}>Метка (Хит, Акция)</span>
                <input
                  value={form.badge ?? ''}
                  onChange={(e) => set('badge', e.target.value || null)}
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Популярность (0—100)</span>
                <input
                  type="number"
                  value={form.popularity ?? 0}
                  onChange={(e) => set('popularity', Number(e.target.value))}
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Цена, ₽</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set('price', Number(e.target.value))}
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Старая цена, ₽</span>
                <input
                  type="number"
                  value={form.oldPrice ?? ''}
                  onChange={(e) =>
                    set('oldPrice', e.target.value ? Number(e.target.value) : null)
                  }
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Цена дилера, ₽</span>
                <input
                  type="number"
                  value={form.proPrice ?? ''}
                  onChange={(e) =>
                    set('proPrice', e.target.value ? Number(e.target.value) : null)
                  }
                  className={field}
                />
              </div>
              <div className="md:col-span-2">
                <span className={label}>Ссылка на Ozon</span>
                <input
                  value={form.ozonUrl}
                  onChange={(e) => set('ozonUrl', e.target.value)}
                  placeholder="https://www.ozon.ru/product/..."
                  className={field}
                />
              </div>
              <div className="md:col-span-2">
                <span className={label}>Ссылка на Wildberries</span>
                <input
                  value={form.wbUrl}
                  onChange={(e) => set('wbUrl', e.target.value)}
                  placeholder="https://www.wildberries.ru/catalog/..."
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Гарантия</span>
                <input
                  value={form.warranty}
                  onChange={(e) => set('warranty', e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Порядок в каталоге</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', Number(e.target.value))}
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Год авто с</span>
                <input
                  type="number"
                  value={form.yearFrom}
                  onChange={(e) => set('yearFrom', Number(e.target.value))}
                  className={field}
                />
              </div>
              <div>
                <span className={label}>Год авто по</span>
                <input
                  type="number"
                  value={form.yearTo}
                  onChange={(e) => set('yearTo', Number(e.target.value))}
                  className={field}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-[0.9rem]">Показывать на сайте</span>
              </label>
            </div>
          )}

          {section === 'content' && (
            <div className="space-y-7">
              <div>
                <span className={label}>Фотографии</span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {form.images.map((src, i) => (
                    <div key={src + i} className="relative">
                      <img src={src} alt="" className="h-24 w-24 bg-card object-contain p-1" />
                      <button
                        onClick={() =>
                          set(
                            'images',
                            form.images.filter((_, idx) => idx !== i),
                          )
                        }
                        aria-label="Удалить фото"
                        className="absolute -right-2 -top-2 bg-primary p-1 text-primary-foreground"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Icon name={uploading ? 'Loader' : 'Plus'} size={18} />
                    {uploading ? 'Грузим' : 'Добавить'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => upload(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <span className={label}>Описание (абзацы)</span>
                {form.description.map((d, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <textarea
                      value={d}
                      rows={3}
                      onChange={(e) =>
                        set(
                          'description',
                          form.description.map((x, idx) =>
                            idx === i ? e.target.value : x,
                          ),
                        )
                      }
                      className="w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary"
                    />
                    <button
                      onClick={() =>
                        set(
                          'description',
                          form.description.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label="Удалить абзац"
                      className="h-fit text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set('description', [...form.description, ''])}
                  className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Plus" size={14} />
                  Абзац
                </button>
              </div>

              <div>
                <span className={label}>Характеристики</span>

                {missingFields.length > 0 && (
                  <div className="mb-4 border border-border bg-surface-muted p-3">
                    <div className="text-[0.78rem] text-muted-foreground">
                      Для категории «{form.category}» не заполнены:
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {missingFields.map((f) => (
                        <button
                          key={f}
                          onClick={() => set('specs', [...form.specs, [f, '']])}
                          className="flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 text-[0.78rem] transition-colors hover:border-primary hover:text-primary"
                        >
                          <Icon name="Plus" size={13} />
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.specs.map(([k, v], i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input
                      value={k}
                      placeholder="Название"
                      onChange={(e) =>
                        set(
                          'specs',
                          form.specs.map((s, idx) =>
                            idx === i ? [e.target.value, s[1]] : s,
                          ) as [string, string][],
                        )
                      }
                      className={field}
                    />
                    <input
                      value={v}
                      placeholder="Значение"
                      onChange={(e) =>
                        set(
                          'specs',
                          form.specs.map((s, idx) =>
                            idx === i ? [s[0], e.target.value] : s,
                          ) as [string, string][],
                        )
                      }
                      className={field}
                    />
                    <button
                      onClick={() =>
                        set(
                          'specs',
                          form.specs.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label="Удалить"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set('specs', [...form.specs, ['', '']])}
                  className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Plus" size={14} />
                  Характеристика
                </button>
              </div>

              <div>
                <span className={label}>Комплектация</span>
                {form.kit.map((k, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input
                      value={k}
                      onChange={(e) =>
                        set(
                          'kit',
                          form.kit.map((x, idx) => (idx === i ? e.target.value : x)),
                        )
                      }
                      className={field}
                    />
                    <button
                      onClick={() =>
                        set(
                          'kit',
                          form.kit.filter((_, idx) => idx !== i),
                        )
                      }
                      aria-label="Удалить"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set('kit', [...form.kit, ''])}
                  className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Plus" size={14} />
                  Пункт
                </button>
              </div>
            </div>
          )}

          {section === 'fits' && (
            <div className="space-y-6">
              <p className="text-[0.85rem] text-muted-foreground">
                Отметьте модели, к которым подходит товар. Годы выпуска задаются на
                вкладке «Основное».
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
          )}

          {error && <div className="mt-5 text-[0.85rem] text-primary">{error}</div>}

          <div className="mt-8 flex gap-3">
            <button
              onClick={submit}
              className="flex flex-1 items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase text-background transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Сохранить
              <Icon name="Check" size={18} />
            </button>
            <button
              onClick={onClose}
              className="border border-foreground px-6 py-4 font-head text-[0.9rem] font-medium uppercase transition-colors hover:border-primary hover:text-primary"
            >
              Отмена
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditor;