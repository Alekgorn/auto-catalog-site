import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { adminFetch } from '@/lib/api';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct, emptyProduct } from '@/components/admin/product-editor/product-types';
import ProductMainTab from '@/components/admin/product-editor/ProductMainTab';
import ProductContentTab from '@/components/admin/product-editor/ProductContentTab';
import ProductFitsTab from '@/components/admin/product-editor/ProductFitsTab';
import BlocksEditor, { cleanBlocks } from '@/components/admin/BlocksEditor';
import { keepOpenOnZoom } from '@/components/admin/ImageZoom';
import { findFitKey, hasFitModel, sameFit } from '@/lib/fits-match';
import { FitMode } from '@/data/catalog';

export type { AdminProduct };
export { emptyProduct };

interface Props {
  product: AdminProduct;
  categories: string[];
  categorySpecs?: Record<string, string[]>;
  /** Умолчание «как подбирается» у каждой категории */
  categoryFitModes?: Record<string, FitMode>;
  brands: AdminBrand[];
  onClose: () => void;
  onSave: (p: AdminProduct) => void;
}

const ProductEditor = ({
  product,
  categories,
  categorySpecs = {},
  categoryFitModes = {},
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
    videoUrl: product.videoUrl ?? '',
    notes: product.notes ?? [],
    extra: product.extra ?? [],
    extraTitle: product.extraTitle ?? '',
    fits: product.fits ?? {},
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<
    'main' | 'content' | 'notes' | 'extra' | 'fits'
  >(
    'main',
  );

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

  /**
   * Перенос уже загруженного снимка из «Описания и фото» в блочный раздел:
   * «Особенности» или «Свой раздел». Файл не перезагружаем — используем ту
   * же ссылку, поэтому перенос мгновенный. Сразу открываем вкладку, чтобы
   * было видно результат.
   */
  const moveToBlocks = (src: string, to: 'notes' | 'extra') => {
    setForm((f) => ({
      ...f,
      images: f.images.filter((x) => x !== src),
      [to]: [...f[to], { type: 'image' as const, image: src, caption: '' }],
    }));
    setSection(to);
  };

  /**
   * Перекладываем снимок между блочными разделами, не возвращая его
   * в галерею: фото салона может понадобиться и в нюансах монтажа, и
   * в своём разделе — раньше для этого приходилось делать два шага.
   */
  const moveBetweenBlocks = (src: string, to: 'notes' | 'extra') => {
    setForm((f) => ({
      ...f,
      [to]: [...f[to], { type: 'image' as const, image: src, caption: '' }],
    }));
    setSection(to);
  };

  /**
   * Отметка модели. Марка в товаре может быть записана иначе, чем в
   * справочнике («Fiat» против «FIAT») — находим её в любом написании
   * и перекладываем под название справочника, чтобы не плодить дубли.
   */
  const toggleModel = (brand: string, model: string) => {
    setForm((f) => {
      const fits = { ...f.fits };
      const key = findFitKey(fits, brand);
      const current = key ? fits[key] : [];
      const next = hasFitModel(current, model)
        ? current.filter((m) => !sameFit(m, model))
        : [...current, model];

      if (key && key !== brand) delete fits[key];
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
      const key = findFitKey(fits, brand.name);
      const current = key ? fits[key] : [];
      if (key) delete fits[key];
      // Отмечены все модели — снимаем марку целиком, иначе отмечаем все
      if (current.length !== brand.models.length) {
        fits[brand.name] = [...brand.models];
      }
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
      notes: cleanBlocks(form.notes),
      extra: cleanBlocks(form.extra),
      extraTitle: form.extraTitle.trim(),
    });
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        {...keepOpenOnZoom}
        className="max-h-[92vh] max-w-3xl gap-0 overflow-y-auto rounded-none border-foreground p-0"
      >
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
              ['notes', 'Особенности'],
              ['extra', 'Свой раздел'],
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
            <ProductMainTab form={form} set={set} categories={categories} />
          )}

          {section === 'content' && (
            <ProductContentTab
              form={form}
              set={set}
              uploading={uploading}
              upload={upload}
              missingFields={missingFields}
              moveToBlocks={moveToBlocks}
            />
          )}

          {section === 'notes' && (
            <BlocksEditor
              blocks={form.notes}
              onChange={(next) => set('notes', next)}
              types={['text', 'image', 'note']}
              title="Особенности и примечания"
              hint="Нюансы монтажа этого товара: что подрезать, где не встанет, какие переходники нужны. На сайте появится отдельной вкладкой «Нюансы монтажа». Пусто — напишем «Установка стандартная»."
              emptyText="Особенностей нет — на сайте будет «Установка стандартная»."
              onMoveImageOut={(src) =>
                setForm((f) => ({
                  ...f,
                  images: f.images.includes(src)
                    ? f.images
                    : [...f.images, src],
                }))
              }
              moveTo={{
                label: 'В «Свой раздел»',
                run: (src) => moveBetweenBlocks(src, 'extra'),
              }}
            />
          )}

          {section === 'extra' && (
            <div>
              {/* Заголовок задаёт магазин. Пустой — раздел на сайте скрыт,
                  поэтому подписываем это прямо под полем */}
              <label className="block">
                <span className="eyebrow">Заголовок раздела</span>
                <input
                  value={form.extraTitle}
                  onChange={(e) => set('extraTitle', e.target.value)}
                  placeholder="Например: Экран магнитолы"
                  maxLength={160}
                  className="mt-2 w-full border-b border-border bg-transparent py-2 font-head text-lg outline-none transition-colors focus:border-primary"
                />
              </label>
              <p className="mt-2 text-[0.8rem] text-muted-foreground">
                {form.extraTitle.trim()
                  ? `На сайте появится вкладка «${form.extraTitle.trim()}».`
                  : 'Пока заголовок пустой — раздел на сайте не показывается.'}
              </p>

              <div className="mt-7">
                <BlocksEditor
                  blocks={form.extra}
                  onChange={(next) => set('extra', next)}
                  types={['text', 'image', 'note']}
                  title="Содержание раздела"
                  hint="Свободный блок: скриншоты экрана, фото в салоне, примеры работы. Несколько фото подряд встанут аккуратной плиткой, а по клику откроются на весь экран."
                  emptyText="Пусто — добавьте фото или текст."
                  onMoveImageOut={(src) =>
                    setForm((f) => ({
                      ...f,
                      images: f.images.includes(src)
                        ? f.images
                        : [...f.images, src],
                    }))
                  }
                  moveTo={{
                    label: 'В «Особенности»',
                    run: (src) => moveBetweenBlocks(src, 'notes'),
                  }}
                />
              </div>
            </div>
          )}

          {section === 'fits' && (
            <ProductFitsTab
              form={form}
              brands={brands}
              allSelected={allSelected}
              selectedCount={selectedCount}
              totalModels={totalModels}
              categoryMode={categoryFitModes[form.category] ?? 'universal'}
              onFitMode={(m) => setForm((f) => ({ ...f, fitMode: m }))}
              toggleAll={toggleAll}
              toggleBrand={toggleBrand}
              toggleModel={toggleModel}
            />
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