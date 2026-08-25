import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { CARD_FIELDS } from '@/data/catalog';
import { useToast } from '@/hooks/use-toast';
import SearchPagesPanel from '@/components/admin/SearchPagesPanel';

interface Props {
  onImported: () => void;
}

const SettingsPanel = ({ onImported }: Props) => {
  const { toast } = useToast();
  const [fields, setFields] = useState<string[]>([]);
  const [mode, setMode] = useState<'merge' | 'skip'>('merge');
  const [busy, setBusy] = useState(false);
  /** Ход загрузки каталога: файл уходит частями, показываем сколько сделано */
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const xlsRef = useRef<HTMLInputElement>(null);

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

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const exportExcel = async () => {
    setBusy(true);
    const res = await adminFetch('?action=export-xlsx');
    const data = await res.json();
    setBusy(false);
    if (!res.ok || !data.file) {
      toast({ title: 'Ошибка', description: 'Не удалось собрать таблицу' });
      return;
    }
    const bytes = Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0));
    download(
      new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `katalog-${today()}.xlsx`,
    );
    toast({ title: 'Таблица готова', description: 'Откройте её в Excel и правьте данные' });
  };

  const importExcel = async (file: File) => {
    setBusy(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.readAsDataURL(file);
      });
      /*
       * Каталог грузим порциями. За один вызов функция успевает обработать
       * ограниченное число строк — на большом файле она обрывалась по
       * таймауту, и приходилось жать «Загрузить» по нескольку раз.
       * Теперь браузер сам шлёт отрезки подряд, пока файл не кончится.
       */
      // Файл разбирается заново на каждом вызове (~1 с), поэтому на сами
      // товары остаётся немного времени — берём порцию с запасом
      const STEP = 150;
      let offset = 0;
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let categories = 0;
      let external = 0;
      let problems: string[] = [];
      let data: Record<string, unknown> = {};

      for (let guard = 0; guard < 200; guard += 1) {
        const res = await adminFetch('?action=import-xlsx', {
          method: 'POST',
          body: JSON.stringify({ mode, file: base64, offset, limit: STEP }),
        });
        data = await res.json();
        if (!res.ok) {
          toast({
            title: 'Ошибка',
            description: (data.error as string) ?? 'Не удалось загрузить',
          });
          return;
        }
        created += Number(data.created ?? 0);
        updated += Number(data.updated ?? 0);
        skipped += Number(data.skipped ?? 0);
        categories += Number(data.categories ?? 0);
        external += Number(data.external_images ?? 0);
        problems = problems.concat((data.problems as string[]) ?? []);

        const total = Number(data.total ?? 0);
        const processed = Number(data.processed ?? 0);
        setProgress(total > 0 && !data.done ? { processed, total } : null);
        if (data.done || processed <= offset) break;
        offset = processed;
      }
      setProgress(null);
      data = {
        created,
        updated,
        skipped,
        categories,
        external_images: external,
        problems,
      };
      // Фото с чужих сайтов лучше перенести к нам — подсказываем сразу
      const externalNote = data.external_images
        ? ` Фото с других сайтов: ${data.external_images} — перенесите их к нам в разделе «Сайт».`
        : '';
      toast({
        title: data.skipped ? 'Загружено с замечаниями' : 'Каталог обновлён',
        description:
          (data.skipped
            ? `Добавлено: ${data.created}, обновлено: ${data.updated}. Пропущено строк: ${data.skipped} — проверьте их в файле.`
            : `Добавлено: ${data.created}, обновлено: ${data.updated}${
                data.categories ? `, категорий: ${data.categories}` : ''
              }`) + externalNote,
      });
      onImported();
    } catch {
      toast({ title: 'Ошибка', description: 'Файл не читается' });
    } finally {
      setBusy(false);
      setProgress(null);
      if (xlsRef.current) xlsRef.current.value = '';
    }
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
    download(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      `catalog-${today()}.json`,
    );
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
      <div className="lg:col-span-12">
        <SearchPagesPanel />
      </div>

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
          Скачайте каталог таблицей Excel, поправьте названия, цены, артикулы и
          совместимость прямо в ней — и загрузите обратно. Внутри есть лист с подсказками
          по заполнению.
        </p>

        <div className="mt-8 border-t border-foreground pt-6">
          <div className="flex items-center gap-3">
            <Icon name="Sheet" size={20} className="text-primary" />
            <div className="font-head text-lg font-medium">Таблица Excel</div>
          </div>
          <p className="mt-2 text-[0.9rem] text-muted-foreground">
            Три листа: товары, марки с моделями и подсказки. Столбец «Код» не меняйте — по
            нему товар находится при загрузке.
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

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={exportExcel}
              disabled={busy}
              className="flex items-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
            >
              <Icon name="Download" size={16} />
              Скачать Excel
            </button>
            <label className="flex w-fit cursor-pointer items-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary">
              <Icon name={busy ? 'Loader' : 'Upload'} size={16} />
              {progress
                ? `Загружаем ${progress.processed} из ${progress.total}…`
                : busy
                  ? 'Обрабатываем…'
                  : 'Загрузить Excel'}
              <input
                ref={xlsRef}
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

          {progress && (
            <div className="mt-3">
              <div className="h-1.5 w-full max-w-[24em] bg-border">
                <div
                  className="h-full bg-primary transition-[width] duration-300"
                  style={{
                    width: `${Math.round(
                      (progress.processed / Math.max(1, progress.total)) * 100,
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[0.78rem] text-muted-foreground">
                Большой файл грузится частями — не закрывайте страницу.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <div className="text-[0.9rem] font-medium">Резервная копия</div>
          <p className="mt-2 text-[0.85rem] text-muted-foreground">
            Технический формат — сохраняет всё до последнего символа, включая описания и
            фото. Подходит для переноса каталога целиком.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={exportData}
              disabled={busy}
              className="flex items-center gap-2 border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:border-foreground disabled:opacity-60"
            >
              <Icon name="Download" size={14} />
              Скачать копию
            </button>
            <label className="flex w-fit cursor-pointer items-center gap-2 border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:border-foreground">
              <Icon name="Upload" size={14} />
              Восстановить
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
    </div>
  );
};

export default SettingsPanel;