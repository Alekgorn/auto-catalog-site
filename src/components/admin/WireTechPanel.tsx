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
 * Привязка к рамке отвечает, какие проводки вообще подходят. Но если их
 * две-три, надо понять, какая нужна конкретному человеку — это и решают
 * галочки. Список признаков берётся из настроек, поэтому новый пункт
 * появляется здесь сам, без правки кода.
 *
 * Галочки ставятся прямо в строке, без открытия карточки: на четырёхстах
 * позициях каждый лишний клик стоит часов.
 */
const WireTechPanel = ({ products, onReload, onEdit }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [busy, setBusy] = useState('');
  const [dict, setDict] = useState<WireFeature[]>([]);

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

  // Размечено — значит хоть одна галочка стоит: пустой список ничего не
  // говорит подбору
  const isDone = (p: AdminProduct) => !!(p.wireFeatures || []).length;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wires.filter((p) => {
      if (onlyEmpty && isDone(p)) return false;
      if (!q) return true;
      return `${p.name} ${p.sku}`.toLowerCase().includes(q);
    });
  }, [wires, search, onlyEmpty]);

  const done = wires.filter(isDone).length;

  /** Переключаем одну галочку, остальные не трогаем */
  const toggle = async (p: AdminProduct, key: string) => {
    const now = p.wireFeatures || [];
    const next = now.includes(key)
      ? now.filter((x) => x !== key)
      : [...now, key];
    setBusy(p.slug ?? '');
    const res = await adminFetch('?action=bulk', {
      method: 'POST',
      body: JSON.stringify({
        op: 'wire-features',
        ids: [p.id],
        wireFeatures: next,
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
          Отметьте, что подключает каждая проводка. Когда к рамке подходит
          несколько вариантов, подбор по этим галочкам задаст покупателю
          правильный вопрос вместо списка наугад. Сам список признаков
          правится в «Настройках».
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

              <div className="flex flex-wrap gap-2">
                {dict.map((f) => {
                  const on = (p.wireFeatures || []).includes(f.id);
                  return (
                    <button
                      key={f.id}
                      disabled={busy === (p.slug ?? '')}
                      onClick={() => toggle(p, f.id)}
                      className={`border px-2.5 py-1 text-[0.72rem] transition-colors disabled:opacity-50 ${
                        on
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-muted-foreground hover:border-foreground'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
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
