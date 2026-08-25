import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Selection from "@/components/Selection";
import NewArrivals from "@/components/NewArrivals";
import HowToBuy from "@/components/HowToBuy";
import Faq from "@/components/Faq";
import Contacts from "@/components/Contacts";
import Footer from "@/components/Footer";
import RequestDialog from "@/components/RequestDialog";
import { Product, Vehicle } from "@/data/catalog";
import { loadVehicle, saveVehicle } from "@/lib/vehicle";
import { SITE_URL } from "@/lib/seo";
import { useSeo } from "@/hooks/use-seo";
import { useCatalog } from "@/context/CatalogContext";

const Index = () => {
  const location = useLocation();
  const { brands: BRANDS } = useCatalog();
  const saved = loadVehicle();

  /**
   * Поля пустые, пока человек сам не выберет. Раньше здесь по умолчанию
   * стояла первая марка из списка — покупатель на своей машине видел чужую
   * и мог нажать «Подобрать» не глядя, получив не свой результат.
   */
  const [brand, setBrand] = useState(saved?.brand ?? "");
  const [model, setModel] = useState(saved?.model ?? "");
  const [year, setYear] = useState(saved?.year ? String(saved.year) : "");

  const [vehicle, setVehicle] = useState<Vehicle | null>(saved);

  useEffect(() => {
    saveVehicle(vehicle);
  }, [vehicle]);

  useSeo({
    title: "ШТАТНО — Android-магнитолы, камеры и жгуты по модели авто",
    description:
      "Android-магнитолы, камеры заднего вида, регистраторы, переходные жгуты ISO, CAN-адаптеры и рамки. Подбор по марке, модели и году выпуска.",
    canonical: `${SITE_URL}/`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Store",
      name: "ШТАТНО",
      url: SITE_URL,
      description:
        "Автоэлектроника и комплектующие: Android-магнитолы, камеры, регистраторы, переходные жгуты и рамки.",
      telephone: "+7 800 333-44-55",
      email: "zakaz@shtatno.ru",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Москва",
        streetAddress: "Кировоградская, 24, стр. 3",
        addressCountry: "RU",
      },
      openingHours: "Mo-Sa 09:00-20:00",
    },
  });

  /**
   * Марку не подставляем — пустое поле заставляет выбрать свою машину.
   * Следим только за тем, чтобы модель не осталась от прежней марки.
   */
  useEffect(() => {
    if (!BRANDS.length || !brand) return;
    const found = BRANDS.find((b) => b.name === brand);
    if (!found) {
      setBrand("");
      setModel("");
    } else if (model && !found.models.includes(model)) {
      setModel("");
    }
  }, [BRANDS, brand, model]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      setTimeout(
        () =>
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80,
      );
    }
  }, [location.hash]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeProduct] = useState<Product | null>(null);

  /**
   * Подобрали машину — плавно ведём к сценариям.
   * Уводить сразу на страницу каталога рано: человек ещё не сказал,
   * какую задачу решает, поэтому сначала показываем выбор задачи.
   */
  const applyVehicle = () => {
    // Без всех трёх полей подбор врёт — молча ничего не делаем
    if (!brand || !model || !year) return;
    const next = { brand, model, year: Number(year) };
    setVehicle(next);
    saveVehicle(next);
    // Ждём кадр: блок сценариев перерисуется под новую машину,
    // и только после этого его позиция на странице окончательная
    requestAnimationFrame(() =>
      document
        .getElementById("scenarios")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const selectorProps = {
    brand,
    model,
    year,
    onBrand: setBrand,
    onModel: setModel,
    onYear: setYear,
    onSubmit: applyVehicle,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Подбор по машине — главное преимущество, поэтому идёт
            сразу под заголовком, до поиска и сценариев */}
        <Hero selection={<Selection {...selectorProps} />} />
        <NewArrivals vehicle={vehicle} />
        <HowToBuy />
        <Faq />
        <Contacts />
      </main>
      <Footer />
      <RequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={activeProduct}
        vehicle={vehicle}
      />
    </div>
  );
};

export default Index;