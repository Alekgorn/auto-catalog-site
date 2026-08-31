import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FolderRow {
  folder: string;
  files: number;
  bytes: number;
  usedFiles: number;
  freeFiles: number;
  freeBytes: number;
  oldest: string | null;
  newest: string | null;
}

interface Report {
  /** Картина по каталогу — доступна всегда, считается по базе */
  catalog?: {
    refs: number;
    files: number;
    own: number;
    external: number;
    videos: number;
  };
  scan: { done: boolean; startedAt: string | null; finishedAt: string | null } | null;
  totals: {
    files: number;
    bytes: number;
    usedFiles: number;
    usedBytes: number;
    freeFiles: number;
    freeBytes: number;
  };
  folders: FolderRow[];
}

/** Размер человеческим языком: 1,4 ГБ понятнее, чем 1503238553 байт */
const fmtSize = (bytes: number): string => {
  if (!bytes) return '0 МБ';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(Math.round(bytes / 1024), 1)} КБ`;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} МБ`;
  return `${(mb / 1024).toFixed(2)} ГБ`;
};

const fmtNum = (n: number): string => n.toLocaleString('ru-RU');

const fmtDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

/** Понятное имя папки: технический путь мало что говорит */
const FOLDER_HINT: Record<string, string> = {
  catalog: 'Фотографии товаров и категорий',
  'catalog/video': 'Видео товаров и инструкций',
  'catalog/video-tmp': 'Обрывки прерванных загрузок видео',
  chat_attachments: 'Файлы из переписки — сайт их не использует',
  backup: 'Резервные копии',
  '(корень)': 'Файлы вне папок',
};

const hintOf = (folder: string): string => {
  if (FOLDER_HINT[folder]) return FOLDER_HINT[folder];
  const top = folder.split('/')[0];
  return FOLDER_HINT[top] ?? '';
};

/**
 * Ревизия файлового хранилища.
 *
 * Показывает, что занимает место и на что сайт больше не ссылается.
 * Раздел только смотрит и считает — ничего не удаляет: решение о том,
 * что убирать, остаётся за человеком.
 */
const StoragePanel = () => {
  const { toast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(0);
  /** Хранилище не отдаёт список файлов — обзор для наших ключей закрыт */
  const [unsupported, setUnsupported] = useState(false);
  /** Прерывает обход, если человек ушёл со страницы посреди сканирования */
  const stop = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch('?action=storage')
      .then((r) => r.json())
      .then((d: Report) => setReport(d))
      .catch(() => toast({ title: 'Не удалось загрузить отчёт' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
    return () => {
      stop.current = true;
    };
  }, [load]);

  /*
   * Хранилище отдаёт список файлов страницами, а функция живёт секунды,
   * поэтому обход идёт короткими шагами: вызываем, пока не придёт done.
   */
  const scan = async () => {
    setScanning(true);
    setScanned(0);
    setUnsupported(false);
    stop.current = false;
    try {
      let restart = true;
      for (;;) {
        if (stop.current) return;
        const res = await adminFetch('?action=storage', {
          method: 'POST',
          body: JSON.stringify({ mode: 'scan', restart }),
        });
        if (!res.ok) throw new Error('scan failed');
        const step = await res.json();
        setScanned(step.scanned ?? 0);
        restart = false;
        if (step.unsupported) {
          setUnsupported(true);
          break;
        }
        if (step.done) break;
      }
      load();
      if (!unsupported) toast({ title: 'Проверка хранилища завершена' });
    } catch {
      toast({ title: 'Не удалось проверить хранилище' });
    } finally {
      setScanning(false);
    }
  };

  const t = report?.totals;
  const c = report?.catalog;
  /* Обход дал ноль файлов, хотя они точно есть — значит обзор закрыт */
  const blind = unsupported || (report?.scan?.done === true && t?.files === 0);
  const neverScanned = !report?.scan;

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-head text-2xl font-bold uppercase tracking-tight">
            Хранилище
          </h2>
          <p className="mt-1 max-w-[46em] text-[0.85rem] text-muted-foreground">
            Что лежит в файловом хранилище и сколько занимает. «Не нужны
            сайту» — это файлы, на которые не ссылается ни один товар,
            инструкция или категория. Раздел только считает и ничего не
            удаляет.
          </p>
        </div>
        <button
          onClick={scan}
          disabled={scanning}
          className="flex flex-none items-center gap-2 border border-foreground px-5 py-2.5 text-[0.75rem] font-bold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          <Icon
            name={scanning ? 'Loader' : 'RefreshCw'}
            size={14}
            className={scanning ? 'animate-spin' : ''}
          />
          {scanning ? 'Проверяем…' : 'Проверить хранилище'}
        </button>
      </div>

      {scanning && (
        <div className="mt-5 border border-border bg-card px-5 py-4 text-[0.85rem] text-muted-foreground">
          Просмотрено файлов: {fmtNum(scanned)}. Это занимает
          несколько минут — не закрывайте страницу.
        </div>
      )}

      {loading && !report && (
        <div className="mt-6 text-[0.85rem] text-muted-foreground">Загружаем…</div>
      )}

      {!loading && neverScanned && !scanning && (
        <div className="mt-6 border border-dashed border-border px-6 py-10 text-center">
          <p className="text-[0.9rem] text-muted-foreground">
            Хранилище ещё не проверяли. Нажмите «Проверить хранилище» —
            посмотрим, что там лежит.
          </p>
        </div>
      )}

      {blind && !scanning && (
        <div className="mt-6 border border-primary bg-card px-5 py-4">
          <div className="flex items-start gap-3">
            <Icon name="TriangleAlert" size={17} className="mt-0.5 flex-none text-primary" />
            <div className="text-[0.88rem] leading-relaxed">
              <div className="font-bold">Хранилище не даёт себя пересчитать</div>
              <p className="mt-1 text-muted-foreground">
                Файлы на месте и открываются по прямой ссылке, но список всего
                содержимого хранилище нам не выдаёт — такой доступ для проекта
                закрыт. Поэтому посчитать вес папок и найти ненужные файлы
                отсюда нельзя.
              </p>
              <p className="mt-2 text-muted-foreground">
                Убрать лишнее можно через поддержку платформы:{' '}
                <a
                  href="https://poehali.dev/help"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  poehali.dev/help
                </a>
                . Ниже — что о файлах знает сам каталог.
              </p>
            </div>
          </div>
        </div>
      )}

      {blind && c && (
        <div className="mt-6 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-surface p-5">
            <div className="eyebrow">Файлов в каталоге</div>
            <div className="mt-1 font-head text-2xl font-bold">
              {fmtNum(c.files)}
            </div>
            <div className="mt-1 text-[0.8rem] text-muted-foreground">
              используются сайтом
            </div>
          </div>
          <div className="bg-surface p-5">
            <div className="eyebrow">Наши файлы</div>
            <div className="mt-1 font-head text-2xl font-bold text-success">
              {fmtNum(c.own)}
            </div>
            <div className="mt-1 text-[0.8rem] text-muted-foreground">
              лежат в вашем хранилище
            </div>
          </div>
          <div className="bg-surface p-5">
            <div className="eyebrow">Чужие ссылки</div>
            <div className="mt-1 font-head text-2xl font-bold">
              {fmtNum(c.external)}
            </div>
            <div className="mt-1 text-[0.8rem] text-muted-foreground">
              грузятся с других сайтов
            </div>
          </div>
          <div className="bg-surface p-5">
            <div className="eyebrow">Видео</div>
            <div className="mt-1 font-head text-2xl font-bold">
              {fmtNum(c.videos)}
            </div>
            <div className="mt-1 text-[0.8rem] text-muted-foreground">
              загружено к товарам
            </div>
          </div>
        </div>
      )}

      {t && report?.scan && !blind && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
            <div className="bg-surface p-5">
              <div className="eyebrow">Всего файлов</div>
              <div className="mt-1 font-head text-2xl font-bold">
                {fmtNum(t.files)}
              </div>
              <div className="mt-1 text-[0.8rem] text-muted-foreground">
                {fmtSize(t.bytes)}
              </div>
            </div>
            <div className="bg-surface p-5">
              <div className="eyebrow">Нужны сайту</div>
              <div className="mt-1 font-head text-2xl font-bold text-success">
                {fmtNum(t.usedFiles)}
              </div>
              <div className="mt-1 text-[0.8rem] text-muted-foreground">
                {fmtSize(t.usedBytes)}
              </div>
            </div>
            <div className="bg-surface p-5">
              <div className="eyebrow">Не нужны сайту</div>
              <div className="mt-1 font-head text-2xl font-bold text-primary">
                {fmtNum(t.freeFiles)}
              </div>
              <div className="mt-1 text-[0.8rem] text-muted-foreground">
                {fmtSize(t.freeBytes)}
              </div>
            </div>
          </div>

          {!report.scan.done && (
            <div className="mt-3 flex items-start gap-2 border border-border bg-card px-4 py-3 text-[0.8rem] text-muted-foreground">
              <Icon name="Info" size={14} className="mt-0.5 flex-none text-primary" />
              Проверка не была доведена до конца — цифры неполные. Запустите
              её заново.
            </div>
          )}

          {report.scan.finishedAt && (
            <div className="mt-3 text-[0.78rem] text-muted-foreground">
              Последняя проверка: {fmtDate(report.scan.finishedAt)}
            </div>
          )}

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[54rem] border-collapse text-[0.85rem]">
              <thead>
                <tr className="border-b border-foreground text-left">
                  <th className="py-2 pr-4 font-head text-[0.72rem] uppercase tracking-[0.1em]">
                    Папка
                  </th>
                  <th className="py-2 pr-4 text-right font-head text-[0.72rem] uppercase tracking-[0.1em]">
                    Файлов
                  </th>
                  <th className="py-2 pr-4 text-right font-head text-[0.72rem] uppercase tracking-[0.1em]">
                    Вес
                  </th>
                  <th className="py-2 pr-4 text-right font-head text-[0.72rem] uppercase tracking-[0.1em]">
                    Нужны
                  </th>
                  <th className="py-2 pr-4 text-right font-head text-[0.72rem] uppercase tracking-[0.1em]">
                    Не нужны
                  </th>
                  <th className="py-2 pr-4 text-right font-head text-[0.72rem] uppercase tracking-[0.1em]">
                    Можно освободить
                  </th>
                  <th className="py-2 text-right font-head text-[0.72rem] uppercase tracking-[0.1em]">
                    Файлы от — до
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.folders.map((f) => (
                  <tr key={f.folder} className="border-b border-border align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{f.folder}</div>
                      {hintOf(f.folder) && (
                        <div className="mt-0.5 text-[0.75rem] text-muted-foreground">
                          {hintOf(f.folder)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">{fmtNum(f.files)}</td>
                    <td className="py-3 pr-4 text-right">{fmtSize(f.bytes)}</td>
                    <td className="py-3 pr-4 text-right text-success">
                      {fmtNum(f.usedFiles)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {f.freeFiles > 0 ? (
                        <span className="text-primary">{fmtNum(f.freeFiles)}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      {f.freeBytes > 0 ? (
                        <span className="font-medium text-primary">
                          {fmtSize(f.freeBytes)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-[0.78rem] text-muted-foreground">
                      {fmtDate(f.oldest)} — {fmtDate(f.newest)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 max-w-[46em] text-[0.8rem] leading-relaxed text-muted-foreground">
            Важно: «не нужны сайту» считается только по каталогу, инструкциям
            и категориям. Резервные копии базы и файлы из переписки сайт не
            использует по своей природе — они всегда будут в этой графе, но
            это не значит, что их можно удалять не глядя.
          </p>
        </>
      )}
    </div>
  );
};

export default StoragePanel;