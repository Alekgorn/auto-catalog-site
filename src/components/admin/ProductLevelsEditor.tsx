import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ProductLevel } from '@/data/catalog';

/** Латиница из названия — из «Средний класс» выйдет sredniy-klass */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya',
  ъ: '', ь: '',
};

const makeId = (title: string, taken: string[]): string => {
  const base =
    title
      .toLowerCase()
      .split('')
      .map((c) => TRANSLIT[c] ?? c)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'level';
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
};

const field =
  'w-full border-b border-border bg-transparent py-1.5 outline-none transition-colors focus:border-primary';

/**
 * Справочник классов магнитол.
 *
 * Классы объясняют покупателю, чем модели отличаются: что за платформа,
 * кому подходит, какие характеристики. Список показывается на странице
 * сценария и работает там фильтром, а метка класса стоит на карточке.
 *
 * Ключ строки не меняется после создания: по нему у товаров хранится
 * класс, и переименование ключа обнулило бы разметку каталога.
 * Название при этом править можно сколько угодно.
 */
const ProductLevelsEditor = () => {
  const { toast } = useToast();
  const [list, setList] = useState<ProductLevel[]>([]);
  const [busy, setBusy] = useState(false);
  /** Какая строка раскрыта: по одной, иначе на экране каша */
  const [open, setOpen] = useState<string>('');

  useEffect(() => {
    adminFetch('?action=settings')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.settings?.product_levels))
          setList(d.settings.product_levels);
      })
      .catch(() => undefined);
  }, []);

  const update = (i: number, next: Partial<ProductLevel>) =>
    setList((l) => l.map((x, idx) => (idx === i ? { ...x, ...next } : x)));

  /** Перестановка строк: порядок в списке — это порядок уровней на сайте */
  const move = (i: number, dir: -1 | 1) =>
    setList((l) => {
      const j = i + dir;
      if (j < 0 || j >= l.length) return l;
      const out = [...l];
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });

  const save = async () => {
    const clean = list
      .filter((x) => x.title.trim())
      .map((x) => ({
        ...x,
        title: x.title.trim(),
        specs: x.specs.filter((s) => s[0].trim() || s[1].trim()),
        extra: x.extra.filter((s) => s[0].trim() || s[1].trim()),
      }));
    setBusy(true);
    const res = await adminFetch('?action=settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: { product_levels: clean } }),
    });
    setBusy(false);
    if (res.ok) setList(clean);
    toast(
      res.ok
        ? { title: 'Классы сохранены' }
        : { title: 'Ошибка', description: 'Не удалось сохранить' },
    );
  };

  /** Пары «название — значение»: и характеристики, и свои поля */
  const rows = (
    items: [string, string][],
    onChange: (next: [string, string][]) => void,
    addLabel: string,
    placeholder: [string, string],
  ) => (
    <div className="space-y-2">
      {items.map((row, ri) => (
        <div key={ri} className="flex items-center gap-2">
          <input
            value={row[0]}
            placeholder={placeholder[0]}
            onChange={(e) =>
              onChange(
                items.map((r, x) =>
                  x === ri ? [e.target.value, r[1]] : r,
                ) as [string, string][],
              )
            }
            className={`${field} md:w-1/3`}
          />
          <input
            value={row[1]}
            placeholder={placeholder[1]}
            onChange={(e) =>
              onChange(
                items.map((r, x) =>
                  x === ri ? [r[0], e.target.value] : r,
                ) as [string, string][],
              )
            }
            className={field}
          />
          <button
            onClick={() => onChange(items.filter((_, x) => x !== ri))}
            aria-label="Удалить строку"
            className="flex-none text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ['', '']])}
        className="flex items-center gap-1.5 text-[0.78rem] font-medium text-primary transition-opacity hover:opacity-80"
      >
        <Icon name="Plus" size={14} />
        {addLabel}
      </button>
    </div>
  );

  return (
    <div>
      <div className="font-head text-lg font-bold uppercase tracking-tight">
        Классы магнитол
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Чем один уровень отличается от другого: базовый, средний, топовый.
        Список показывается покупателю на странице подбора и работает там
        фильтром, а название класса стоит меткой на карточке товара. Сам
        класс выбирается в карточке, на вкладке «Основное».
      </p>

      <div className="mt-5 border-t border-foreground">
        {list.map((lvl, i) => (
          <div key={lvl.id} className="border-b border-border py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-head text-[1.1rem] font-bold text-primary">
                {i + 1}
              </span>

              <input
                value={lvl.title}
                placeholder="Название класса"
                onChange={(e) => update(i, { title: e.target.value })}
                className={`${field} min-w-[12rem] flex-1`}
              />

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={lvl.active}
                  onChange={(e) => update(i, { active: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-[0.78rem] text-muted-foreground">
                  Показывать
                </span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  aria-label="Выше"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="ChevronUp" size={17} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  aria-label="Ниже"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="ChevronDown" size={17} />
                </button>
                <button
                  onClick={() => setOpen(open === lvl.id ? '' : lvl.id)}
                  className="ml-2 flex items-center gap-1.5 text-[0.78rem] font-medium text-primary transition-opacity hover:opacity-80"
                >
                  {open === lvl.id ? 'Свернуть' : 'Подробнее'}
                  <Icon
                    name={open === lvl.id ? 'ChevronUp' : 'ChevronDown'}
                    size={14}
                  />
                </button>
                <button
                  onClick={() => setList((l) => l.filter((_, x) => x !== i))}
                  aria-label="Удалить класс"
                  className="ml-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Trash2" size={17} />
                </button>
              </div>
            </div>

            {open === lvl.id && (
              <div className="mt-4 space-y-5 border-l-2 border-border pl-4">
                <label className="block">
                  <span className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                    Платформы
                  </span>
                  <input
                    value={lvl.series}
                    placeholder="TS105, G85"
                    onChange={(e) => update(i, { series: e.target.value })}
                    className={field}
                  />
                  <span className="mt-1 block text-[0.72rem] text-muted-foreground">
                    Подпись под названием — по ней видно, о каких моделях речь
                  </span>
                </label>

                <label className="block">
                  <span className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                    Описание
                  </span>
                  <textarea
                    value={lvl.summary}
                    rows={3}
                    placeholder="Одно-два предложения: кому подходит и почему"
                    onChange={(e) => update(i, { summary: e.target.value })}
                    className={`${field} resize-y`}
                  />
                </label>

                <label className="block">
                  <span className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                    К чему подходит
                  </span>
                  <input
                    value={lvl.suits}
                    placeholder="Для города и коротких поездок"
                    onChange={(e) => update(i, { suits: e.target.value })}
                    className={field}
                  />
                </label>

                <div>
                  <div className="mb-2 text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                    Характеристики
                  </div>
                  {rows(
                    lvl.specs,
                    (next) => update(i, { specs: next }),
                    'Добавить характеристику',
                    ['Процессор', '8 ядер, 2.2 ГГц'],
                  )}
                </div>

                <div>
                  <div className="mb-2 text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                    Дополнительно
                  </div>
                  {rows(
                    lvl.extra,
                    (next) => update(i, { extra: next }),
                    'Добавить своё поле',
                    ['Гарантия', '2 года'],
                  )}
                  <p className="mt-2 text-[0.72rem] text-muted-foreground">
                    Свои строки, если стандартных полей не хватило
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {list.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">
            Классов пока нет. Добавьте первый — например «Базовый уровень».
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() =>
            setList((l) => [
              ...l,
              {
                id: makeId('', l.map((x) => x.id)),
                title: '',
                series: '',
                summary: '',
                specs: [],
                suits: '',
                extra: [],
                active: true,
              },
            ])
          }
          className="flex items-center gap-2 border border-foreground px-4 py-2.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Plus" size={15} />
          Добавить класс
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="flex items-center gap-2 bg-foreground px-5 py-2.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
        >
          <Icon name={busy ? 'Loader' : 'Check'} size={15} />
          Сохранить
        </button>
      </div>

      <p className="mt-3 text-[0.78rem] text-muted-foreground">
        Порядок строк — это порядок уровней на сайте, от простого к
        топовому. Удаление класса убирает его со страниц, но выбор у
        товаров остаётся: вернёте класс — разметка снова заработает.
      </p>
    </div>
  );
};

export default ProductLevelsEditor;
