import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatPrice, productImages } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import { usePrice } from '@/hooks/use-price';
import { useVehicle } from '@/hooks/use-vehicle';
import { isVehicle } from '@/lib/vehicle';
import { readShareParams } from '@/lib/share-kit';
import { SITE_URL } from '@/lib/seo';
import { useSeo } from '@/hooks/use-seo';

/**
 * Присланная сборка.
 *
 * Открывается по ссылке из мессенджера: состав лежит прямо в адресе, ничего
 * не хранится и не протухает. Машину из ссылки сразу ставим себе — иначе
 * получатель попадал бы на пустой фильтр и половина пересылок умирала бы
 * на первом экране.
 */
const SharedKit = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { allProducts, loading } = useCatalog();
  const { add, setOpen } = useCart();
  const { priceOf } = usePrice();
  const { vehicle, setVehicle } = useVehicle();
  const [added, setAdded] = useState(false);

  const shared = useMemo(() => readShareParams(search), [search]);

  useSeo({
    title: 'Присланный комплект · ШТАТНО',
    description:
      'Состав комплекта с ценами: магнитола, переходная рамка и проводка под конкретный автомобиль.',
    canonical: `${SITE_URL}/sborka`,
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  /* Машина из ссылки важнее своей: человек открыл чужую подборку и
     должен увидеть её такой, какой её собирали */
  useEffect(() => {
    if (isVehicle(shared.vehicle)) setVehicle(shared.vehicle);
    // setVehicle пересоздаётся на каждый рендер, в зависимости не берём
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared.vehicle?.brand, shared.vehicle?.model, shared.vehicle?.year]);

  const items = useMemo(
    () =>
      shared.lines
        .map((l) => {
          const product = allProducts.find((p) => p.id === l.id);
          return product ? { product, qty: l.qty } : null;
        })
        .filter((x): x is { product: (typeof allProducts)[0]; qty: number } => !!x),
    [shared.lines, allProducts],
  );

  /** Позиции, которых уже нет в каталоге — о них честно предупреждаем */
  const missing = shared.lines.length - items.length;
  const total = items.reduce((a, i) => a + priceOf(i.product) * i.qty, 0);

  const car = isVehicle(shared.vehicle) ? shared.vehicle : vehicle;

  const addAll = () => {
    items.forEach((i) => add(i.product, i.qty));
    setAdded(true);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-pad py-8">
        <div className="mx-auto max-w-2xl">
          <div className="eyebrow">Вам прислали подборку</div>
          <h1 className="mt-1 font-head text-2xl font-bold uppercase leading-tight tracking-tight sm:text-3xl">
            {items.length === 1 ? 'Товар' : 'Комплект'}
            {isVehicle(car) && (
              <>
                {' '}
                для {car.brand} {car.model}, {car.year} г.
              </>
            )}
          </h1>

          {loading && items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              Загружаем каталог…
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="font-head text-xl font-bold">
                Ссылка не открылась
              </div>
              <p className="mx-auto mt-3 max-w-[32em] text-[0.9rem] leading-relaxed text-muted-foreground">
                Похоже, ссылка неполная или товары из неё уже разобрали.
                Соберите комплект под свою машину — это займёт пару минут.
              </p>
              <Link
                to="/scenario/vse-po-mashine"
                className="mt-6 inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[0.8rem] uppercase tracking-[0.1em] text-background transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Открыть каталог
                <Icon name="ArrowRight" size={15} />
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 divide-y divide-border border-y border-border">
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-4 py-4">
                    <img
                      src={productImages(product)[0]}
                      alt=""
                      loading="lazy"
                      className="h-20 w-20 flex-none bg-surface-muted object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${product.id}`}
                        className="text-[0.92rem] font-medium leading-snug transition-colors hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <div className="mt-1 text-[0.78rem] uppercase tracking-[0.08em] text-muted-foreground">
                        {product.category}
                        {qty > 1 && ` · ${qty} шт.`}
                      </div>
                    </div>
                    <div className="flex-none font-head text-lg font-bold tracking-tight">
                      {formatPrice(priceOf(product) * qty)}
                    </div>
                  </div>
                ))}
              </div>

              {missing > 0 && (
                <p className="mt-3 text-[0.8rem] text-muted-foreground">
                  {missing}{' '}
                  {missing === 1 ? 'позиция из ссылки больше не продаётся' : 'позиции из ссылки больше не продаются'}{' '}
                  — подберём замену при заказе.
                </p>
              )}

              <div className="mt-5 flex items-end justify-between">
                <span className="eyebrow">Итого</span>
                <span className="font-head text-3xl font-bold tracking-tight">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                onClick={addAll}
                className={`mt-5 flex w-full items-center justify-between px-6 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.02em] transition-colors ${
                  added
                    ? 'bg-success text-success-foreground'
                    : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {added ? 'Комплект в заказе' : 'Взять весь комплект'}
                <Icon name={added ? 'Check' : 'ShoppingCart'} size={18} />
              </button>

              {/* Получатель может быть не согласен с чужим выбором —
                  даём прямой путь пересобрать под ту же машину */}
              <button
                onClick={() => navigate(`/scenario/${shared.slug || 'vse-po-mashine'}`)}
                className="mt-3 flex w-full items-center justify-center gap-2 border border-foreground px-6 py-3.5 font-head text-[0.82rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
              >
                Изменить состав
                <Icon name="ArrowRight" size={16} />
              </button>

              <p className="mt-4 text-[0.8rem] leading-relaxed text-muted-foreground">
                Цены актуальны на сегодня. Совместимость с вашей машиной
                подтвердим при обработке заявки — если что-то не подойдёт,
                заменим бесплатно.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharedKit;