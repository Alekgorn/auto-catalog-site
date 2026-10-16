import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Product, formatPrice, productImages } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import { usePrice } from '@/hooks/use-price';
import { useSeo } from '@/hooks/use-seo';
import { SITE_URL } from '@/lib/seo';
import { plural, screenLabel } from '@/lib/kit-filter';
import {
  buildReadyKit,
  isReadyKitFrame,
  kitVehicleTitle,
  readyKitPath,
} from '@/lib/ready-kit';

/** Подписи функций проводки, если в справочнике админки пусто */
const FEATURE_LABELS: Record<string, string> = {
  power: 'питание',
  sound: 'звук',
  wheel: 'кнопки руля',
  camera: 'штатная камера',
  can: 'CAN-шина',
  amp: 'штатный усилитель',
};

const inStock = (p: Product) => (p.stock ?? 0) > 0;

/** Заметка о сроке: в наличии — сегодня, иначе под заказ */
const StockNote = ({ p }: { p: Product }) =>
  inStock(p) ? (
    <span className="text-success">в наличии</span>
  ) : (
    <span className="text-muted-foreground">под заказ</span>
  );

/**
 * Готовый комплект «под ключ» на основе рамки.
 *
 * Покупатель сразу видит всё, что нужно для установки, и одну итоговую
 * цену. По умолчанию — самая дешёвая магнитола в наличии и самая простая
 * проводка; если хочется лучше, всё меняется здесь же, цена пересчитывается
 * на лету. В корзину комплект ложится обычными позициями — заказы и учёт
 * работают как раньше.
 */
const ReadyKitPage = () => {
  const { frameId = '' } = useParams();
  const { allProducts, loading, wireFeatures } = useCatalog();
  const { add, setOpen } = useCart();
  const { priceOf } = usePrice();

  const kit = useMemo(
    () => (isReadyKitFrame(frameId) ? buildReadyKit(frameId, allProducts) : null),
    [frameId, allProducts],
  );

  const [unitId, setUnitId] = useState('');
  const [wireId, setWireId] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  /* Выбор по умолчанию ставим, когда подъехал каталог */
  useEffect(() => {
    if (!kit) return;
    setUnitId((v) => v || kit.headunits[0]?.id || '');
    setWireId((v) => v || kit.wires[0]?.id || '');
  }, [kit]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [frameId]);

  const unit = kit?.headunits.find((p) => p.id === unitId) ?? kit?.headunits[0];
  const wire = kit?.wires.find((p) => p.id === wireId) ?? kit?.wires[0];
  const chosenExtras = (kit?.extras ?? []).filter((p) => extras.includes(p.id));

  const lines: Product[] = kit
    ? [kit.frame, ...(unit ? [unit] : []), ...(wire ? [wire] : []), ...chosenExtras]
    : [];
  const total = lines.reduce((a, p) => a + priceOf(p), 0);
  /* Остатки рамок не ведутся, поэтому рамка считается доступной всегда:
     срок комплекта определяют магнитола и проводка */
  const allInStock = lines.filter((p) => p.id !== kit?.frame.id).every(inStock);
  const countText = `${lines.length} ${plural(lines.length, 'позиция', 'позиции', 'позиций')}`;

  const car = kit ? kitVehicleTitle(kit.frame) : '';
  const size = kit ? screenLabel(kit.frame) : null;
  const fromPrice = kit
    ? priceOf(kit.frame) + priceOf(kit.headunits[0]) + (kit.wires[0] ? priceOf(kit.wires[0]) : 0)
    : 0;

  useSeo(
    kit
      ? {
          title: `Магнитола для ${car} под ключ — комплект от ${formatPrice(fromPrice)} · ШТАТНО`,
          description: `Готовый комплект для ${car}: Android-магнитола ${size ?? ''}, переходная рамка и проводка. Подходит без доработок, цена от ${formatPrice(fromPrice)}.`,
          image: productImages(kit.frame)[0],
          canonical: `${SITE_URL}${readyKitPath(kit.frame.id)}`,
        }
      : null,
  );

  const featureLabel = (id: string) =>
    wireFeatures.find((f) => f.id === id)?.label?.toLowerCase() ??
    FEATURE_LABELS[id] ??
    id;

  const addAll = () => {
    lines.forEach((p) => add(p, 1));
    setAdded(true);
    setOpen(true);
  };

  if (!kit) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="section-pad py-20 text-center">
          {loading ? (
            <div className="text-muted-foreground">Загружаем комплект…</div>
          ) : (
            <>
              <div className="font-head text-xl font-bold">Комплект не найден</div>
              <p className="mx-auto mt-3 max-w-[32em] text-[0.9rem] text-muted-foreground">
                Соберите комплект под свою машину в каталоге — это займёт пару минут.
              </p>
              <Link
                to="/catalog"
                className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.1em] text-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Открыть каталог
                <Icon name="ArrowRight" size={15} />
              </Link>
            </>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad py-8">
        <div className="mx-auto max-w-5xl">
          <div className="eyebrow">Готовый комплект</div>
          <h1 className="mt-1 font-head text-3xl font-bold uppercase leading-[1.05] tracking-[-0.02em] sm:text-4xl">
            Магнитола для {car} под ключ
          </h1>
          <p className="mt-3 max-w-[46em] text-[0.92rem] leading-relaxed text-muted-foreground">
            Всё для установки в одном заказе: Android-магнитола {size}, переходная
            рамка точно под панель и проводка в штатные разъёмы — без скруток и
            доработок. Магнитолу и проводку можно поменять ниже, цена пересчитается сразу.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-8">
              {/* Рамка — основа комплекта, её не меняем */}
              <section>
                <h2 className="eyebrow">1. Переходная рамка</h2>
                <ItemRow p={kit.frame} price={priceOf(kit.frame)} />
              </section>

              <section>
                <h2 className="eyebrow">2. Магнитола {size}</h2>
                <div className="mt-2 space-y-2">
                  {kit.headunits.map((p, i) => (
                    <OptionRow
                      key={p.id}
                      p={p}
                      price={priceOf(p)}
                      diff={priceOf(p) - priceOf(unit ?? p)}
                      selected={p.id === unit?.id}
                      badge={i === 0 ? 'Выгоднее всего' : undefined}
                      onSelect={() => setUnitId(p.id)}
                    />
                  ))}
                </div>
              </section>

              {kit.wireIncluded ? (
                <section>
                  <h2 className="eyebrow">3. Проводка</h2>
                  <p className="mt-2 border border-border px-4 py-3 text-[0.88rem]">
                    Проводка уже входит в рамку — докупать не нужно.
                  </p>
                </section>
              ) : (
                <section>
                  <h2 className="eyebrow">3. Проводка</h2>
                  <p className="mt-1 text-[0.8rem] text-muted-foreground">
                    Простой хватает для подключения. Если в машине есть штатная камера
                    или усилитель — выберите вариант с их поддержкой.
                  </p>
                  <div className="mt-2 space-y-2">
                    {kit.wires.map((p, i) => (
                      <OptionRow
                        key={p.id}
                        p={p}
                        price={priceOf(p)}
                        diff={priceOf(p) - priceOf(wire ?? p)}
                        selected={p.id === wire?.id}
                        badge={i === 0 ? 'Базовая' : undefined}
                        note={(p.wireFeatures ?? []).map(featureLabel).join(', ')}
                        onSelect={() => setWireId(p.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {kit.extras.length > 0 && (
                <section>
                  <h2 className="eyebrow">Дополнительно</h2>
                  <p className="mt-1 text-[0.8rem] text-muted-foreground">
                    Не обязательно — пригодится, чтобы сохранить штатную антенну или USB.
                  </p>
                  <div className="mt-2 space-y-2">
                    {kit.extras.map((p) => (
                      <OptionRow
                        key={p.id}
                        p={p}
                        price={priceOf(p)}
                        selected={extras.includes(p.id)}
                        check
                        onSelect={() =>
                          setExtras((v) =>
                            v.includes(p.id) ? v.filter((x) => x !== p.id) : [...v, p.id],
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Итог — на компьютере всегда на виду справа */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="border border-foreground p-5">
                <div className="eyebrow">В комплекте</div>
                <ul className="mt-3 space-y-2">
                  {lines.map((p) => (
                    <li key={p.id} className="flex items-start justify-between gap-3 text-[0.85rem]">
                      <span className="min-w-0 leading-snug">{p.name}</span>
                      <span className="flex-none font-medium">{formatPrice(priceOf(p))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <span className="eyebrow">Итого</span>
                  <span className="font-head text-3xl font-bold tracking-tight">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[0.8rem]">
                  <Icon
                    name={allInStock ? 'CircleCheck' : 'Clock'}
                    size={14}
                    className={allInStock ? 'text-success' : 'text-muted-foreground'}
                  />
                  {allInStock ? (
                    <span className="text-success">Всё в наличии — отправим сегодня</span>
                  ) : (
                    <span className="text-muted-foreground">Часть позиций под заказ, 1–3 дня</span>
                  )}
                </div>
                <button
                  onClick={addAll}
                  className={`mt-4 flex w-full items-center justify-between px-5 py-4 font-head text-[0.88rem] font-bold uppercase tracking-[0.02em] transition-colors ${
                    added
                      ? 'bg-success text-success-foreground'
                      : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  {added ? 'Комплект в корзине' : 'Купить комплект'}
                  <Icon name={added ? 'Check' : 'ShoppingCart'} size={18} />
                </button>
                <p className="mt-3 text-[0.76rem] leading-snug text-muted-foreground">
                  В корзину ляжет {countText} — их можно поменять или убрать
                  перед заказом.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* На телефоне итог уезжает под список магнитол — держим цену и
          кнопку внизу экрана, чтобы видеть, как меняется сумма */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-foreground bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="min-w-0 flex-1">
          <div className="text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
            Комплект · {countText}
          </div>
          <div className="font-head text-xl font-bold leading-tight tracking-tight">
            {formatPrice(total)}
          </div>
        </div>
        <button
          onClick={addAll}
          className={`flex flex-none items-center gap-2 px-4 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.02em] transition-colors ${
            added
              ? 'bg-success text-success-foreground'
              : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          {added ? 'В корзине' : 'Купить'}
          <Icon name={added ? 'Check' : 'ShoppingCart'} size={16} />
        </button>
      </div>
      {/* Место под нижнюю панель, чтобы она не закрывала подвал */}
      <div className="h-20 lg:hidden" />
      <Footer />
    </div>
  );
};

/** Основа комплекта — рамка. Не меняется и всегда считается доступной */
const ItemRow = ({ p, price }: { p: Product; price: number }) => (
  <div className="mt-2 flex items-center gap-4 border border-border p-3">
    <img
      src={productImages(p)[0]}
      alt=""
      loading="lazy"
      className="h-16 w-16 flex-none bg-surface-muted object-contain"
    />
    <div className="min-w-0 flex-1">
      <Link
        to={`/product/${p.id}`}
        className="text-[0.9rem] font-medium leading-snug transition-colors hover:text-primary"
      >
        {p.name}
      </Link>
      <div className="mt-0.5 text-[0.75rem] text-muted-foreground">
        Точно под панель этой машины
      </div>
    </div>
    <div className="flex-none font-head text-lg font-bold">{formatPrice(price)}</div>
  </div>
);

interface OptionProps {
  p: Product;
  price: number;
  /** Разница с выбранным — «+6 140 ₽» */
  diff?: number;
  selected: boolean;
  badge?: string;
  note?: string;
  /** Галочка вместо переключателя — для необязательных допов */
  check?: boolean;
  onSelect: () => void;
}

/** Вариант на выбор: магнитола, проводка или доп */
const OptionRow = ({ p, price, diff, selected, badge, note, check, onSelect }: OptionProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex w-full items-center gap-3 border p-3 text-left transition-colors ${
      selected ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground'
    }`}
  >
    <span
      className={`flex h-5 w-5 flex-none items-center justify-center border-2 ${
        check ? '' : 'rounded-full'
      } ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50'}`}
    >
      {selected && <Icon name="Check" size={12} strokeWidth={3} />}
    </span>
    <img
      src={productImages(p)[0]}
      alt=""
      loading="lazy"
      className="h-14 w-14 flex-none bg-surface-muted object-contain"
    />
    <span className="min-w-0 flex-1">
      <span className="block text-[0.86rem] font-medium leading-snug">{p.name}</span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.74rem]">
        {badge && (
          <span className="bg-foreground px-1.5 py-0.5 uppercase tracking-[0.08em] text-background">
            {badge}
          </span>
        )}
        <StockNote p={p} />
        {note && <span className="text-muted-foreground">· {note}</span>}
      </span>
    </span>
    <span className="flex-none text-right">
      <span className="block font-head text-[1rem] font-bold">{formatPrice(price)}</span>
      {!selected && diff !== undefined && diff !== 0 && (
        <span className="block text-[0.72rem] text-muted-foreground">
          {diff > 0 ? '+' : '−'}
          {formatPrice(Math.abs(diff))}
        </span>
      )}
    </span>
  </button>
);

export default ReadyKitPage;
