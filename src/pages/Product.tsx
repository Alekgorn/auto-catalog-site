import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import FitsCheck from "@/components/FitsCheck";
import ProductRelated from "@/components/ProductRelated";
import RequestDialog from "@/components/RequestDialog";
import ProductTabs, { ProductTab } from "@/components/ProductTabs";
import {
  Product as ProductType,
  Vehicle,
  formatPrice,
  productDescription,
  productImages,
  productKit,
  productSku,
  productSpecs,
  productsByCategory,
  productsWithThis,
} from "@/data/catalog";
import { VEHICLE_EVENT, loadVehicle } from "@/lib/vehicle";
import { telHref } from "@/lib/site-settings";
import {
  DELIVERY_FROM,
  FREE_ALL_FROM,
  FREE_FROM,
} from "@/lib/delivery";
import { SITE_URL } from "@/lib/seo";
import { slugify } from "@/lib/slug";
import { useSeo } from "@/hooks/use-seo";
import { useKit } from "@/context/KitContext";
import { useCart } from "@/context/CartContext";
import PriceBlock from "@/components/PriceBlock";
import StockLine from "@/components/StockLine";
import MarketButtons from "@/components/MarketButtons";
import { useCatalog } from "@/context/CatalogContext";
import Breadcrumbs, { crumbsJsonLd } from "@/components/Breadcrumbs";

const Product = () => {
  const { id } = useParams();
  // Сам товар ищем в полном каталоге: по прямой ссылке страница должна
  // открыться, даже если дилер включил фильтр наличия
  const { products, allProducts, guides, contacts, loading } = useCatalog();
  const product = useMemo(
    () => allProducts.find((p) => p.id === id) ?? null,
    [id, allProducts],
  );

  /*
   * Сборка комплекта — особый режим: товар отмечается на своём шаге,
   * а не уходит в корзину. Но только если сборка реально начата.
   * Без этой проверки кнопка на обычной странице товара молча клала
   * позицию в сборку, которую нигде не видно, — покупатель жал
   * «Добавить в заказ», и как будто ничего не происходило.
   */
  const { pick: pickKit, has: inKit, steps: kitSteps } = useKit();
  const { add: addToCart, has: inCart, setOpen: openCart } = useCart();
  const kitMode = kitSteps.some((s) => s.category === product?.category);
  const chosen = kitMode ? inKit(product?.id ?? '') : inCart(product?.id ?? '');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [qty, setQty] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProduct, setDialogProduct] = useState<ProductType | null>(null);
  const [tab, setTab] = useState<ProductTab>("about");

  /* Машину могли сменить плашкой в шапке — обновляем отметку совместимости */
  useEffect(() => {
    const sync = () => setVehicle(loadVehicle());
    sync();
    window.addEventListener(VEHICLE_EVENT, sync);
    return () => window.removeEventListener(VEHICLE_EVENT, sync);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setQty(1);
    setTab("about");
  }, [id]);

  const crumbs = useMemo(
    () =>
      product
        ? [
            { label: "Каталог", to: "/scenario/vse-po-mashine" },
            {
              label: product.category,
              to: `/catalog/${slugify(product.category)}`,
            },
            { label: product.name },
          ]
        : [],
    [product],
  );

  const seo = useMemo(() => {
    if (!product) return null;
    const specs = productSpecs(product)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`)
      .join(". ");
    const brandNames = Object.keys(product.fits ?? {}).join(", ");
    const summary =
      productDescription(product)[0]?.slice(0, 240) ||
      `${product.name}. ${specs}`;
    const url = `${SITE_URL}/product/${product.id}`;

    return {
      title: `${product.name} — купить, артикул ${productSku(product)} | ШТАТНО`,
      description: `${summary}${brandNames ? ` Совместимость: ${brandNames}.` : ""}`,
      image: productImages(product)[0],
      canonical: url,
      type: "product" as const,
      jsonLd: [
        crumbsJsonLd(crumbs),
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: productSku(product),
          category: product.category,
          image: productImages(product),
          description: summary,
          brand: { "@type": "Brand", name: "ШТАТНО" },
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            url,
          },
        },
      ],
    };
  }, [product, crumbs]);

  useSeo(seo);

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
            Возможно, позиция снята с продажи. Вернитесь в каталог и выберите
            оборудование под вашу машину.
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

  const brands = Object.entries(product.fits ?? {});
  const modelCount = brands.reduce((acc, [, m]) => acc + m.length, 0);

  // Гарантия и артикул показываются только здесь — дублировать их у кнопок не нужно
  const specs = (() => {
    const base = productSpecs(product);
    const has = (k: string) => base.some(([n]) => n.toLowerCase() === k);
    const extra: [string, string][] = [];
    if (!has("гарантия")) extra.push(["Гарантия", product.warranty]);
    if (!has("артикул")) extra.push(["Артикул", productSku(product)]);
    return [...base, ...extra];
  })();
  /* Берём с запасом: в блоке видно 4, остальное раскрывается кнопкой */
  const related = productsByCategory(product, products, 24);
  const withThis = productsWithThis(product, products, 24);
  const productGuides = guides.filter((g) => g.products?.includes(product.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="section-pad anchor-offset">
          <Breadcrumbs items={crumbs} />

          <div className="rule" />

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 py-10 lg:grid-cols-12 lg:py-14">
            <div className="lg:col-span-5">
              <ProductGallery
                images={productImages(product)}
                alt={product.name}
              />
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <div className="flex items-center justify-between gap-4">
                <Link
                  to={`/catalog/${slugify(product.category)}`}
                  className="eyebrow transition-colors hover:text-primary"
                >
                  {product.category}
                </Link>
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
                {modelCount} совместимых моделей
              </div>

              <div className="mt-8">
                <PriceBlock product={product} large />
                <StockLine product={product} large />
              </div>

              <FitsCheck
                product={product}
                vehicle={vehicle}
                onVehicle={setVehicle}
                onRequest={() => openRequest(product)}
              />

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {/* В сборке количество не выбирают: на шаг встаёт одна
                    позиция, счётчик там только путал бы */}
                <div
                  className={`items-center border border-foreground ${
                    kitMode ? "hidden" : "flex"
                  }`}
                >
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
                  onClick={() => {
                    if (kitMode) {
                      pickKit(product);
                      return;
                    }
                    // Кладём выбранное количество и сразу открываем корзину:
                    // иначе непонятно, куда делся товар
                    addToCart(product, qty);
                    openCart(true);
                  }}
                  className="flex flex-1 items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.02em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {kitMode
                    ? chosen
                      ? "Выбрано в комплект"
                      : "Выбрать в комплект"
                    : chosen
                      ? "В корзине — открыть"
                      : "В корзину"}
                  <Icon name={chosen ? "Check" : "Plus"} size={18} />
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
                  href={telHref(contacts.phone)}
                  className="flex items-center justify-center gap-2 border border-foreground px-6 py-4 font-head text-[0.9rem] font-medium uppercase tracking-[0.02em] transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name="Phone" size={16} />
                  Позвонить
                </a>
              </div>

              <MarketButtons product={product} />

              {/*
                Точную стоимость доставки заранее не знаем — город и способ
                выбираются позже. Но неопределённость пугает сильнее цифры,
                поэтому показываем правило: порог и нижнюю границу
              */}
              <div className="mt-5 border border-border bg-surface p-4">
                <div className="flex items-start gap-2.5">
                  <Icon
                    name="Truck"
                    size={17}
                    className="mt-0.5 flex-none text-primary"
                  />
                  <div className="min-w-0 text-[0.85rem] leading-relaxed">
                    <span className="font-medium">
                      Доставка бесплатно от {formatPrice(FREE_FROM)}
                    </span>
                    <span className="text-muted-foreground">
                      {' '}— в пункт выдачи Ozon, WB или Яндекс.Маркета. Курьером
                      по СПб и через СДЭК — бесплатно от {formatPrice(FREE_ALL_FROM)},
                      с оплатой при получении.
                    </span>
                    <div className="mt-1.5 text-[0.78rem] text-muted-foreground">
                      Заказ меньше — доставка от {formatPrice(DELIVERY_FROM)},
                      точную сумму назовём при подтверждении.
                    </div>
                    <Link
                      to="/#delivery"
                      className="mt-2 inline-flex items-center gap-1.5 text-[0.8rem] font-medium underline-offset-4 hover:text-primary hover:underline"
                    >
                      Все способы доставки
                      <Icon name="ArrowRight" size={13} />
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section id="about" className="section-pad anchor-offset">
          <div className="rule" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="eyebrow">Описание</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Всё о товаре
              </h2>
              <div className="mt-6">
                <ProductTabs
                  product={product}
                  guides={productGuides}
                  active={tab}
                  onChange={setTab}
                />
              </div>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <div className="eyebrow">Характеристики</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Технические данные
              </h2>
              <dl className="mt-6 text-[0.9rem]">
                {specs.map(([k, v]) => (
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

        {/* Похожее — тот же раздел и те же машины. Нет подходящего —
            блока не будет вовсе, пустой заголовок только мешает */}
        <ProductRelated
          eyebrow="Из этой же категории"
          title="Похожее оборудование"
          items={related}
          vehicle={vehicle}
        />

        {/* Что берут вместе: рамка и проводка к магнитоле — из других
            разделов, но на те же марки и модели */}
        <ProductRelated
          eyebrow="Подходит к этой же машине"
          title="С этим товаром покупают"
          items={withThis}
          vehicle={vehicle}
        />
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