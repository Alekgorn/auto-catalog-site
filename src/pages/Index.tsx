import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Selection from "@/components/Selection";
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
  const navigate = useNavigate();
  const { brands: BRANDS } = useCatalog();
  const saved = loadVehicle();

  const [brand, setBrand] = useState(saved?.brand ?? BRANDS[0]?.name ?? "");
  const [model, setModel] = useState(
    saved?.model ?? BRANDS[0]?.models[0] ?? "",
  );
  const [year, setYear] = useState(String(saved?.year ?? 2021));

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

  useEffect(() => {
    if (!BRANDS.length) return;
    const found = BRANDS.find((b) => b.name === brand);
    if (!found) {
      setBrand(BRANDS[0].name);
      setModel(BRANDS[0].models[0] ?? "");
    } else if (!found.models.includes(model)) {
      setModel(found.models[0] ?? "");
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
   * Подобрали машину — открываем каталог со всем оборудованием.
   * Каталог теперь живёт в сценарии, а не на главной.
   */
  const applyVehicle = () => {
    const next = { brand, model, year: Number(year) };
    setVehicle(next);
    saveVehicle(next);
    navigate("/scenario/vse-po-mashine");
  };

  const applyPhotoVehicle = (v: Vehicle) => {
    setBrand(v.brand);
    setModel(v.model);
    setYear(String(v.year));
    setVehicle(v);
    saveVehicle(v);
    navigate("/scenario/vse-po-mashine");
  };

  const selectorProps = {
    brand,
    model,
    year,
    onBrand: setBrand,
    onModel: setModel,
    onYear: setYear,
    onSubmit: applyVehicle,
    onPhoto: applyPhotoVehicle,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Selection {...selectorProps} />
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
