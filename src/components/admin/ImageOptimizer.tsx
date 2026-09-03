import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onDone?: () => void;
}

/** Перевод уже загруженных фото товаров в лёгкий формат WebP. */
const ImageOptimizer = ({ onDone }: Props) => {
  const { toast } = useToast();
  const [left, setLeft] = useState<number | null>(null);
  /** Фото на чужих сайтах — их сначала переносят, сжать их нельзя */
  const [external, setExternal] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(0);
  const stop = useRef(false);

  const check = useCallback(async () => {
    const res = await adminFetch('?action=optimize-images');
    if (!res.ok) return;
    const data = await res.json();
    setLeft(data.left ?? 0);
    setExternal(data.external ?? 0);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const run = async () => {
    stop.current = false;
    setRunning(true);
    setSaved(0);

    const first = await adminFetch('?action=optimize-images');
    const start = first.ok ? ((await first.json()).left ?? 0) : 0;
    setTotal(start);
    setLeft(start);

    let remaining = start;
    let converted = 0;
    let stuck = 0;

    while (remaining > 0 && !stop.current && stuck < 3) {
      const res = await adminFetch('?action=optimize-images', { method: 'POST' });
      if (!res.ok) {
        toast({
          title: 'Не получилось обработать фото',
          description: 'Попробуйте запустить ещё раз',
          variant: 'destructive',
        });
        break;
      }
      const data = await res.json();
      remaining = data.left ?? 0;
      converted += data.saved ?? 0;
      setExternal(data.external ?? 0);
      setLeft(remaining);
      setSaved(converted);
      stuck = data.saved ? 0 : stuck + 1;
    }

    setRunning(false);
    onDone?.();
    if (!stop.current) {
      toast({
        title: 'Фотографии оптимизированы',
        description: `Переведено в лёгкий формат: ${converted} шт.`,
      });
    }
  };

  const pending = left ?? 0;
  const progress = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

  return (
    <div className="border border-border p-5">
      <div className="flex items-start gap-3">
        <Icon name="ImageDown" size={20} className="mt-0.5 flex-none text-primary" />
        <div className="min-w-0 flex-1">
          <div className="font-head text-[1.05rem] font-bold uppercase tracking-tight">
            Оптимизация фотографий
          </div>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted-foreground">
            Переводит фото товаров в современный формат WebP. Снимки становятся
            легче примерно в 5–8 раз, сайт открывается заметно быстрее, качество
            на глаз не меняется. Новые фото обрабатываются автоматически при
            загрузке.
          </p>

          {left !== null && (
            <div className="mt-3 text-[0.88rem]">
              {pending > 0 ? (
                <span>
                  Ждут обработки: <b>{pending}</b> фото
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <Icon name="Check" size={15} strokeWidth={3} />
                  Все наши фотографии уже оптимизированы
                </span>
              )}
              {external > 0 && (
                // Сжимать чужие снимки мы не можем — сначала перенос.
                // Без этой строки счётчик выглядел бы сломанным
                <div className="mt-1 text-[0.82rem] text-muted-foreground">
                  Ещё <b>{external}</b> фото хранятся на сайте поставщика — их
                  сначала нужно перенести к нам, кнопка ниже. После переноса
                  они сжимаются сразу.
                </div>
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
                Обработано фото: {saved}. Не закрывайте страницу.
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={run}
              disabled={running || pending === 0}
              className="inline-flex items-center gap-2 bg-foreground px-5 py-2.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.02em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? 'Обрабатываю…' : 'Оптимизировать фото'}
              <Icon name={running ? 'Loader' : 'Zap'} size={16} />
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

export default ImageOptimizer;