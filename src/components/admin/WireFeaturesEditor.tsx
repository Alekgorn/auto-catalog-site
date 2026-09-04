import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { WireFeature } from '@/data/catalog';

/** Латиница из названия — из «Штатный усилитель» выйдет shtatnyy-usilitel */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya',
  ъ: '', ь: '',
};

const makeId = (label: string, taken: string[]): string => {
  const base =
    label
      .toLowerCase()
      .split('')
      .map((c) => TRANSLIT[c] ?? c)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'feature';
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
};

/**
 * Справочник признаков подключения.
 *
 * Раньше список был зашит в коде, и «добавить пункт» означало «позвать
 * разработчика». Теперь строки правятся здесь: название — что написать в
 * карточке, галочка «спрашивать» — задавать ли по нему вопрос при подборе.
 *
 * Идентификатор строки не меняется после создания: по нему у товаров
 * хранятся отметки, и переименование id стёрло бы разметку каталога.
 * Название при этом править можно сколько угодно.
 */
const WireFeaturesEditor = () => {
  const { toast } = useToast();
  const [list, setList] = useState<WireFeature[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch('?action=settings')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.settings?.wire_features))
          setList(d.settings.wire_features);
      })
      .catch(() => undefined);
  }, []);

  const update = (i: number, next: Partial<WireFeature>) =>
    setList((l) => l.map((f, idx) => (idx === i ? { ...f, ...next } : f)));

  const save = async () => {
    const clean = list
      .filter((f) => f.label.trim())
      .map((f) => ({ ...f, label: f.label.trim() }));
    setBusy(true);
    const res = await adminFetch('?action=settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: { wire_features: clean } }),
    });
    setBusy(false);
    if (res.ok) setList(clean);
    toast(
      res.ok
        ? { title: 'Признаки сохранены' }
        : { title: 'Ошибка', description: 'Не удалось сохранить' },
    );
  };

  return (
    <div>
      <div className="font-head text-lg font-bold uppercase tracking-tight">
        Признаки подключения
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Что проводка подключает: питание, акустика, кнопки на руле и так
        далее. В карточке товара по этому списку стоят галочки. Отметка
        «спрашивать» значит, что при подборе покупателю зададут вопрос —
        есть ли это в его машине.
      </p>

      <div className="mt-5 border-t border-foreground">
        <div className="hidden grid-cols-12 gap-3 border-b border-border py-2 text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground md:grid">
          <span className="col-span-7">Что подключается</span>
          <span className="col-span-4">Спрашивать покупателя</span>
        </div>

        {list.map((f, i) => (
          <div
            key={f.id}
            className="grid grid-cols-1 gap-3 border-b border-border py-3 md:grid-cols-12 md:items-center"
          >
            <div className="md:col-span-7">
              <input
                value={f.label}
                onChange={(e) => update(i, { label: e.target.value })}
                className="w-full border-b border-border bg-transparent py-1.5 outline-none transition-colors focus:border-primary"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 md:col-span-4">
              <input
                type="checkbox"
                checked={!!f.ask}
                onChange={(e) => update(i, { ask: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[0.8rem] text-muted-foreground">
                {f.ask ? 'Спрашиваем при подборе' : 'Только пишем в карточке'}
              </span>
            </label>
            <div className="flex md:col-span-1 md:justify-end">
              <button
                onClick={() => setList((l) => l.filter((_, x) => x !== i))}
                aria-label="Удалить признак"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="Trash2" size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={() =>
            setList((l) => [
              ...l,
              { id: makeId('', l.map((x) => x.id)), label: '', ask: false },
            ])
          }
          className="flex items-center gap-2 border border-foreground px-4 py-2.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Plus" size={15} />
          Добавить признак
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
        Удаление строки убирает вопрос и подпись, но отметки у товаров
        остаются — вернёте признак, и разметка снова заработает.
      </p>
    </div>
  );
};

export default WireFeaturesEditor;
