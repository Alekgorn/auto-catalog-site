import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FailedImage {
  url: string;
  reason: string;
  product: string;
}

/**
 * Перенос фотографий с чужих сайтов к нам.
 *
 * В файле импорта можно указать ссылки на картинки с любого сайта. Держать
 * их такими опасно: удалят файл у себя — у нас появятся пустые карточки.
 * Здесь эти фото скачиваются, сжимаются и складываются в наше хранилище.
 * По одной за вызов — скачивание идёт через интернет и упирается в лимит
 * времени облачной функции.
 */
const ExternalImages = ({ onDone }: { onDone?: () => void }) => {
  const { toast } = useToast();
  const [left, setLeft] = useState<number | null>(null);
  const [failed, setFailed] = useState<FailedImage[]>([]);
  const [total, setTotal] = useState(0);
  const [moved, setMoved] = useState(0);
  const [running, setRunning] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const stop = useRef(false);

  const check = useCallback(async () => {
    const res = await adminFetch('?action=external-images');
    if (!res.ok) return;
    const data = await res.json();
    setLeft(data.left ?? 0);
    setFailed(data.failed ?? []);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const run = async () => {
    stop.current = false;
    setRunning(true);
    setMoved(0);

    const first = await adminFetch('?action=external-images');
    const start = first.ok ? ((await first.json()).left ?? 0) : 0;
    setTotal(start);
    setLeft(start);

    let remaining = start;
    let done = 0;
    let stuck = 0;
    let fails = 0;

    /**
     * Идём, пока есть что переносить. Обрыв одного вызова — не повод
     * останавливать всю работу: фото качаются с чужих сайтов, и часть
     * из них отвечает медленно. Сдаёмся только после пяти подряд.
     */
    while (remaining > 0 && !stop.current && stuck < 3 && fails < 5) {
      let data: { left?: number; saved?: number; handled?: number; problem?: unknown } | null =
        null;

      try {
        const res = await adminFetch('?action=external-images', {
          method: 'POST',
        });
        if (res.ok) data = await res.json();
      } catch {
        /* сеть моргнула — попробуем ещё раз */
      }

      if (!data) {
        fails += 1;
        // Небольшая пауза, чтобы дать медленному сайту прийти в себя
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      fails = 0;
      remaining = data.left ?? 0;
      done += data.saved ?? 0;
      setLeft(remaining);
      setMoved(done);
      // Ни одной картинки не разобрали — значит переносить больше нечего
      stuck = data.handled ? 0 : stuck + 1;
    }

    setRunning(false);
    await check();
    onDone?.();

    if (stop.current) return;

    if (fails >= 5) {
      toast({
        title: 'Перенос остановлен',
        description: `Успели перенести ${done} шт. Нажмите «Перенести фото к нам» ещё раз — продолжим с этого места.`,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: done ? 'Фотографии перенесены' : 'Переносить нечего',
      description: done
        ? `Скачано к нам: ${done} шт.`
        : 'Все фото уже хранятся у нас',
    });
  };

  const retryFailed = async () => {
    await adminFetch('?action=external-images', { method: 'DELETE' });
    await check();
    toast({
      title: 'Список очищен',
      description: 'Эти ссылки попробуем скачать снова при следующем запуске',
    });
  };

  const pending = left ?? 0;
  const progress = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

  return (
    <div className="border border-border p-5">
      <div className="flex items-start gap-3">
        <Icon
          name="FolderInput"
          size={20}
          className="mt-0.5 flex-none text-primary"
        />
        <div className="min-w-0 flex-1">
          <div className="font-head text-[1.05rem] font-bold uppercase tracking-tight">
            Перенести фото к нам
          </div>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted-foreground">
            Если в файле импорта указаны ссылки на картинки с других сайтов,
            здесь они скачиваются в наше хранилище и сжимаются. Так фото не
            пропадут, если их удалят у первоисточника, и будут грузиться быстрее.
          </p>

          {left !== null && (
            <div className="mt-3 text-[0.88rem]">
              {pending > 0 ? (
                <span>
                  Хранятся на чужих сайтах: <b>{pending}</b> фото
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <Icon name="Check" size={15} strokeWidth={3} />
                  Все фотографии хранятся у нас
                </span>
              )}
            </div>
          )}

          {running && (
            <div className="mt-3">
              <div className="h-1.5 w-full bg-surface-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-[0.82rem] text-muted-foreground">
                Перенесено: {moved} из {total}. Осталось: {pending}. Не
                закрывайте страницу — фото скачиваются с чужих сайтов, это
                небыстро. Работу можно прервать и продолжить позже с того же
                места.
              </div>
            </div>
          )}

          {failed.length > 0 && (
            <div className="mt-4 border border-border bg-surface-muted p-3.5">
              <button
                onClick={() => setShowFailed((v) => !v)}
                className="flex w-full items-center gap-2 text-left text-[0.85rem] font-medium"
              >
                <Icon
                  name="TriangleAlert"
                  size={15}
                  className="flex-none text-primary"
                />
                Не удалось скачать: {failed.length}
                <Icon
                  name={showFailed ? 'ChevronUp' : 'ChevronDown'}
                  size={15}
                  className="ml-auto flex-none"
                />
              </button>

              {showFailed && (
                <>
                  <div className="mt-3 max-h-64 overflow-y-auto">
                    {failed.map((f) => (
                      <div
                        key={f.url}
                        className="border-t border-border py-2 text-[0.8rem] first:border-t-0"
                      >
                        <div className="text-muted-foreground">
                          {f.product && (
                            <span className="text-foreground">{f.product}</span>
                          )}
                          {f.product && ' — '}
                          {f.reason}
                        </div>
                        <div className="mt-0.5 break-all text-[0.75rem] text-muted-foreground">
                          {f.url}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[0.78rem] leading-relaxed text-muted-foreground">
                    Эти фото остались ссылками на чужие сайты и продолжают
                    показываться. Обычно причина в том, что сайт не отдаёт файлы
                    посторонним — тогда проще загрузить снимок вручную в карточке
                    товара.
                  </p>
                  <button
                    onClick={retryFailed}
                    className="mt-3 inline-flex items-center gap-2 border border-foreground px-4 py-2 text-[0.78rem] uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name="RefreshCw" size={14} />
                    Попробовать снова
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={run}
              disabled={running || pending === 0}
              className="inline-flex items-center gap-2 bg-foreground px-5 py-2.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.02em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? 'Переношу…' : 'Перенести фото к нам'}
              <Icon
                name={running ? 'Loader' : 'Download'}
                size={16}
                className={running ? 'animate-spin' : ''}
              />
            </button>

            {running && (
              <button
                onClick={() => {
                  stop.current = true;
                }}
                className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 font-head text-[0.8rem] font-medium uppercase tracking-[0.02em] transition-colors hover:border-primary hover:text-primary"
              >
                Остановить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalImages;