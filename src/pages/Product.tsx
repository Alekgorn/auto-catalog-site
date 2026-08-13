import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGallery from "@/components/ProductGallery";
import FitsCheck from "@/components/FitsCheck";
import ProductCard from "@/components/ProductCard";
import RequestDialog from "@/components/RequestDialog";
import ProductTabs, { ProductTab } from "@/components/ProductTabs";
import {
  Product as ProductType,
  Vehicle,
  productDescription,
  productImages,
  productKit,
  productSku,
  productSpecs,
  productsByCategory,
} from "@/data/catalog";
import { loadVehicle } from "@/lib/vehicle";
import { SITE_URL } from "@/lib/seo";
import { slugify } from "@/lib/slug";
import { useSeo } from "@/hooks/use-seo";
import { useCart } from "@/context/CartContext";
import PriceBlock from "@/components/PriceBlock";
import MarketButtons from "@/components/MarketButtons";
import { useCatalog } from "@/context/CatalogContext";
import Breadcrumbs, { crumbsJsonLd } from "@/components/Breadcrumbs";

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
  const [tab, setTab] = useState<ProductTab>("about");

  useEffect(() => {
    setVehicle(loadVehicle());
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
            { label: "Каталог", to: "/#catalog" },
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

  const brands = Object.entries(product.fits);
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
  const related = productsByCategory(product, products);
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
              </div>

              <FitsCheck
                product={product}
                vehicle={vehicle}
                onVehicle={setVehicle}
                onRequest={() => openRequest(product)}
              />

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

              <MarketButtons product={product} />

              {productGuides.length > 0 && (
                <button
                  onClick={() => {
                    setTab("guides");
                    setTimeout(
                      () =>
                        document.getElementById("about")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        }),
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

        {related.length > 0 && (
          <section className="section-pad">
            <div className="rule" />
            <div className="py-10">
              <div className="eyebrow">Из этой же категории</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
                Похожее оборудование
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-16 sm:gap-6 lg:grid-cols-3">
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