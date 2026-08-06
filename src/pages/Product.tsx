import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductGallery from '@/components/ProductGallery';
import ProductCard from '@/components/ProductCard';
import RequestDialog from '@/components/RequestDialog';
import GuideContent from '@/components/GuideContent';
import {
  Product as ProductType,
  Vehicle,
  formatPrice,
  isCompatible,
  productDescription,
  productImages,
  productKit,
  productSku,
  productSpecs,
  productsByCategory,
} from '@/data/catalog';
import { loadVehicle } from '@/lib/vehicle';
import { applySeo } from '@/lib/seo';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';

const Product = () => {
  const { id } = useParams();
  const { products, guides, loading } = useCatalog();
  const product = useMemo(
    () => products.find((p) => p.id === id) ?? null,
    [id, products],
  );

  const { add } = useCart();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [qty, setQty] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProduct, setDialogProduct] = useState<ProductType | null>(null);
  const [openGuides, setOpenGuides] = useState<string[]>([]);

  const toggleGuide = (slug: string) =>
    setOpenGuides((list) =>
      list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug],
    );

  useEffect(() => {
    setVehicle(loadVehicle());
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setQty(1);
    setOpenGuides([]);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const image = productImages(product)[0];
    const specs = productSpecs(product)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`)
      .join('. ');
    const brandNames = Object.keys(product.fits ?? {}).join(', ');
    const summary =
      productDescription(product)[0]?.slice(0, 240) ||
      `${product.name}. ${specs}`;

    applySeo({
      title: `${product.name} — купить, артикул ${productSku(product)} | ШТАТНО`,
      description: `${summary}${brandNames ? ` Совместимость: ${brandNames}.` : ''}`,
      image,
      type: 'product',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        sku: productSku(product),
        category: product.category,
        image: productImages(product),
        description: summary,
        brand: { '@type': 'Brand', name: 'ШТАТНО' },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          url: window.location.href,
        },
      },
    });
  }, [product]);

  const openRequest = (p: ProductType | null) => {
    setDialogProduct(p);
    setDialogOpen(true);
  };

  if (!product && loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="section-pad py-32 text-center text-muted-foreground">
          Загружаем карточку товара…
        </main>
        <Footer />
      </div>
    );
  }

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
  const related = productsByCategory(product, products);
  const productGuides = guides.filter((g) => g.products?.includes(product.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="section-pad anchor-offset">
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
                Артикул {productSku(product)} · {modelCount} совместимых моделей
              </div>

              {vehicle && fits ? (
                <div className="mt-6 flex items-center gap-4 border-2 border-success bg-success-soft px-5 py-4">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-success text-success-foreground">
                    <Icon name="Check" size={20} strokeWidth={3} />
                  </span>
                  <span>
                    <span className="block font-head text-[1.05rem] font-bold uppercase tracking-tight text-success">
                      Подходит к вашему автомобилю
                    </span>
                    <span className="mt-0.5 block text-[0.9rem] text-success">
                      {vehicle.brand} {vehicle.model}, {vehicle.year} г.
                    </span>
                  </span>
                </div>
              ) : (
                <div className="mt-6 flex items-start gap-3 border border-border px-4 py-3 text-[0.85rem] text-muted-foreground">
                  <Icon
                    name={vehicle ? 'CircleSlash' : 'Info'}
                    size={17}
                    className="mt-px flex-none"
                  />
                  <span>
                    {vehicle
                      ? `Не подходит к ${vehicle.brand} ${vehicle.model}, ${vehicle.year} г. — подберём аналог по вашему кузову.`
                      : `Подходит к автомобилям ${product.years[0]}—${product.years[1]} годов. Выберите машину в подборе, чтобы увидеть отметку совместимости.`}
                  </span>
                </div>
              )}

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

              {productGuides.length > 0 && (
                <button
                  onClick={() => {
                    setOpenGuides(productGuides.map((g) => g.slug));
                    setTimeout(
                      () =>
                        document
                          .getElementById('guide')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                      60,
                    );
                  }}
                  className="mt-4 flex w-full items-center justify-between border border-border px-5 py-4 transition-colors hover:border-primary hover:text-primary"
                >
                  <span className="flex items-center gap-3">
                    <Icon name="BookOpen" size={17} />
                    <span className="text-[0.9rem]">
                      Инструкция по установке с фото
                    </span>
                  </span>
                  <Icon name="ArrowDown" size={16} />
                </button>
              )}

              <dl className="mt-8 space-y-2 text-[0.85rem]">
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Крепление</dt>
                  <dd className="text-right">{product.mount}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Гарантия</dt>
                  <dd className="text-right">{product.warranty}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Артикул</dt>
                  <dd className="text-right">{productSku(product)}</dd>
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
                Список собран по штатным разъёмам и типу проводки для автомобилей{' '}
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

        {productGuides.length > 0 && (
          <section id="guide" className="section-pad anchor-offset">
            <div className="rule" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 py-10 md:grid-cols-12">
              <div className="md:col-span-6">
                <div className="eyebrow">Установка</div>
                <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                  Как это ставится
                </h2>
              </div>
              <p className="max-w-[34em] text-muted-foreground md:col-span-5 md:col-start-8 md:pt-9">
                Пошаговое техническое описание монтажа с фотографиями — прямо здесь, без
                перехода в отдельный раздел.
              </p>
            </div>

            {productGuides.map((g) => {
              const open = openGuides.includes(g.slug);
              const steps = g.blocks?.filter((b) => b.type === 'step').length ?? 0;
              return (
                <div key={g.slug} className="border-t border-foreground pb-12 pt-8">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-12">
                    <div className="md:col-span-7">
                      <h3 className="font-head text-xl font-medium tracking-tight">
                        {g.title}
                      </h3>
                      {g.excerpt && (
                        <p className="mt-3 max-w-[46em] text-muted-foreground">
                          {g.excerpt}
                        </p>
                      )}
                      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                        {steps > 0 && (
                          <span className="flex items-center gap-2">
                            <Icon name="ListOrdered" size={14} />
                            {steps} шагов
                          </span>
                        )}
                        {g.duration && (
                          <span className="flex items-center gap-2">
                            <Icon name="Clock" size={14} />
                            {g.duration}
                          </span>
                        )}
                        {g.difficulty && (
                          <span className="flex items-center gap-2">
                            <Icon name="Wrench" size={14} />
                            {g.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:col-span-4 md:col-start-9 md:justify-center">
                      <button
                        onClick={() => toggleGuide(g.slug)}
                        aria-expanded={open}
                        className={`flex items-center justify-between px-6 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.02em] transition-colors ${
                          open
                            ? 'border border-foreground hover:border-primary hover:text-primary'
                            : 'bg-primary text-primary-foreground hover:bg-foreground'
                        }`}
                      >
                        {open ? 'Свернуть инструкцию' : 'Показать инструкцию'}
                        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} />
                      </button>
                      <Link
                        to={`/guides/${g.slug}`}
                        className="flex items-center justify-between px-6 py-3 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                      >
                        Открыть отдельной страницей
                        <Icon name="ArrowUpRight" size={14} />
                      </Link>
                    </div>
                  </div>

                  {open && (
                    <div className="mt-10 animate-fade-in border-t border-border pt-8">
                      <GuideContent guide={g} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {related.length > 0 && (
          <section className="section-pad">
            <div className="rule" />
            <div className="py-10">
              <div className="eyebrow">Из этой же категории</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Похожее оборудование
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
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