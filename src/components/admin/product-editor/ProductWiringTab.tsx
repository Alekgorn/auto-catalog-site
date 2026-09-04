import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { formatPrice } from '@/data/catalog';
import { FRAMES_CATEGORY, WIRES_CATEGORY } from '@/lib/kit-filter';
import {
  AdminProduct,
  SetField,
  WIRE_TECH,
  WireTechValue,
} from './product-types';

interface Props {
  form: AdminProduct;
  set: SetField;
  /** Каталог целиком — из него берём вторую сторону связи */
  products?: AdminProduct[];
  /** Открыть другой товар: связь редактируется с обеих сторон */
  onOpen?: (product: AdminProduct) => void;
}

/** Признаки, по которым проводки отличаются друг от друга */
const KEYS = ['amp', 'camera', 'can'];

const TECH_OPTS: { id: WireTechValue; label: string; hint: string }[] = [
  { id: 'yes', label: 'Только с ним', hint: 'Проводка нужна, если это есть' },
  { id: 'no', label: 'Только без', hint: 'Проводка не рассчитана на это' },
  { id: 'any', label: 'Неважно', hint: 'Подходит в любом случае' },
];

/** Совпадают ли товары хотя бы по одной машине и пересекаются ли годы */
const related = (a: AdminProduct, b: AdminProduct): boolean => {
  const aFrom = a.yearFrom || 1990;
  const aTo = a.yearTo || 2100;
  const bFrom = b.yearFrom || 1990;
  const bTo = b.yearTo || 2100;
  if (aFrom > bTo || bFrom > aTo) return false;

  return Object.entries(a.fits ?? {}).some(([brand, models]) => {
    const other = Object.entries(b.fits ?? {}).find(
      ([x]) => x.toLowerCase() === brand.toLowerCase(),
    )?.[1];
    if (!Array.isArray(other)) return false;
    return (models ?? []).some((m) =>
      other.some((o) => o.toLowerCase() === m.toLowerCase()),
    );
  });
};

/**
 * Вкладка «Подключение» — связь рамки и проводки.
 *
 * Отсюда убрано всё, что осталось от старой схемы с годами: уровень
 * совместимости, кузова, руль, список сохраняемых функций. Заполнено это
 * было у трёх товаров из тысячи семисот и ни на что не влияло — а место
 * занимало и путало.
 *
 * Осталось ровно то, что решает: какие проводки подходят к рамке (или к
 * каким рамкам подходит проводка) и три признака, по которым проводки
 * отличаются между собой. Связь правится с обеих сторон — открыли рамку
 * или проводку, результат один.
 */
const ProductWiringTab = ({ form, set, products = [], onOpen }: Props) => {
  const [search, setSearch] = useState('');
  const isFrame = form.category === FRAMES_CATEGORY;
  const isWire = form.category === WIRES_CATEGORY;
  const tech = form.wireTech || {};

  const setTech = (id: string, val: WireTechValue) => {
    const next = { ...tech };
    if (next[id] === val) delete next[id];
    else next[id] = val;
    set('wireTech', next);
  };

  /* Рамки, к которым привязана эта проводка. Связь хранится у рамки, но
     смотреть на неё удобно с обеих сторон: открыли проводку — видно, где
     она используется */
  const usedByFrames = useMemo(
    () =>
      isWire && form.slug
        ? products.filter((p) => p.frameWires?.includes(form.slug!))
        : [],
    [isWire, form.slug, products],
  );

  /* Проводки, которые можно поставить этой рамке: та же машина и
     пересечение по годам. Из четырёхсот выбрать нельзя, из десяти легко */
  const wireOptions = useMemo(() => {
    if (!isFrame) return [];
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => p.isActive && p.category === WIRES_CATEGORY)
      .filter((p) => related(form, p) || form.frameWires?.includes(p.slug ?? ''))
      .filter((p) => !q || `${p.name} ${p.sku}`.toLowerCase().includes(q))
      .sort((a, b) => a.price - b.price);
  }, [isFrame, products, form, search]);

  const toggleWire = (slug: string) => {
    const now = form.frameWires ?? [];
    set(
      'frameWires',
      now.includes(slug) ? now.filter((x) => x !== slug) : [...now, slug],
    );
  };

  return (
    <div className="space-y-8">
      {/* ─── Рамка: комплект и список проводок ─── */}
      {isFrame && (
        <>
          <label className="flex cursor-pointer items-start gap-3 border border-border p-4 transition-colors hover:border-foreground">
            <input
              type="checkbox"
              checked={!!form.wireIncluded}
              onChange={(e) => set('wireIncluded', e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-none accent-primary"
            />
            <span>
              <span className="font-head text-sm font-bold uppercase tracking-tight">
                Проводка уже в комплекте
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Рамка продаётся вместе с проводкой. При её выборе шаг
                «Подключение» пропускается — покупателю не предложат купить
                то, что уже лежит в коробке.
              </span>
            </span>
          </label>

          {!form.wireIncluded && (
            <div>
              <div className="font-head text-sm font-bold uppercase tracking-tight">
                Какие проводки подходят
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Покупатель выбирает рамку первой — по этому списку ему и
                подберут проводку. Показаны позиции на ту же машину с
                пересечением по годам.
              </p>

              {wireOptions.length > 6 && (
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию"
                  className="mt-3 w-full max-w-xs border-b border-border bg-transparent py-2 text-sm outline-none transition-colors focus:border-primary"
                />
              )}

              {wireOptions.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Подходящих проводок не нашлось. Проверьте совместимость и
                  годы — возможно, у проводки не указана эта модель.
                </p>
              ) : (
                <div className="mt-3 space-y-1.5">
                  {wireOptions.map((w) => (
                    <div
                      key={w.slug}
                      className="flex items-center gap-3 border border-border p-2 transition-colors hover:border-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={
                          form.frameWires?.includes(w.slug ?? '') ?? false
                        }
                        onChange={() => toggleWire(w.slug ?? '')}
                        className="h-4 w-4 flex-none accent-primary"
                      />
                      {/* Клик по фото уводит в карточку: правки признаков
                          делаются там, где они видны */}
                      <button
                        onClick={() => onOpen?.(w)}
                        title="Открыть карточку"
                        className="flex-none"
                      >
                        <img
                          src={w.images?.[0] ?? ''}
                          alt=""
                          loading="lazy"
                          className="h-11 w-11 bg-card object-contain transition-opacity hover:opacity-70"
                        />
                      </button>
                      <div className="min-w-0 flex-1 text-[0.82rem] leading-snug">
                        {w.name}
                        <div className="mt-0.5 text-[0.72rem] text-muted-foreground">
                          {w.yearFrom || '…'}–{w.yearTo || '…'} ·{' '}
                          {formatPrice(w.price)} ·{' '}
                          {KEYS.every((k) => (w.wireTech || {})[k]) ? (
                            <span className="text-success">признаки есть</span>
                          ) : (
                            <span className="text-primary">
                              признаки не заполнены
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── Проводка: признаки и где используется ─── */}
      {isWire && (
        <>
          <div>
            <div className="font-head text-sm font-bold uppercase tracking-tight">
              Чем отличается от других
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Когда к рамке подходит несколько проводок, выбрать нужную
              помогают эти три признака — по ним подбор и задаёт вопрос
              покупателю. «Неважно» значит, что вопрос не задаётся.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
              {WIRE_TECH.filter((t) => KEYS.includes(t.id)).map((t) => (
                <div key={t.id}>
                  <div className="text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
                    {t.label}
                  </div>
                  <div className="mt-1.5 flex">
                    {TECH_OPTS.map((o) => (
                      <button
                        key={o.id}
                        title={o.hint}
                        onClick={() => setTech(t.id, o.id)}
                        className={`border px-3 py-1.5 text-[0.72rem] transition-colors ${
                          tech[t.id] === o.id
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

          <div>
            <div className="font-head text-sm font-bold uppercase tracking-tight">
              К каким рамкам подходит
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Проставляется в карточке рамки. Здесь видно, где эта проводка
              уже используется — нажмите на фото, чтобы открыть рамку.
            </p>
            {usedByFrames.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Пока ни к одной рамке не привязана. Откройте нужную рамку и
                отметьте эту проводку в списке.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {usedByFrames.map((f) => (
                  <button
                    key={f.slug}
                    onClick={() => onOpen?.(f)}
                    title={f.name}
                    className="flex w-[13rem] items-center gap-2 border border-border p-2 text-left transition-colors hover:border-foreground"
                  >
                    <img
                      src={f.images?.[0] ?? ''}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 flex-none bg-card object-contain"
                    />
                    <span className="min-w-0 flex-1 text-[0.75rem] leading-tight">
                      <span className="line-clamp-2">{f.name}</span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {f.yearFrom || '…'}–{f.yearTo || '…'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!isFrame && !isWire && (
        <div className="flex items-start gap-2 border border-border bg-secondary/40 p-4">
          <Icon
            name="Info"
            size={16}
            className="mt-0.5 shrink-0 text-muted-foreground"
          />
          <p className="text-sm text-muted-foreground">
            Эта вкладка заполняется только у рамок и проводок. Смените
            категорию товара, если нужно настроить подключение.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductWiringTab;
