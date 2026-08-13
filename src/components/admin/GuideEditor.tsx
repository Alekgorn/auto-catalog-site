import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GuideBlock } from '@/data/catalog';
import { AdminProduct } from '@/components/admin/ProductEditor';
import BlocksEditor, { cleanBlocks, uploadImage } from '@/components/admin/BlocksEditor';

export interface AdminGuide {
  id?: number;
  slug?: string;
  title: string;
  excerpt: string;
  cover: string;
  duration: string;
  difficulty: string;
  tools: string[];
  blocks: GuideBlock[];
  productIds: number[];
  sortOrder: number;
  isActive: boolean;
}

export const emptyGuide = (): AdminGuide => ({
  title: '',
  excerpt: '',
  cover: '',
  duration: '',
  difficulty: '',
  tools: [],
  blocks: [{ type: 'step', title: '', text: '' }],
  productIds: [],
  sortOrder: 100,
  isActive: true,
});

interface Props {
  guide: AdminGuide;
  products: AdminProduct[];
  onClose: () => void;
  onSave: (g: AdminGuide) => void;
}

const label = 'eyebrow block mb-1';
const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';
const area =
  'w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary';

const GuideEditor = ({ guide, products, onClose, onSave }: Props) => {
  const [form, setForm] = useState<AdminGuide>({
    ...guide,
    blocks: guide.blocks?.length ? guide.blocks : [{ type: 'step', title: '', text: '' }],
    tools: guide.tools ?? [],
    productIds: guide.productIds ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const set = <K extends keyof AdminGuide>(key: K, value: AdminGuide[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pickImage = async (files: FileList | null, apply: (url: string) => void) => {
    if (!files?.length) return;
    setBusy(true);
    const url = await uploadImage(files[0]);
    setBusy(false);
    if (url) apply(url);
  };

  const toggleProduct = (id: number) =>
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((x) => x !== id)
        : [...f.productIds, id],
    }));

  const submit = () => {
    if (!form.title.trim()) return setError('Укажите заголовок');
    setError(null);
    onSave({
      ...form,
      blocks: cleanBlocks(form.blocks),
      tools: form.tools.filter((t) => t.trim()),
    });
  };

  const shown = products.filter((p) =>
    (p.name + ' ' + p.category).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl gap-0 overflow-y-auto rounded-none border-foreground p-0">
        <div className="sticky top-0 z-10 border-b border-foreground bg-primary px-6 py-5 text-primary-foreground">
          <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
            {form.id ? 'Редактирование инструкции' : 'Новая инструкция'}
          </div>
          <div className="mt-1 font-head text-xl font-bold uppercase tracking-tight">
            {form.title || 'Без названия'}
          </div>
        </div>

        <div className="space-y-8 px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className={label}>Заголовок</span>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={field}
                placeholder="Подключение CAN-адаптера на Lada Vesta SW Cross"
              />
            </div>
            <div className="sm:col-span-2">
              <span className={label}>Краткое описание</span>
              <textarea
                value={form.excerpt}
                rows={2}
                onChange={(e) => set('excerpt', e.target.value)}
                className={area}
              />
            </div>
            <div>
              <span className={label}>Время работ</span>
              <input
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                className={field}
                placeholder="2,5 часа"
              />
            </div>
            <div>
              <span className={label}>Сложность</span>
              <input
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                className={field}
                placeholder="средняя"
              />
            </div>
            <div className="sm:col-span-2">
              <span className={label}>Инструмент (через запятую)</span>
              <input
                value={form.tools.join(', ')}
                onChange={(e) => set('tools', e.target.value.split(',').map((t) => t.trim()))}
                className={field}
                placeholder="Ключ на 17, динамометрический ключ, домкрат"
              />
            </div>
            <div>
              <span className={label}>Порядок</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', Number(e.target.value))}
                className={field}
              />
            </div>
            <label className="flex cursor-pointer items-end gap-3 pb-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[0.9rem]">Показывать на сайте</span>
            </label>
          </div>

          <div>
            <span className={label}>Обложка</span>
            <div className="mt-2 flex items-center gap-4">
              {form.cover ? (
                <div className="relative">
                  <img src={form.cover} alt="" className="h-24 w-32 bg-card object-cover" />
                  <button
                    onClick={() => set('cover', '')}
                    aria-label="Удалить"
                    className="absolute -right-2 -top-2 bg-primary p-1 text-primary-foreground"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <Icon name={busy ? 'Loader' : 'Plus'} size={18} />
                  Загрузить
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickImage(e.target.files, (url) => set('cover', url))}
                  />
                </label>
              )}
            </div>
          </div>

          <BlocksEditor
            blocks={form.blocks}
            onChange={(next) => set('blocks', next)}
          />

          <div>
            <span className={label}>К каким товарам показывать</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товара"
              className={`${field} mb-3`}
            />
            <div className="max-h-64 space-y-1 overflow-y-auto border border-border p-3">
              {shown.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 py-1 text-[0.88rem]"
                >
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(p.id as number)}
                    onChange={() => toggleProduct(p.id as number)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="flex-1">{p.name}</span>
                  <span className="text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
                    {p.category}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-[0.78rem] text-muted-foreground">
              Выбрано: {form.productIds.length}
            </div>
          </div>

          {error && <div className="text-[0.85rem] text-primary">{error}</div>}

          <div className="flex gap-3">
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

export default GuideEditor;
