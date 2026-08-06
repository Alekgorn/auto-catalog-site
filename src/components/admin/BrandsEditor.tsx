import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface AdminBrand {
  name: string;
  models: string[];
}

interface Props {
  brands: AdminBrand[];
  onSave: (brands: AdminBrand[]) => void;
  onReload?: () => void;
}

const BrandsEditor = ({ brands, onSave, onReload }: Props) => {
  const { toast } = useToast();
  const [list, setList] = useState<AdminBrand[]>(brands);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setList(brands);
  }, [brands]);

  const update = (i: number, next: AdminBrand) =>
    setList((l) => l.map((b, idx) => (idx === i ? next : b)));

  const exportExcel = async () => {
    setBusy(true);
    const res = await adminFetch('?action=brands-export-xlsx');
    const data = await res.json();
    setBusy(false);
    if (!res.ok || !data.file) {
      toast({ title: 'Ошибка', description: 'Не удалось собрать таблицу' });
      return;
    }
    const bytes = Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(
      new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `marki-i-modeli-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Таблица готова',
      description: 'Откройте в Excel: одна строка — марка и модель',
    });
  };

  const importExcel = async (file: File) => {
    setBusy(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.readAsDataURL(file);
      });
      const res = await adminFetch('?action=brands-import-xlsx', {
        method: 'POST',
        body: JSON.stringify({ file: base64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error ?? 'Не удалось загрузить' });
        return;
      }
      toast({
        title: 'Список обновлён',
        description: `Марок: ${data.brands}, моделей: ${data.models}`,
      });
      onReload?.();
    } catch {
      toast({ title: 'Ошибка', description: 'Файл не читается' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <p className="max-w-[40em] text-muted-foreground lg:col-span-6">
          Марки и модели используются в подборе на сайте и при отметке совместимости
          товаров. Модели указывайте через запятую.
        </p>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="border border-border p-5">
            <div className="flex items-center gap-3">
              <Icon name="Sheet" size={18} className="text-primary" />
              <span className="font-head text-[1rem] font-medium">
                Списком в Excel
              </span>
            </div>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-muted-foreground">
              Удобно, когда марок много: одна строка — марка и модель. Загрузка заменяет
              список целиком.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={exportExcel}
                disabled={busy}
                className="flex items-center gap-2 bg-foreground px-4 py-2.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                <Icon name="Download" size={15} />
                Скачать
              </button>
              <label className="flex w-fit cursor-pointer items-center gap-2 border border-foreground px-4 py-2.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary">
                <Icon name={busy ? 'Loader' : 'Upload'} size={15} />
                {busy ? 'Обрабатываем…' : 'Загрузить'}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importExcel(f);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

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