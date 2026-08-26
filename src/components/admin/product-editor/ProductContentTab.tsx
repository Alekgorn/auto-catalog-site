import { useState } from 'react';
import Icon from '@/components/ui/icon';
import ImageZoom from '@/components/admin/ImageZoom';
import { AdminProduct, SetField, label, field } from './product-types';

interface Props {
  form: AdminProduct;
  set: SetField;
  uploading: boolean;
  upload: (files: FileList | null) => void;
  missingFields: string[];
  /** Перенести уже загруженное фото в блочный раздел товара */
  moveToBlocks: (src: string, to: 'notes' | 'extra') => void;
}

/** Вкладка «Описание и фото»: снимки, абзацы, характеристики, комплектация. */
const ProductContentTab = ({
  form,
  set,
  uploading,
  upload,
  missingFields,
  moveToBlocks,
}: Props) => {
  /** Снимок, открытый на весь экран */
  const [zoom, setZoom] = useState<string | null>(null);
  /** У какого снимка раскрыт выбор раздела для переноса */
  const [moving, setMoving] = useState<string | null>(null);
  /**
   * Меняет характеристики местами. Порядок здесь — порядок строк на
   * странице товара, а первые три видны прямо в плитке каталога.
   */
  const moveSpec = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= form.specs.length) return;
    const next = [...form.specs];
    [next[i], next[j]] = [next[j], next[i]];
    set('specs', next);
  };

  return (
  <div className="space-y-7">
    <div>
      <span className={label}>Фотографии</span>
      {form.images.length > 0 && (
        <p className="mt-1 text-[0.78rem] text-muted-foreground">
          Клик по снимку открывает его на весь экран. Стрелка переносит фото в
          «Особенности» или «Свой раздел» — заново загружать не нужно.
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-3">
        {form.images.map((src, i) => (
          <div key={src + i} className="group relative">
            {/* Миниатюра кликабельна: по 96 пикселям не понять, что на
                снимке — схема, фото в салоне или дубль соседнего кадра */}
            <button
              onClick={() => setZoom(src)}
              title="Открыть на весь экран"
              aria-label="Открыть фото на весь экран"
              className="block cursor-zoom-in border border-transparent transition-colors hover:border-primary"
            >
              <img
                src={src}
                alt=""
                className="h-24 w-24 bg-card object-contain p-1"
              />
            </button>
            <button
              onClick={() => setMoving(moving === src ? null : src)}
              title="Перенести в другой раздел"
              aria-label="Перенести в другой раздел"
              className={`absolute -left-2 -top-2 border border-foreground p-1 transition-colors ${
                moving === src
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:bg-foreground hover:text-background'
              }`}
            >
              <Icon name="ArrowRightLeft" size={12} />
            </button>
            <button
              onClick={() =>
                set(
                  'images',
                  form.images.filter((_, idx) => idx !== i),
                )
              }
              aria-label="Удалить фото"
              className="absolute -right-2 -top-2 bg-primary p-1 text-primary-foreground"
            >
              <Icon name="X" size={12} />
            </button>

            {/* Разделов два, поэтому спрашиваем куда: молча ронять фото
                в «Особенности» было бы угадыванием за магазин */}
            {moving === src && (
              <>
                {/* Клик мимо закрывает выбор — иначе меню висит,
                    пока не ткнёшь в ту же стрелку */}
                <button
                  aria-label="Закрыть выбор раздела"
                  onClick={() => setMoving(null)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute left-0 top-full z-20 mt-1 w-40 border border-foreground bg-background shadow-lg">
                  <button
                    onClick={() => {
                      moveToBlocks(src, 'notes');
                      setMoving(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.78rem] transition-colors hover:bg-foreground hover:text-background"
                  >
                    <Icon name="Wrench" size={13} className="flex-none" />
                    В «Особенности»
                  </button>
                  <button
                    onClick={() => {
                      moveToBlocks(src, 'extra');
                      setMoving(null);
                    }}
                    className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-[0.78rem] transition-colors hover:bg-foreground hover:text-background"
                  >
                    <Icon name="LayoutGrid" size={13} className="flex-none" />
                    В «Свой раздел»
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Icon name={uploading ? 'Loader' : 'Plus'} size={18} />
          {uploading ? 'Грузим' : 'Добавить'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </div>
    </div>

    <div>
      <span className={label}>Описание (абзацы)</span>
      {form.description.map((d, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <textarea
            value={d}
            rows={3}
            onChange={(e) =>
              set(
                'description',
                form.description.map((x, idx) => (idx === i ? e.target.value : x)),
              )
            }
            className="w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary"
          />
          <button
            onClick={() =>
              set(
                'description',
                form.description.filter((_, idx) => idx !== i),
              )
            }
            aria-label="Удалить абзац"
            className="h-fit text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => set('description', [...form.description, ''])}
        className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon name="Plus" size={14} />
        Абзац
      </button>
    </div>

    <div>
      <span className={label}>Характеристики</span>

      {missingFields.length > 0 && (
        <div className="mb-4 border border-border bg-surface-muted p-3">
          <div className="text-[0.78rem] text-muted-foreground">
            Для категории «{form.category}» не заполнены:
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingFields.map((f) => (
              <button
                key={f}
                onClick={() => set('specs', [...form.specs, [f, '']])}
                className="flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 text-[0.78rem] transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name="Plus" size={13} />
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.specs.length > 1 && (
        <p className="mb-2 text-[0.78rem] text-muted-foreground">
          Стрелками меняйте порядок.{' '}
          <span className="font-medium text-primary">Первые три</span> строки
          покупатель видит прямо в каталоге — ставьте наверх главное.
        </p>
      )}

      {form.specs.map(([k, v], i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          {/* Номер: по нему видно, какие строки попадут в плитку каталога */}
          <span
            className={`w-5 flex-none text-center font-head text-[0.72rem] ${
              i < 3 ? 'text-primary' : 'text-muted-foreground'
            }`}
            title={i < 3 ? 'Видно в каталоге' : 'Только на странице товара'}
          >
            {i + 1}
          </span>
          <input
            value={k}
            placeholder="Название"
            onChange={(e) =>
              set(
                'specs',
                form.specs.map((s, idx) =>
                  idx === i ? [e.target.value, s[1]] : s,
                ) as [string, string][],
              )
            }
            className={field}
          />
          <input
            value={v}
            placeholder="Значение"
            onChange={(e) =>
              set(
                'specs',
                form.specs.map((s, idx) =>
                  idx === i ? [s[0], e.target.value] : s,
                ) as [string, string][],
              )
            }
            className={field}
          />
          <button
            onClick={() => moveSpec(i, -1)}
            disabled={i === 0}
            title="Выше"
            aria-label="Поднять характеристику"
            className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
          >
            <Icon name="ChevronUp" size={16} />
          </button>
          <button
            onClick={() => moveSpec(i, 1)}
            disabled={i === form.specs.length - 1}
            title="Ниже"
            aria-label="Опустить характеристику"
            className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
          >
            <Icon name="ChevronDown" size={16} />
          </button>
          <button
            onClick={() =>
              set(
                'specs',
                form.specs.filter((_, idx) => idx !== i),
              )
            }
            aria-label="Удалить"
            className="flex-none text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => set('specs', [...form.specs, ['', '']])}
        className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon name="Plus" size={14} />
        Характеристика
      </button>
    </div>

    <div>
      <span className={label}>Комплектация</span>
      {form.kit.map((k, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input
            value={k}
            onChange={(e) =>
              set(
                'kit',
                form.kit.map((x, idx) => (idx === i ? e.target.value : x)),
              )
            }
            className={field}
          />
          <button
            onClick={() =>
              set(
                'kit',
                form.kit.filter((_, idx) => idx !== i),
              )
            }
            aria-label="Удалить"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => set('kit', [...form.kit, ''])}
        className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon name="Plus" size={14} />
        Пункт
      </button>
    </div>

    <ImageZoom src={zoom} onClose={() => setZoom(null)} />
  </div>
  );
};

export default ProductContentTab;