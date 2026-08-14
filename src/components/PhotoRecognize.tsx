import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Vehicle, YEARS } from '@/data/catalog';
import { recognizeVehicle, RecognizeResult } from '@/lib/recognize';

interface Props {
  /** Применить распознанную машину к подбору */
  onApply: (v: Vehicle) => void;
  /** Открыть ручной выбор марки и модели */
  onManual?: () => void;
  /** Компактная кнопка для панели фильтра */
  compact?: boolean;
  /** Акцентная кнопка — для строки поиска на главной */
  accent?: boolean;
}

const CONF_TEXT: Record<string, string> = {
  high: 'Похоже, это',
  medium: 'Скорее всего, это',
  low: 'Не уверен, но похоже на',
};

/**
 * Подбор по фото торпедо или штатной магнитолы.
 * ИИ определяет марку и модель — результат всегда предлагается подтвердить.
 */
const PhotoRecognize = ({ onApply, onManual, compact, accent }: Props) => {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [preview, setPreview] = useState('');
  const [year, setYear] = useState('2021');

  const handle = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setError('');
    setResult(null);
    setBusy(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
      });
      setPreview(dataUrl);

      const data = await recognizeVehicle(dataUrl);
      if (!data.brand) {
        setError(data.note || 'Не удалось узнать машину на фото. Выберите марку вручную.');
      } else {
        setResult(data);
        if (data.year) setYear(String(data.year));
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'Не получилось разобрать фото. Попробуйте другой снимок.',
      );
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const confirm = () => {
    if (!result?.brand || !result.model) return;
    onApply({ brand: result.brand, model: result.model, year: Number(year) });
    setResult(null);
    setPreview('');
  };

  const reset = () => {
    setResult(null);
    setError('');
    setPreview('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        title="Подобрать по фото торпедо или магнитолы"
        className={
          accent
            ? 'flex flex-none items-center gap-2 bg-primary px-3 py-3 font-head text-[0.75rem] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-60 md:px-4'
            : compact
              ? `flex items-center gap-2 border px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors disabled:opacity-60 ${
                  result ? 'border-primary text-primary' : 'border-foreground hover:border-primary hover:text-primary'
                }`
              : 'flex w-full items-center justify-center gap-2 border border-foreground px-5 py-4 font-head text-[0.85rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary disabled:opacity-60'
        }
      >
        <Icon name={busy ? 'Loader' : 'Camera'} size={19} className={busy ? 'animate-spin' : ''} />
        <span className={compact || accent ? 'hidden sm:inline' : ''}>
          {busy ? 'Смотрю фото…' : 'Определить авто по фото'}
        </span>
      </button>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        onChange={(e) => handle(e.target.files)}
        className="hidden"
      />

      {(result || error) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 p-4 sm:items-center"
          onClick={reset}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto border-2 border-foreground bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {preview && (
              <img
                src={preview}
                alt="Ваше фото"
                className="mb-5 h-40 w-full border border-border object-cover"
              />
            )}

            {result ? (
              <>
                <div className="text-[0.8rem] uppercase tracking-[0.12em] text-muted-foreground">
                  {CONF_TEXT[result.confidence] ?? CONF_TEXT.low}
                </div>
                <div className="mt-1 font-head text-2xl font-bold uppercase tracking-tight">
                  {result.brand} {result.model}
                </div>
                {result.note && (
                  <p className="mt-2 text-[0.88rem] text-muted-foreground">{result.note}</p>
                )}

                <div className="mt-4 flex items-start gap-2 border border-border bg-surface-muted p-3 text-[0.82rem] leading-snug text-muted-foreground">
                  <Icon name="TriangleAlert" size={16} className="mt-0.5 flex-none" />
                  <span>
                    Определяет искусственный интеллект — он может ошибиться. Проверьте марку и
                    модель перед заказом, а год выпуска укажите сами.
                  </span>
                </div>

                {result.model ? (
                  <>
                    <label className="mt-5 block">
                      <span className="mb-1 block text-[0.78rem] uppercase tracking-[0.12em] text-muted-foreground">
                        Год выпуска
                      </span>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full border border-foreground bg-background px-4 py-3"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      onClick={confirm}
                      className="mt-4 w-full bg-foreground px-5 py-4 font-head text-[0.85rem] uppercase tracking-[0.08em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      Да, это моя машина
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-[0.88rem]">
                    Марку узнал, а модель по фото не разобрать. Выберите её вручную.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="font-head text-xl font-bold uppercase tracking-tight">
                  Не узнал машину
                </div>
                <p className="mt-2 text-[0.9rem] text-muted-foreground">{error}</p>
                <p className="mt-3 text-[0.85rem] text-muted-foreground">
                  Снимите торпедо целиком при дневном свете — так, чтобы попали магнитола и
                  дефлекторы.
                </p>
              </>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  reset();
                  ref.current?.click();
                }}
                className="flex-1 border border-foreground px-4 py-3 text-[0.8rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
              >
                Другое фото
              </button>
              <button
                onClick={() => {
                  reset();
                  onManual?.();
                }}
                className="flex-1 border border-border px-4 py-3 text-[0.8rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Выбрать вручную
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoRecognize;