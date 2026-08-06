import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { CARD_FIELDS } from '@/data/catalog';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onImported: () => void;
}

const SettingsPanel = ({ onImported }: Props) => {
  const { toast } = useToast();
  const [fields, setFields] = useState<string[]>([]);
  const [mode, setMode] = useState<'merge' | 'skip'>('merge');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminFetch('?action=settings')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.settings?.card_fields)) setFields(d.settings.card_fields);
      })
      .catch(() => undefined);
  }, []);

  const toggle = (key: string) =>
    setFields((f) => (f.includes(key) ? f.filter((x) => x !== key) : [...f, key]));

  const saveFields = async () => {
    const res = await adminFetch('?action=settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: { card_fields: fields } }),
    });
    toast(
      res.ok
        ? { title: 'Настройки сохранены' }
        : { title: 'Ошибка', description: 'Не удалось сохранить' },
    );
  };

  const exportData = async () => {
    setBusy(true);
    const res = await adminFetch('?action=export');
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось выгрузить' });
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Файл готов',
      description: `${data.products?.length ?? 0} товаров и ${data.brands?.length ?? 0} марок`,
    });
  };

  const importData = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await adminFetch('?action=import', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          products: parsed.products ?? [],
          brands: parsed.brands ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error ?? 'Не удалось загрузить' });
        return;
      }
      toast({
        title: 'Загружено',
        description: `Добавлено: ${data.created}, обновлено: ${data.updated}`,
      });
      onImported();
    } catch {
      toast({ title: 'Ошибка', description: 'Файл повреждён или не тот формат' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="eyebrow">Карточка в каталоге</div>
        <h2 className="mt-3 font-head text-2xl font-bold uppercase tracking-[-0.02em]">
          Что показывать в списке
        </h2>
        <p className="mt-4 max-w-[34em] text-muted-foreground">
          Отметьте характеристики, которые видит покупатель прямо в карточке товара в
          каталоге. Остальные останутся на странице товара.
        </p>

        <div className="mt-6 border-t border-foreground">
          {CARD_FIELDS.map((f) => (
            <label
              key={f.key}
              className="flex cursor-pointer items-center gap-3 border-b border-border py-3"
            >
              <input
                type="checkbox"
                checked={fields.includes(f.key)}
                onChange={() => toggle(f.key)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[0.95rem]">{f.label}</span>
            </label>
          ))}
        </div>

        <button
          onClick={saveFields}
          className="mt-6 flex items-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Icon name="Check" size={16} />
          Сохранить
        </button>
      </div>

      <div className="lg:col-span-6 lg:col-start-7">
        <div className="eyebrow">Импорт и экспорт</div>
        <h2 className="mt-3 font-head text-2xl font-bold uppercase tracking-[-0.02em]">
          Перенос каталога
        </h2>
        <p className="mt-4 max-w-[34em] text-muted-foreground">
          Выгрузите весь каталог одним файлом — товары, марки и модели. Этот же файл можно
          загрузить обратно: пригодится для массовой правки цен или переноса на другой
          сайт.
        </p>

        <div className="mt-8 border-t border-foreground pt-6">
          <div className="font-head text-lg font-medium">Выгрузка</div>
          <p className="mt-2 text-[0.9rem] text-muted-foreground">
            Скачает файл со всеми товарами, марками и моделями.
          </p>
          <button
            onClick={exportData}
            disabled={busy}
            className="mt-4 flex items-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <Icon name="Download" size={16} />
            Скачать каталог
          </button>
        </div>

        <div className="mt-8 border-t border-foreground pt-6">
          <div className="font-head text-lg font-medium">Загрузка</div>
          <p className="mt-2 text-[0.9rem] text-muted-foreground">
            Товары сопоставляются по внутреннему коду: совпавшие обновятся, новые
            добавятся. Ничего не удаляется.
          </p>

          <div className="mt-4 flex flex-wrap gap-6">
            {(
              [
                ['merge', 'Обновлять совпадения'],
                ['skip', 'Пропускать существующие'],
              ] as const
            ).map(([key, text]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={mode === key}
                  onChange={() => setMode(key)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-[0.9rem]">{text}</span>
              </label>
            ))}
          </div>

          <label className="mt-5 flex w-fit cursor-pointer items-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground">
            <Icon name={busy ? 'Loader' : 'Upload'} size={16} />
            {busy ? 'Загружаем…' : 'Выбрать файл'}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
