import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  AdminProduct,
  WIRE_TECH,
  WireTechValue,
} from '@/components/admin/product-editor/product-types';
import { WIRES_CATEGORY } from '@/lib/kit-filter';
import { formatPrice } from '@/data/catalog';

interface Props {
  products: AdminProduct[];
  onReload?: () => void;
  /** Открыть карточку товара — правки делаются там, где они видны */
  onEdit?: (p: AdminProduct) => void;
}

/** Что спрашиваем у покупателя — эти три решают, какая проводка нужна */
const KEYS = ['amp', 'camera', 'can'];

const OPTS: { id: WireTechValue; label: string; hint: string }[] = [
  { id: 'yes', label: 'Только с ним', hint: 'Проводка нужна, если это есть' },
  { id: 'no', label: 'Только без', hint: 'Проводка не рассчитана на это' },
  { id: 'any', label: 'Неважно', hint: 'Подходит в любом случае' },
];

/**
 * Быстрая разметка проводок: усилитель, камера, CAN-шина.
 *
 * Привязка к рамке отвечает, какие проводки вообще подходят. Но если их
 * две-три, надо понять, какая нужна конкретному человеку — и решают это
 * ровно три признака. Остальные параметры (питание, акустика) есть у
 * всех и ничего не отсеивают, поэтому их тут нет: экран для работы, а
 * не для полноты.
 *
 * Значения ставятся прямо в строке, без открытия карточки товара: на
 * четырёхстах позициях каждый лишний клик стоит часов.
 */
const WireTechPanel = ({ products, onReload, onEdit }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [busy, setBusy] = useState('');

  const wires = useMemo(
    () =>
      products
        .filter((p) => p.isActive && p.category === WIRES_CATEGORY)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const isDone = (p: AdminProduct) =>
    KEYS.every((k) => !!(p.wireTech || {})[k]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wires.filter((p) => {
      if (onlyEmpty && isDone(p)) return false;
      if (!q) return true;
      return `${p.name} ${p.sku}`.toLowerCase().includes(q);
    });
  }, [wires, search, onlyEmpty]);

  const done = wires.filter(isDone).length;

  /** Меняем один признак товара, остальные не трогаем */
  const setTech = async (p: AdminProduct, key: string, val: WireTechValue) => {
    const next = { ...(p.wireTech || {}), [key]: val };
    setBusy(p.slug ?? '');
    const res = await adminFetch('?action=bulk', {
      method: 'POST',
      body: JSON.stringify({
        op: 'wire-tech',
        ids: [p.id],
        wireTech: next,
      }),
    });
    setBusy('');
    if (!res.ok) {
      toast({ title: 'Не сохранилось', variant: 'destructive' });
      return;
    }
    onReload?.();
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
          Когда к рамке подходит несколько проводок, выбрать нужную помогают
          три признака: штатный усилитель, камера и CAN-шина. Отметьте их —
          и подбор задаст покупателю правильный вопрос вместо списка
          вариантов наугад.
        </p>
        <div className="text-[0.78rem] text-muted-foreground">
          Размечено {done} из {wires.length}
        </div>
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
          {shown.slice(0, 200).map((p) => (
            <div
              key={p.slug ?? p.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border py-3"
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
                </div>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {WIRE_TECH.filter((t) => KEYS.includes(t.id)).map((t) => (
                  <div key={t.id}>
                    <div className="text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground">
                      {t.label}
                    </div>
                    <div className="mt-1 flex">
                      {OPTS.map((o) => (
                        <button
                          key={o.id}
                          title={o.hint}
                          disabled={busy === (p.slug ?? '')}
                          onClick={() => setTech(p, t.id, o.id)}
                          className={`border px-2.5 py-1 text-[0.7rem] transition-colors disabled:opacity-50 ${
                            (p.wireTech || {})[t.id] === o.id
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border text-muted-foreground hover:border-foreground'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
