import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Item {
  sku: string;
  name: string;
  price: number;
  url: string;
  slug: string;
  exists: boolean;
}

interface Row extends Item {
  images: string[];
  description: string;
  specs: string;
  fits: string;
  fitsSrc: string;
  yearFrom: number | '';
  yearTo: number | '';
  ok: boolean;
}

interface Scan {
  total: number;
  new: number;
  exists: number;
  noUrl: number;
  items: Item[];
}

interface Props {
  /** Разделы каталога — в какой класть товары по умолчанию */
  categories: string[];
}

/**
 * Сколько карточек берём за один заход к серверу.
 * Функции отведено около двух секунд — больше восьми она не успевает.
 */
const STEP = 8;

const word = (n: number, one: string, few: string, many: string) => {
  const t = n % 100;
  if (t > 10 && t < 20) return many;
  const d = n % 10;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
};

/**
 * Прайс поставщика.
 *
 * Поставщик присылает Excel с артикулами и ссылками. Сравниваем его с
 * каталогом, обходим карточки, забираем фото, описание и совместимость —
 * и отдаём таблицу в формате нашей выгрузки. Что из неё брать, решает
 * человек: файл открывается в Excel и грузится обычным импортом.
 */
const SupplierPanel = ({ categories }: Props) => {
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [scan, setScan] = useState<Scan | null>(null);
  const [onlyNew, setOnlyNew] = useState(true);
  const [category, setCategory] = useState(categories[0] ?? '');
  const [progress, setProgress] = useState<{ done: number; all: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const readFile = (file: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.readAsDataURL(file);
    });

  const upload = async (file: File) => {
    setBusy(true);
    setScan(null);
    setStage('Читаем прайс…');
    try {
      const base64 = await readFile(file);
      const res = await adminFetch('?action=supplier-scan', {
        method: 'POST',
        body: JSON.stringify({ file: base64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Не получилось', description: data.error ?? 'Файл не подошёл' });
        return;
      }
      setScan(data as Scan);
      toast({
        title: 'Прайс прочитан',
        description: `Всего ${data.total}, из них новых ${data.new}`,
      });
    } catch {
      toast({ title: 'Ошибка', description: 'Файл не читается' });
    } finally {
      setBusy(false);
      setStage('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const collect = async () => {
    if (!scan) return;
    const list = onlyNew ? scan.items.filter((i) => !i.exists) : scan.items;
    const target = list.filter((i) => i.url);
    if (!target.length) {
      toast({
        title: 'Нечего собирать',
        description: 'У выбранных товаров нет ссылок на карточки',
      });
      return;
    }

    setBusy(true);
    const rows: Row[] = [];
    let failed = 0;
    try {
      /**
       * Порцию, которая не прошла, пробуем ещё раз: сайт поставщика
       * иногда отвечает не сразу. Если и повтор не помог — пропускаем её
       * и идём дальше, чтобы из-за десятка карточек не потерять весь сбор.
       */
      for (let i = 0; i < target.length; i += STEP) {
        setProgress({ done: i, all: target.length });
        setStage('Открываем карточки товаров…');
        const chunk = target.slice(i, i + STEP);

        let got: Row[] | null = null;
        for (let attempt = 0; attempt < 3 && !got; attempt += 1) {
          if (attempt > 0) {
            setStage('Поставщик задумался, пробуем ещё раз…');
            await new Promise((r) => setTimeout(r, 1200 * attempt));
          }
          try {
            const res = await adminFetch('?action=supplier-collect', {
              method: 'POST',
              body: JSON.stringify({ items: chunk }),
            });
            if (!res.ok) continue;
            const data = await res.json();
            got = (data.rows ?? []) as Row[];
            failed += Number(data.failed ?? 0);
          } catch {
            /* сеть моргнула — попробуем снова */
          }
        }

        if (got) {
          rows.push(...got);
        } else {
          // Строки всё равно нужны: цена и артикул есть, остальное допишут руками
          rows.push(
            ...chunk.map((it) => ({
              ...it,
              images: [],
              description: '',
              specs: '',
              fits: '',
              fitsSrc: '',
              yearFrom: '' as const,
              yearTo: '' as const,
              ok: false,
            })),
          );
        }
      }

      if (!rows.length) {
        toast({
          title: 'Не получилось',
          description: 'Сайт поставщика не отвечает. Попробуйте позже',
        });
        return;
      }

      /**
       * Второй заход по карточкам, которые не открылись с первого раза:
       * первые запросы уходят, пока сервер ещё просыпается, и часть из них
       * не успевает. На повторе они обычно отвечают нормально.
       */
      const retry = rows.filter((r) => !r.ok);
      if (retry.length) {
        setProgress(null);
        setStage('Возвращаемся к тем, что не открылись…');
        for (let i = 0; i < retry.length; i += STEP) {
          const chunk = retry.slice(i, i + STEP);
          try {
            const res = await adminFetch('?action=supplier-collect', {
              method: 'POST',
              body: JSON.stringify({ items: chunk }),
            });
            if (!res.ok) continue;
            const data = await res.json();
            ((data.rows ?? []) as Row[]).forEach((fresh) => {
              if (!fresh.ok) return;
              const at = rows.findIndex((r) => r.sku === fresh.sku && !r.ok);
              if (at >= 0) rows[at] = fresh;
            });
          } catch {
            /* не вышло и на второй раз — строка останется без фото */
          }
        }
      }

      failed = rows.filter((r) => !r.ok).length;

      setProgress(null);
      setStage('Собираем таблицу…');
      const res = await adminFetch('?action=supplier-xlsx', {
        method: 'POST',
        body: JSON.stringify({ rows, category }),
      });
      const data = await res.json();
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
      a.download = `postavshchik-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      const photos = rows.reduce((n, r) => n + (r.images?.length ?? 0), 0);
      toast({
        title: 'Файл готов',
        description:
          `${rows.length} ${word(rows.length, 'товар', 'товара', 'товаров')}, ` +
          `${photos} фото` +
          (failed
            ? `. Не открылось карточек: ${failed} — они в файле без фото`
            : ''),
      });
    } catch {
      toast({ title: 'Ошибка', description: 'Что-то пошло не так' });
    } finally {
      setBusy(false);
      setStage('');
      setProgress(null);
    }
  };

  const willTake = scan
    ? (onlyNew ? scan.items.filter((i) => !i.exists) : scan.items).filter((i) => i.url)
        .length
    : 0;
  // Порция уходит и возвращается примерно за полторы секунды
  const minutes = ((willTake / STEP) * 1.5) / 60;

  return (
    <div className="py-8">
      <div className="eyebrow">Прайс поставщика</div>
      <h2 className="mt-3 font-head text-2xl font-bold uppercase tracking-[-0.02em]">
        Что нового у поставщика
      </h2>
      <p className="mt-4 max-w-[42em] text-muted-foreground">
        Загрузите прайс в Excel — сверим его с каталогом по артикулу, откроем
        карточки товаров и соберём таблицу с фото, описанием и совместимостью.
        Её останется проверить и загрузить через импорт каталога.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="mt-6 flex items-center gap-3 border border-foreground px-6 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-60"
      >
        <Icon name="Upload" size={17} />
        Загрузить прайс
      </button>

      <p className="mt-3 max-w-[42em] text-[0.8rem] text-muted-foreground">
        Нужны колонки: артикул, название, цена и ссылка на товар. Названия
        колонок распознаём сами, порядок не важен.
      </p>

      {busy && stage && (
        <div className="mt-6 flex items-center gap-3 border border-border bg-card px-5 py-4 text-[0.88rem]">
          <Icon name="LoaderCircle" size={17} className="animate-spin text-primary" />
          <span>{stage}</span>
          {progress && (
            <span className="text-muted-foreground">
              {progress.done} из {progress.all}
            </span>
          )}
        </div>
      )}

      {scan && (
        <div className="mt-8 border-t border-foreground pt-6">
          <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
            {[
              { label: 'Всего в прайсе', value: scan.total, accent: false },
              { label: 'Новинок', value: scan.new, accent: true },
              { label: 'Уже есть у нас', value: scan.exists, accent: false },
              { label: 'Без ссылки', value: scan.noUrl, accent: false },
            ].map((s) => (
              <div key={s.label} className="bg-surface px-5 py-4">
                <div
                  className={`font-head text-2xl font-bold ${s.accent ? 'text-primary' : ''}`}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => setOnlyNew(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="text-[0.88rem]">
                Только новинки
                <span className="block text-[0.8rem] text-muted-foreground">
                  Товары, которых нет в каталоге. Снимите галочку, чтобы заодно
                  обновить цены на то, что уже продаём.
                </span>
              </span>
            </label>

            <div>
              <div className="text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground">
                Категория для новых товаров
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full max-w-[32em] border border-border bg-background px-4 py-3 text-[0.88rem]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="mt-2 max-w-[42em] text-[0.8rem] text-muted-foreground">
                Проставится всем строкам — в файле поправите там, где нужно.
              </p>
            </div>
          </div>

          <button
            onClick={collect}
            disabled={busy || willTake === 0}
            className="mt-6 flex items-center gap-3 bg-primary px-8 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground disabled:opacity-60"
          >
            <Icon name="Download" size={17} />
            {busy ? 'Собираем…' : `Собрать таблицу: ${willTake}`}
          </button>

          {willTake > 0 && !busy && (
            <p className="mt-3 text-[0.8rem] text-muted-foreground">
              Займёт примерно {minutes < 1 ? 'меньше минуты' : `${Math.ceil(minutes)} мин`}.
              Не закрывайте страницу — файл скачается сам.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierPanel;