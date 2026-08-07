import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { HeroShortcut } from '@/lib/site-settings';

interface Props {
  value: HeroShortcut[];
  categories: string[];
  onChange: (list: HeroShortcut[]) => void;
}

const input =
  'w-full border-b border-border bg-transparent py-2 text-[0.9rem] outline-none transition-colors focus:border-primary';

const isImage = (icon: string) => /^(https?:)?\//.test(icon);

const ShortcutsEditor = ({ value, categories, onChange }: Props) => {
  const [busy, setBusy] = useState<number | null>(null);

  const setAt = (i: number, patch: Partial<HeroShortcut>) =>
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const upload = async (i: number, file: File | undefined) => {
    if (!file) return;
    setBusy(i);
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
    if (res.ok && data.url) setAt(i, { icon: data.url });
    setBusy(null);
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Кнопки на главной</div>
          <h3 className="mt-3 font-head text-xl font-bold uppercase tracking-tight">
            Быстрый переход в каталог
          </h3>
          <p className="mt-3 max-w-[34em] text-muted-foreground">
            Кнопки под слоганом. Выберите категорию — кнопка откроет каталог уже
            с ней. «Весь каталог» просто спускает к списку товаров.
          </p>
        </div>
        <button
          onClick={() =>
            onChange([...value, { label: '', category: '', icon: 'Tag' }])
          }
          className="flex flex-none items-center gap-2 border border-foreground px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Plus" size={14} />
          Кнопка
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {value.map((s, i) => (
          <div key={i} className="border border-border p-4">
            <div className="flex items-start gap-4">
              <label
                title="Загрузить картинку"
                className="flex h-14 w-14 flex-none cursor-pointer items-center justify-center border border-dashed border-border transition-colors hover:border-primary"
              >
                {busy === i ? (
                  <Icon name="Loader" size={18} />
                ) : isImage(s.icon) ? (
                  <img src={s.icon} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Icon name={s.icon || 'Tag'} size={20} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => upload(i, e.target.files?.[0])}
                />
              </label>

              <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="eyebrow">Название</span>
                  <input
                    value={s.label}
                    placeholder="Магнитолы"
                    onChange={(e) => setAt(i, { label: e.target.value })}
                    className={input}
                  />
                </label>

                <label className="block">
                  <span className="eyebrow">Ведёт в каталог</span>
                  <select
                    value={s.category}
                    onChange={(e) => setAt(i, { category: e.target.value })}
                    className={`${input} cursor-pointer`}
                  >
                    <option value="">Весь каталог</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="eyebrow">Иконка</span>
                  <input
                    value={isImage(s.icon) ? '' : s.icon}
                    placeholder="Radio, Camera, Cable"
                    onChange={(e) => setAt(i, { icon: e.target.value })}
                    disabled={isImage(s.icon)}
                    className={`${input} disabled:opacity-50`}
                  />
                  {isImage(s.icon) && (
                    <button
                      onClick={() => setAt(i, { icon: 'Tag' })}
                      className="mt-1 text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                    >
                      Убрать картинку
                    </button>
                  )}
                </label>
              </div>

              <div className="flex flex-none flex-col gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Левее"
                  className="p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                >
                  <Icon name="ChevronUp" size={16} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  title="Правее"
                  className="p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                >
                  <Icon name="ChevronDown" size={16} />
                </button>
                <button
                  onClick={() => onChange(value.filter((_, x) => x !== i))}
                  title="Удалить"
                  className="p-1 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortcutsEditor;
