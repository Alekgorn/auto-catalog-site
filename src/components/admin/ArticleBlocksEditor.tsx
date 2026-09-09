import { useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import VideoField from '@/components/admin/VideoField';
import ImageZoom from '@/components/admin/ImageZoom';
import { uploadImage } from '@/components/admin/BlocksEditor';
import { ArticleBlock } from '@/data/catalog';
import { AdminProduct } from '@/components/admin/product-editor/product-types';

const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';
const area =
  'w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary';

/** Что можно вставить в статью. Порядок — по частоте использования */
const TYPES: { type: ArticleBlock['type']; label: string; icon: string }[] = [
  { type: 'text', label: 'Абзац', icon: 'Type' },
  { type: 'heading', label: 'Подзаголовок', icon: 'Heading' },
  { type: 'list', label: 'Список', icon: 'List' },
  { type: 'image', label: 'Фото', icon: 'Image' },
  { type: 'table', label: 'Таблица', icon: 'Table' },
  { type: 'note', label: 'Врезка', icon: 'Info' },
  { type: 'quote', label: 'Цитата', icon: 'Quote' },
  { type: 'faq', label: 'Вопрос-ответ', icon: 'MessagesSquare' },
  { type: 'product', label: 'Товар', icon: 'Package' },
  { type: 'products', label: 'Подборка', icon: 'LayoutGrid' },
  { type: 'cta', label: 'Призыв', icon: 'MousePointerClick' },
  { type: 'video', label: 'Видео', icon: 'Play' },
];

const LABEL: Record<string, string> = Object.fromEntries(
  TYPES.map((t) => [t.type, t.label]),
);

const fresh = (type: ArticleBlock['type']): ArticleBlock => {
  switch (type) {
    case 'heading':
      return { type: 'heading', text: '', level: 2 };
    case 'list':
      return { type: 'list', items: [''] };
    case 'table':
      return { type: 'table', head: ['', ''], rows: [['', '']] };
    case 'quote':
      return { type: 'quote', text: '' };
    case 'faq':
      return { type: 'faq', items: [{ q: '', a: '' }] };
    case 'product':
      return { type: 'product', slug: '' };
    case 'products':
      return { type: 'products', slugs: [] };
    case 'cta':
      return {
        type: 'cta',
        title: '',
        buttonText: 'Подобрать магнитолу',
        buttonHref: '/',
      };
    case 'image':
      return { type: 'image', image: '' };
    case 'video':
      return { type: 'video', video: '' };
    case 'note':
      return { type: 'note', text: '' };
    case 'step':
      return { type: 'step', title: '', text: '' };
    default:
      return { type: 'text', text: '' };
  }
};

/** Выбор товара из каталога по названию или артикулу */
const ProductPicker = ({
  products,
  value,
  onPick,
  label,
}: {
  products: AdminProduct[];
  value?: string;
  onPick: (slug: string) => void;
  label: string;
}) => {
  const [search, setSearch] = useState('');

  const found = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.slug &&
          (p.name.toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [products, search]);

  const picked = products.find((p) => p.slug === value);

  return (
    <div>
      <div className="eyebrow mb-2">{label}</div>
      {picked && (
        <div className="mb-2 flex items-center gap-3 border border-border p-2">
          {picked.images?.[0] && (
            <img src={picked.images[0]} alt="" className="h-11 w-11 object-contain" />
          )}
          <span className="flex-1 text-[0.85rem] leading-snug">{picked.name}</span>
          <button
            onClick={() => onPick('')}
            aria-label="Убрать товар"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={15} />
          </button>
        </div>
      )}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Название или артикул"
        className={field}
      />
      {found.length > 0 && (
        <div className="mt-2 max-h-52 divide-y divide-border overflow-auto border border-border">
          {found.map((p) => (
            <button
              key={p.slug}
              onClick={() => {
                onPick(p.slug as string);
                setSearch('');
              }}
              className="flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-card"
            >
              {p.images?.[0] && (
                <img src={p.images[0]} alt="" className="h-9 w-9 object-contain" />
              )}
              <span className="text-[0.82rem] leading-snug">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Поле текста с выделением жирным.
 *
 * Выделяете слово мышкой, жмёте «Ж» — оно оборачивается звёздочками и
 * на сайте выйдет жирным. Горячие клавиши тоже работают.
 */
const RichArea = ({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: from, selectionEnd: to } = el;
    if (from === to) return;

    const picked = value.slice(from, to);
    /* Повторное нажатие на уже выделенном — снимаем разметку */
    const inside = /^\*\*([\s\S]+)\*\*$/.exec(picked);
    const next = inside
      ? value.slice(0, from) + inside[1] + value.slice(to)
      : `${value.slice(0, from)}**${picked}**${value.slice(to)}`;

    onChange(next);
    /* Возвращаем выделение на то же слово: иначе после нажатия курсор
       улетает в конец и следующее слово приходится искать заново */
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(from, to + (inside ? -4 : 4));
    });
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-3">
        <button
          onClick={wrap}
          title="Выделить жирным (Ctrl+B)"
          className="flex h-7 w-7 items-center justify-center border border-border font-head text-[0.8rem] font-bold transition-colors hover:border-primary hover:text-primary"
        >
          Ж
        </button>
        <span className="text-[0.72rem] text-muted-foreground">
          выделите слово и нажмите
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            wrap();
          }
        }}
        className={area}
      />
    </div>
  );
};

interface Props {
  blocks: ArticleBlock[];
  onChange: (next: ArticleBlock[]) => void;
  products: AdminProduct[];
}

/**
 * Редактор тела статьи.
 *
 * Текст набирается блоками, а не сплошным полем: так у страницы
 * получается разметка, которую понимает поисковик — подзаголовки,
 * списки, таблицы, вопрос-ответ. Товар вставляется ссылкой на карточку
 * из каталога: цена и фото подтянутся сами и не устареют.
 */
const ArticleBlocksEditor = ({ blocks, onChange, products }: Props) => {
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const set = (i: number, next: ArticleBlock) =>
    onChange(blocks.map((b, idx) => (idx === i ? next : b)));

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
        <span className="eyebrow">Текст статьи</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.type}
            onClick={() => onChange([...blocks, fresh(t.type)])}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {busy && (
        <div className="mt-2 text-[0.78rem] uppercase tracking-[0.1em] text-primary">
          Загружаем фото…
        </div>
      )}

      <div className="mt-4 space-y-4">
        {!blocks.length && (
          <div className="border border-dashed border-border px-4 py-7 text-center text-[0.85rem] text-muted-foreground">
            Пусто. Начните с абзаца — или вставьте текст целиком, он сам
            разложится на абзацы.
          </div>
        )}

        {blocks.map((b, i) => (
          <div key={i} className="border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.7rem] uppercase tracking-[0.12em] text-primary">
                {LABEL[b.type] ?? b.type}
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

            {b.type === 'text' && (
              <RichArea
                value={b.text}
                onChange={(text) => set(i, { ...b, text })}
                placeholder="Текст абзаца"
              />
            )}

            {b.type === 'heading' && (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={b.text}
                  onChange={(e) => set(i, { ...b, text: e.target.value })}
                  placeholder="Текст подзаголовка"
                  className={`${field} flex-1`}
                />
                <div className="flex gap-2">
                  {([2, 3] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => set(i, { ...b, level: lvl })}
                      className={`border px-3 py-1.5 text-[0.72rem] transition-colors ${
                        (b.level ?? 2) === lvl
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      H{lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {b.type === 'list' && (
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(b.ordered)}
                    onChange={(e) => set(i, { ...b, ordered: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Нумерованный список
                </label>
                {b.items.map((item, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <input
                      value={item}
                      onChange={(e) =>
                        set(i, {
                          ...b,
                          items: b.items.map((x, idx) =>
                            idx === k ? e.target.value : x,
                          ),
                        })
                      }
                      placeholder={`Пункт ${k + 1}`}
                      className={`${field} flex-1`}
                    />
                    <button
                      onClick={() =>
                        set(i, { ...b, items: b.items.filter((_, idx) => idx !== k) })
                      }
                      aria-label="Удалить пункт"
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => set(i, { ...b, items: [...b.items, ''] })}
                  className="flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Plus" size={13} />
                  Пункт
                </button>
              </div>
            )}

            {b.type === 'table' && (
              <div className="space-y-3">
                <div className="overflow-auto">
                  <table className="w-full min-w-[30em] border-collapse">
                    <thead>
                      <tr>
                        {b.head.map((h, c) => (
                          <th key={c} className="border border-border p-1">
                            <input
                              value={h}
                              onChange={(e) =>
                                set(i, {
                                  ...b,
                                  head: b.head.map((x, idx) =>
                                    idx === c ? e.target.value : x,
                                  ),
                                })
                              }
                              placeholder={`Столбец ${c + 1}`}
                              className="w-full bg-transparent p-1 text-[0.8rem] font-bold outline-none"
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) => (
                            <td key={c} className="border border-border p-1">
                              <input
                                value={cell}
                                onChange={(e) =>
                                  set(i, {
                                    ...b,
                                    rows: b.rows.map((rr, ri) =>
                                      ri === r
                                        ? rr.map((x, ci) =>
                                            ci === c ? e.target.value : x,
                                          )
                                        : rr,
                                    ),
                                  })
                                }
                                className="w-full bg-transparent p-1 text-[0.8rem] outline-none"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() =>
                      set(i, {
                        ...b,
                        rows: [...b.rows, b.head.map(() => '')],
                      })
                    }
                    className="flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon name="Plus" size={13} />
                    Строка
                  </button>
                  <button
                    onClick={() =>
                      set(i, {
                        ...b,
                        head: [...b.head, ''],
                        rows: b.rows.map((r) => [...r, '']),
                      })
                    }
                    className="flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Icon name="Plus" size={13} />
                    Столбец
                  </button>
                  {b.head.length > 2 && (
                    <button
                      onClick={() =>
                        set(i, {
                          ...b,
                          head: b.head.slice(0, -1),
                          rows: b.rows.map((r) => r.slice(0, -1)),
                        })
                      }
                      className="flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="Minus" size={13} />
                      Столбец
                    </button>
                  )}
                </div>
                <input
                  value={b.caption ?? ''}
                  onChange={(e) => set(i, { ...b, caption: e.target.value })}
                  placeholder="Подпись к таблице"
                  className={field}
                />
              </div>
            )}

            {b.type === 'note' && (
              <RichArea
                value={b.text}
                rows={3}
                onChange={(text) => set(i, { ...b, text })}
                placeholder="Важное замечание"
              />
            )}

            {b.type === 'quote' && (
              <div className="space-y-3">
                <textarea
                  value={b.text}
                  rows={3}
                  onChange={(e) => set(i, { ...b, text: e.target.value })}
                  placeholder="Текст цитаты"
                  className={area}
                />
                <input
                  value={b.author ?? ''}
                  onChange={(e) => set(i, { ...b, author: e.target.value })}
                  placeholder="Кто сказал"
                  className={field}
                />
              </div>
            )}

            {b.type === 'faq' && (
              <div className="space-y-3">
                <p className="text-[0.78rem] text-muted-foreground">
                  Поисковик показывает такие пары отдельным блоком прямо в
                  выдаче — вопросы стоит писать так, как их задают вслух.
                </p>
                {b.items.map((qa, k) => (
                  <div key={k} className="border-l-2 border-border pl-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={qa.q}
                        onChange={(e) =>
                          set(i, {
                            ...b,
                            items: b.items.map((x, idx) =>
                              idx === k ? { ...x, q: e.target.value } : x,
                            ),
                          })
                        }
                        placeholder="Вопрос"
                        className={`${field} flex-1`}
                      />
                      <button
                        onClick={() =>
                          set(i, {
                            ...b,
                            items: b.items.filter((_, idx) => idx !== k),
                          })
                        }
                        aria-label="Удалить вопрос"
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                    <textarea
                      value={qa.a}
                      rows={2}
                      onChange={(e) =>
                        set(i, {
                          ...b,
                          items: b.items.map((x, idx) =>
                            idx === k ? { ...x, a: e.target.value } : x,
                          ),
                        })
                      }
                      placeholder="Ответ"
                      className={`${area} mt-2`}
                    />
                  </div>
                ))}
                <button
                  onClick={() => set(i, { ...b, items: [...b.items, { q: '', a: '' }] })}
                  className="flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Plus" size={13} />
                  Вопрос
                </button>
              </div>
            )}

            {b.type === 'product' && (
              <div className="space-y-3">
                <ProductPicker
                  products={products}
                  value={b.slug}
                  onPick={(slug) => set(i, { ...b, slug })}
                  label="Товар из каталога"
                />
                <input
                  value={b.note ?? ''}
                  onChange={(e) => set(i, { ...b, note: e.target.value })}
                  placeholder="Подпись — почему именно он"
                  className={field}
                />
              </div>
            )}

            {b.type === 'products' && (
              <div className="space-y-3">
                <input
                  value={b.title ?? ''}
                  onChange={(e) => set(i, { ...b, title: e.target.value })}
                  placeholder="Заголовок подборки"
                  className={field}
                />
                {b.slugs.length > 0 && (
                  <div className="space-y-2">
                    {b.slugs.map((slug, k) => {
                      const p = products.find((x) => x.slug === slug);
                      return (
                        <div
                          key={slug + k}
                          className="flex items-center gap-3 border border-border p-2"
                        >
                          {p?.images?.[0] && (
                            <img
                              src={p.images[0]}
                              alt=""
                              className="h-10 w-10 object-contain"
                            />
                          )}
                          <span className="flex-1 text-[0.82rem] leading-snug">
                            {p?.name ?? slug}
                          </span>
                          <button
                            onClick={() =>
                              set(i, {
                                ...b,
                                slugs: b.slugs.filter((_, idx) => idx !== k),
                              })
                            }
                            aria-label="Убрать"
                            className="text-muted-foreground transition-colors hover:text-primary"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <ProductPicker
                  products={products}
                  onPick={(slug) =>
                    slug &&
                    !b.slugs.includes(slug) &&
                    set(i, { ...b, slugs: [...b.slugs, slug] })
                  }
                  label="Добавить товар"
                />
              </div>
            )}

            {b.type === 'cta' && (
              <div className="space-y-3">
                <input
                  value={b.title}
                  onChange={(e) => set(i, { ...b, title: e.target.value })}
                  placeholder="Заголовок призыва"
                  className={field}
                />
                <textarea
                  value={b.text ?? ''}
                  rows={2}
                  onChange={(e) => set(i, { ...b, text: e.target.value })}
                  placeholder="Пояснение"
                  className={area}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={b.buttonText}
                    onChange={(e) => set(i, { ...b, buttonText: e.target.value })}
                    placeholder="Текст кнопки"
                    className={field}
                  />
                  <input
                    value={b.buttonHref}
                    onChange={(e) => set(i, { ...b, buttonHref: e.target.value })}
                    placeholder="Куда ведёт: /catalog"
                    className={field}
                  />
                </div>
              </div>
            )}

            {b.type === 'image' && (
              <div className="space-y-3">
                {b.image ? (
                  <div className="relative w-fit">
                    <button
                      onClick={() => setZoom(b.image)}
                      aria-label="Открыть фото"
                      className="block cursor-zoom-in border border-transparent transition-colors hover:border-primary"
                    >
                      <img
                        src={b.image}
                        alt=""
                        className="h-28 w-40 bg-card object-cover"
                      />
                    </button>
                    <button
                      onClick={() => set(i, { ...b, image: '' })}
                      aria-label="Удалить фото"
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
                        pickImage(e.target.files, (url) => set(i, { ...b, image: url }))
                      }
                    />
                  </label>
                )}
                <input
                  value={b.caption ?? ''}
                  onChange={(e) => set(i, { ...b, caption: e.target.value })}
                  placeholder="Подпись к фото"
                  className={field}
                />
              </div>
            )}

            {b.type === 'video' && (
              <div className="space-y-3">
                <VideoField
                  value={b.video}
                  onChange={(url) => set(i, { ...b, video: url })}
                />
                <input
                  value={b.caption ?? ''}
                  onChange={(e) => set(i, { ...b, caption: e.target.value })}
                  placeholder="Подпись к видео"
                  className={field}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <ImageZoom src={zoom} onClose={() => setZoom(null)} />
    </div>
  );
};

export default ArticleBlocksEditor;