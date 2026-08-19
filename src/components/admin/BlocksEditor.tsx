import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { GuideBlock } from '@/data/catalog';

const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';
const area =
  'w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary';

const BLOCK_LABEL: Record<string, string> = {
  step: 'Шаг',
  text: 'Абзац',
  image: 'Фото',
  note: 'Примечание',
};

export const uploadImage = async (file: File): Promise<string | null> => {
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const res = await adminFetch('?action=upload', {
    method: 'POST',
    body: JSON.stringify({ image: dataUrl }),
  });
  const data = await res.json();
  return res.ok ? data.url : null;
};

/** Оставляет только заполненные блоки — пустые в сохранение не идут */
export const cleanBlocks = (blocks: GuideBlock[]): GuideBlock[] =>
  blocks.filter((b) =>
    b.type === 'image'
      ? Boolean(b.image)
      : b.type === 'step'
        ? Boolean(b.text.trim() || b.title.trim())
        : Boolean(b.text.trim()),
  );

interface Props {
  blocks: GuideBlock[];
  onChange: (next: GuideBlock[]) => void;
  /** Какие типы блоков предлагать добавить */
  types?: GuideBlock['type'][];
  title?: string;
  hint?: string;
  emptyText?: string;
  /** Вернуть снимок в общую галерею товара */
  onMoveImageOut?: (src: string) => void;
}

/**
 * Редактор содержимого из блоков: абзац, фото с подписью, примечание, шаг.
 * Используется и в инструкциях, и в особенностях товара.
 */
const BlocksEditor = ({
  blocks,
  onChange,
  types = ['step', 'text', 'image', 'note'],
  title = 'Содержание',
  hint,
  emptyText = 'Пока пусто — добавьте абзац или фото.',
  onMoveImageOut,
}: Props) => {
  const [busy, setBusy] = useState(false);

  const setBlock = (i: number, next: GuideBlock) =>
    onChange(blocks.map((b, idx) => (idx === i ? next : b)));

  const addBlock = (type: GuideBlock['type']) => {
    const fresh: GuideBlock =
      type === 'step'
        ? { type: 'step', title: '', text: '' }
        : type === 'text'
          ? { type: 'text', text: '' }
          : type === 'note'
            ? { type: 'note', text: '' }
            : { type: 'image', image: '' };
    onChange([...blocks, fresh]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const pickImage = async (files: FileList | null, apply: (url: string) => void) => {
    if (!files?.length) return;
    setBusy(true);
    const url = await uploadImage(files[0]);
    setBusy(false);
    if (url) apply(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="eyebrow">{title}</span>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => addBlock(t)}
              className="border border-border px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
            >
              + {BLOCK_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {hint && <p className="mt-2 text-[0.8rem] text-muted-foreground">{hint}</p>}
      {busy && (
        <div className="mt-2 text-[0.78rem] uppercase tracking-[0.1em] text-primary">
          Загружаем фото…
        </div>
      )}

      <div className="mt-4 space-y-4">
        {!blocks.length && (
          <div className="border border-dashed border-border px-4 py-6 text-center text-[0.85rem] text-muted-foreground">
            {emptyText}
          </div>
        )}

        {blocks.map((b, i) => (
          <div key={i} className="border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.7rem] uppercase tracking-[0.12em] text-primary">
                {BLOCK_LABEL[b.type]}
              </span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <button onClick={() => move(i, -1)} aria-label="Вверх">
                  <Icon name="ChevronUp" size={16} />
                </button>
                <button onClick={() => move(i, 1)} aria-label="Вниз">
                  <Icon name="ChevronDown" size={16} />
                </button>
                <button
                  onClick={() => onChange(blocks.filter((_, idx) => idx !== i))}
                  aria-label="Удалить"
                  className="transition-colors hover:text-primary"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>

            {b.type === 'step' && (
              <div className="space-y-3">
                <input
                  value={b.title}
                  onChange={(e) => setBlock(i, { ...b, title: e.target.value })}
                  placeholder="Заголовок шага"
                  className={field}
                />
                <textarea
                  value={b.text}
                  rows={3}
                  onChange={(e) => setBlock(i, { ...b, text: e.target.value })}
                  placeholder="Что делать на этом шаге"
                  className={area}
                />
                <div className="flex items-center gap-3">
                  {b.image ? (
                    <div className="relative">
                      <img src={b.image} alt="" className="h-20 w-28 bg-card object-cover" />
                      <button
                        onClick={() => setBlock(i, { ...b, image: undefined })}
                        aria-label="Удалить фото"
                        className="absolute -right-2 -top-2 bg-primary p-1 text-primary-foreground"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                      <Icon name="Plus" size={16} />
                      Фото шага
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          pickImage(e.target.files, (url) => setBlock(i, { ...b, image: url }))
                        }
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {(b.type === 'text' || b.type === 'note') && (
              <textarea
                value={b.text}
                rows={3}
                onChange={(e) => setBlock(i, { ...b, text: e.target.value })}
                className={area}
                placeholder={b.type === 'note' ? 'Важное замечание' : 'Текст абзаца'}
              />
            )}

            {b.type === 'image' && (
              <div className="space-y-3">
                {b.image ? (
                  <div className="relative w-fit">
                    <img src={b.image} alt="" className="h-28 w-40 bg-card object-cover" />
                    {onMoveImageOut && (
                      <button
                        onClick={() => {
                          onMoveImageOut(b.image);
                          onChange(blocks.filter((_, idx) => idx !== i));
                        }}
                        title="Вернуть в «Описание и фото»"
                        aria-label="Вернуть в «Описание и фото»"
                        className="absolute -left-2 -top-2 border border-foreground bg-background p-1 text-foreground transition-colors hover:bg-foreground hover:text-background"
                      >
                        <Icon name="ArrowRightLeft" size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => setBlock(i, { ...b, image: '' })}
                      aria-label="Удалить"
                      className="absolute -right-2 -top-2 bg-primary p-1 text-primary-foreground"
                    >
                      <Icon name="X" size={11} />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-28 w-40 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Icon name="Plus" size={18} />
                    Загрузить
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        pickImage(e.target.files, (url) => setBlock(i, { ...b, image: url }))
                      }
                    />
                  </label>
                )}
                <input
                  value={b.caption ?? ''}
                  onChange={(e) => setBlock(i, { ...b, caption: e.target.value })}
                  placeholder="Подпись к фото"
                  className={field}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlocksEditor;
