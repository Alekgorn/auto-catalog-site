import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  count: number;
  categories: string[];
  busy: boolean;
  onMove: (category: string) => void;
  onVisibility: (op: 'show' | 'hide') => void;
  onDelete: () => void;
  onClear: () => void;
}

/** Панель действий над отмеченными товарами. Появляется только при выделении. */
const BulkBar = ({
  count,
  categories,
  busy,
  onMove,
  onVisibility,
  onDelete,
  onClear,
}: Props) => {
  const [category, setCategory] = useState('');

  if (count === 0) return null;

  return (
    <div className="sticky bottom-0 z-30 -mx-6 border-t-2 border-foreground bg-surface px-6 py-4 shadow-panel md:-mx-14 md:px-14">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 min-w-8 items-center justify-center bg-primary px-2 font-head text-[0.85rem] font-bold text-primary-foreground">
            {count}
          </span>
          <span className="text-[0.8rem] uppercase tracking-[0.1em] text-muted-foreground">
            выбрано
          </span>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="cursor-pointer border border-border bg-transparent px-3 py-2.5 text-[0.85rem] outline-none transition-colors focus:border-primary"
          >
            <option value="">Перенести в категорию…</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              onMove(category);
              setCategory('');
            }}
            disabled={!category || busy}
            className="flex items-center gap-2 bg-foreground px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
          >
            <Icon name="FolderInput" size={15} />
            Перенести
          </button>

          <span className="mx-1 hidden h-6 w-px bg-border sm:block" />

          <button
            onClick={() => onVisibility('show')}
            disabled={busy}
            className="flex items-center gap-2 border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <Icon name="Eye" size={15} />
            Показать
          </button>
          <button
            onClick={() => onVisibility('hide')}
            disabled={busy}
            className="flex items-center gap-2 border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <Icon name="EyeOff" size={15} />
            Скрыть
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            disabled={busy}
            className="flex items-center gap-2 border border-primary px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
          >
            <Icon name="Trash2" size={15} />
            Удалить
          </button>
          <button
            onClick={onClear}
            aria-label="Снять выделение"
            className="p-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkBar;
