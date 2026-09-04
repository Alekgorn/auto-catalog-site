import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { WIRES_CATEGORY } from '@/lib/kit-filter';
import { formatPrice, WireFeature } from '@/data/catalog';

interface Props {
  products: AdminProduct[];
  onReload?: () => void;
  /** Открыть карточку товара — правки делаются там, где они видны */
  onEdit?: (p: AdminProduct) => void;
}

/**
 * Быстрая разметка проводок: что каждая подключает.
 *
 * Галочки копятся в черновике и уходят в базу одной кнопкой сверху.
 * Раньше каждый клик сохранялся сам — и строка тут же пропадала из
 * списка «только неразмеченные», потому что уже считалась готовой.
 * Выглядело это так, будто галочки не нажимаются.
 *
 * Список признаков берётся из настроек, поэтому новый пункт появляется
 * здесь сам, без правки кода.
 */
const WireTechPanel = ({ products, onReload, onEdit }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dict, setDict] = useState<WireFeature[]>([]);
  /** Черновик: id товара → отмеченные признаки. Пока не сохранён */
  const [draft, setDraft] = useState<Record<string, string[]>>({});

  useEffect(() => {
    adminFetch('?action=settings')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.settings?.wire_features))
          setDict(d.settings.wire_features);
      })
      .catch(() => undefined);
  }, []);

  const wires = useMemo(
    () =>
      products
        .filter((p) => p.isActive && p.category === WIRES_CATEGORY)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  /** Что отмечено сейчас: черновик, если правили, иначе из базы */
  const marksOf = (p: AdminProduct): string[] =>
    draft[String(p.id)] ?? p.wireFeatures ?? [];

  const isDone = (p: AdminProduct) => !!(p.wireFeatures || []).length;

  /*
   * Фильтр смотрит на сохранённое, а не на черновик: иначе строка
   * исчезала бы прямо под курсором после первой же галочки.
   */
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wires.filter((p) => {
      if (onlyEmpty && isDone(p) && !(String(p.id) in draft)) return false;
      if (!q) return true;
      return `${p.name} ${p.sku}`.toLowerCase().includes(q);
    });
  }, [wires, search, onlyEmpty, draft]);

  const done = wires.filter(isDone).length;
  const changed = Object.keys(draft).length;

  const toggle = (p: AdminProduct, key: string) => {
    const now = marksOf(p);
    setDraft((d) => ({
      ...d,
      [String(p.id)]: now.includes(key)
        ? now.filter((x) => x !== key)
        : [...now, key],
    }));
  };

  /** Сохраняем всё разом: правок обычно десятки, по одной — долго */
  const save = async () => {
    const entries = Object.entries(draft);
    if (!entries.length) return;
    setBusy(true);
    /* Товары с одинаковым набором галочек уходят одним запросом: при
       разметке пачкой наборы почти всегда совпадают, и это разница
       между двумя запросами и двумя сотнями */
    const byCombo = new Map<string, string[]>();
    entries.forEach(([id, feats]) => {
      const key = [...feats].sort().join('|');
      byCombo.set(key, [...(byCombo.get(key) ?? []), id]);
    });

    let bad = 0;
    for (const [key, ids] of byCombo) {
      const res = await adminFetch('?action=bulk', {
        method: 'POST',
        body: JSON.stringify({
          op: 'wire-features',
          ids,
          wireFeatures: key ? key.split('|') : [],
        }),
      });
      if (!res.ok) bad += ids.length;
    }
    setBusy(false);
    if (bad) {
      toast({
        title: 'Сохранилось не всё',
        description: `Не удалось записать ${bad} из ${entries.length}`,
        variant: 'destructive',
      });
      return;
    }
    setDraft({});
    toast({ title: `Сохранено: ${entries.length}` });
    onReload?.();
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
          Отметьте, что подключает каждая проводка. Когда к рамке подходит
          несколько вариантов, подбор по этим галочкам задаст покупателю
          правильный вопрос вместо списка наугад. Сам список признаков
          правится в «Настройках».
        </p>
        <div className="text-[0.78rem] text-muted-foreground">
          Размечено {done} из {wires.length}
        </div>
      </div>

      {/* Кнопка сверху: список длинный, и уезжать за сохранением вниз
          на две сотни строк — плохая идея */}
      <div className="sticky top-0 z-10 mt-4 flex flex-wrap items-center gap-4 border-b border-border bg-background py-3">
        <button
          onClick={save}
          disabled={busy || !changed}
          className="flex items-center gap-2 bg-foreground px-5 py-2.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          <Icon name={busy ? 'Loader' : 'Check'} size={15} />
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <span className="text-[0.8rem] text-muted-foreground">
          {changed
            ? `Изменено проводок: ${changed}`
            : 'Отметьте галочки и нажмите «Сохранить»'}
        </span>
        {changed > 0 && (
          <button
            onClick={() => setDraft({})}
            className="text-[0.78rem] text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            Отменить правки
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Название или артикул"
          className="w-full max-w-xs border-b border-border bg-transparent py-2 text-sm outline-none transition-colors focus:border-primary"
        />
        <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyEmpty}
            onChange={(e) => setOnlyEmpty(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Только неразмеченные
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 border border-border py-12 text-center">
          <Icon name="CircleCheck" size={24} className="mx-auto text-success" />
          <div className="mt-2 text-[0.87rem] text-muted-foreground">
            Здесь пусто — значит всё размечено
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {shown.slice(0, 200).map((p) => {
            const marks = marksOf(p);
            const edited = String(p.id) in draft;
            return (
              <div
                key={p.slug ?? p.id}
                className={`flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border py-3 ${
                  edited ? 'bg-secondary/40' : ''
                }`}
              >
                {/* Клик по фото открывает карточку: там правят название,
                    совместимость и всё остальное */}
                <button
                  onClick={() => onEdit?.(p)}
                  title="Открыть карточку"
                  className="flex-none"
                >
                  <img
                    src={p.images?.[0] ?? ''}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 bg-card object-contain transition-opacity hover:opacity-70"
                  />
                </button>
                <div className="min-w-[15rem] flex-1">
                  <div className="text-[0.85rem] leading-snug">{p.name}</div>
                  <div className="mt-0.5 text-[0.72rem] uppercase tracking-[0.06em] text-muted-foreground">
                    {p.sku || '—'} · {formatPrice(p.price)}
                    {edited && (
                      <span className="ml-2 text-primary">не сохранено</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {dict.map((f) => (
                    <label
                      key={f.id}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={marks.includes(f.id)}
                        onChange={() => toggle(p, f.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-[0.78rem]">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {shown.length > 200 && (
            <div className="py-4 text-center text-[0.8rem] text-muted-foreground">
              Показаны первые 200 из {shown.length}. Уточните поиск.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WireTechPanel;