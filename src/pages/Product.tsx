import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGallery from '@/components/ProductGallery';
import ProductCard from '@/components/ProductCard';
import RequestDialog from '@/components/RequestDialog';
import {
  PRODUCTS,
  Product as ProductType,
  Vehicle,
  formatPrice,
  isCompatible,
  productDescription,
  productImages,
  productKit,
  productSpecs,
  productsByCategory,
} from '@/data/catalog';
import { loadVehicle } from '@/lib/vehicle';
import { useCart } from '@/context/CartContext';

const Product = () => {
  const { id } = useParams();
  const product = useMemo(() => PRODUCTS.find((p) => p.id === id) ?? null, [id]);

  const { add } = useCart();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [qty, setQty] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProduct, setDialogProduct] = useState<ProductType | null>(null);

  useEffect(() => {
    setVehicle(loadVehicle());
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setQty(1);
  }, [id]);

  const openRequest = (p: ProductType | null) => {
    setDialogProduct(p);
    setDialogOpen(true);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="section-pad py-32 text-center">
          <div className="font-head text-3xl font-bold uppercase tracking-tight">
            Товар не найден
          </div>
          <p className="mx-auto mt-4 max-w-[30em] text-muted-foreground">
            Возможно, позиция снята с продажи. Вернитесь в каталог и выберите оборудование
            под вашу машину.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 border border-foreground px-6 py-4 font-head text-[0.85rem] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
          >
            В каталог
            <Icon name="ArrowRight" size={16} />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const fits = isCompatible(product, vehicle);
  const brands = Object.entries(product.fits);
  const modelCount = brands.reduce((acc, [, m]) => acc + m.length, 0);
  const related = productsByCategory(product);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="section-pad scroll-mt-[76px]">
          <div className="flex flex-wrap items-center gap-2 py-6 text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-primary">
              Главная
            </Link>
            <Icon name="ChevronRight" size={13} />
            <Link to="/#catalog" className="transition-colors hover:text-primary">
              Каталог
            </Link>
            <Icon name="ChevronRight" size={13} />
            <span className="text-foreground">{product.category}</span>
          </div>

          <div className="rule" />

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 py-10 lg:grid-cols-12 lg:py-14">
            <div className="lg:col-span-6">
              <ProductGallery images={productImages(product)} alt={product.name} />
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <div className="flex items-center justify-between gap-4">
                <span className="eyebrow">{product.category}</span>
                {product.badge && (
                  <span className="bg-primary px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-primary-foreground">
                    {product.badge}
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-head text-3xl font-bold uppercase leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-3 text-[0.8rem] uppercase tracking-[0.12em] text-muted-foreground">
                Артикул {product.id.toUpperCase()} · {modelCount} совместимых моделей
              </div>

              <div
                className={`mt-6 flex items-start gap-3 border px-4 py-3 text-[0.85rem] ${
                  vehicle
                    ? fits
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Icon
                  name={vehicle ? (fits ? 'CircleCheck' : 'CircleSlash') : 'Info'}
                  size={17}
                  className="mt-px flex-none"
                />
                <span>
                  {vehicle
                    ? fits
                      ? `Подходит: ${vehicle.brand} ${vehicle.model}, ${vehicle.year} г.`
                      : `Не подходит к ${vehicle.brand} ${vehicle.model}, ${vehicle.year} г. — подберём аналог по вашему кузову.`
                    : `Подходит к автомобилям ${product.years[0]}—${product.years[1]} годов. Выберите машину в подборе, чтобы увидеть отметку совместимости.`}
                </span>
              </div>

              <div className="mt-8 flex items-end gap-4">
                {product.oldPrice && (
                  <span className="pb-1 text-base text-muted-foreground line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                <span className="font-head text-4xl font-bold tracking-tight">
                  {formatPrice(product.price)}
                </span>
              </div>
              <div className="mt-2 text-[0.85rem] text-muted-foreground">
                Цена с установкой в нашем сервисе — по расчёту при подтверждении заявки.
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center border border-foreground">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Меньше"
                    className="px-4 py-4 transition-colors hover:text-primary"
                  >
                    <Icon name="Minus" size={16} />
                  </button>
                  <span className="min-w-[3rem] text-center font-head text-lg font-bold">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    aria-label="Больше"
                    className="px-4 py-4 transition-colors hover:text-primary"
                  >
                    <Icon name="Plus" size={16} />
                  </button>
                </div>
                <button
                  onClick={() => add(product, qty)}
                  className="flex flex-1 items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.02em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Добавить в заказ
                  <Icon name="ShoppingCart" size={18} />
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => openRequest(product)}
                  className="flex flex-1 items-center justify-center gap-2 border border-foreground px-6 py-4 font-head text-[0.9rem] font-medium uppercase tracking-[0.02em] transition-colors hover:border-primary hover:text-primary"
                >
                  Купить в 1 клик
                </button>
                <a
                  href="tel:+78003334455"
                  className="flex items-center justify-center gap-2 border border-foreground px-6 py-4 font-head text-[0.9rem] font-medium uppercase tracking-[0.02em] transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name="Phone" size={16} />
                  Позвонить
                </a>
              </div>

              <dl className="mt-8 space-y-2 text-[0.85rem]">
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Крепление</dt>
                  <dd className="text-right">{product.mount}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Установка</dt>
                  <dd className="text-right">{product.install}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Гарантия</dt>
                  <dd className="text-right">{product.warranty}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="section-pad">
          <div className="rule" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="eyebrow">Описание</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Как это устроено
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                {productDescription(product).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="mt-8">
                <div className="eyebrow">Комплектация</div>
                <ul className="mt-4 space-y-2">
                  {productKit(product).map((k) => (
                    <li
                      key={k}
                      className="flex items-start gap-3 border-b border-border pb-2 text-[0.9rem]"
                    >
                      <Icon
                        name="Check"
                        size={15}
                        className="mt-1 flex-none text-primary"
                      />
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <div className="eyebrow">Характеристики</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Технические данные
              </h2>
              <dl className="mt-6 text-[0.9rem]">
                {productSpecs(product).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-6 border-b border-border py-3"
                  >
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="section-pad">
          <div className="rule" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 py-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="eyebrow">Совместимость</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Подходит к {modelCount} моделям
              </h2>
              <p className="mt-5 max-w-[32em] text-muted-foreground">
                Список составлен по штатным точкам крепления кузова для автомобилей{' '}
                {product.years[0]}—{product.years[1]} годов выпуска. Если вашей модели нет
                в списке — оставьте заявку, проверим по VIN и предложим аналог.
              </p>
              <button
                onClick={() => openRequest(product)}
                className="mt-7 inline-flex items-center gap-2 border border-foreground px-6 py-4 font-head text-[0.85rem] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
              >
                Проверить мою машину
                <Icon name="ArrowRight" size={16} />
              </button>
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {brands.map(([brand, models]) => (
                  <div key={brand} className="border-t border-foreground py-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-head text-lg font-bold uppercase tracking-tight">
                        {brand}
                      </div>
                      <span className="text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground">
                        {models.length} мод.
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {models.map((m) => {
                        const current =
                          vehicle && vehicle.brand === brand && vehicle.model === m;
                        return (
                          <li
                            key={m}
                            className={`flex items-center gap-2 text-[0.88rem] ${
                              current ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            <Icon
                              name={current ? 'CircleCheck' : 'Minus'}
                              size={13}
                              className="flex-none"
                            />
                            {m}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="section-pad">
            <div className="rule" />
            <div className="py-10">
              <div className="eyebrow">Из этой же категории</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Похожее оборудование
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 pb-16 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} vehicle={vehicle} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <RequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={dialogProduct}
        vehicle={vehicle}
      />
    </div>
  );
};

export default Product;