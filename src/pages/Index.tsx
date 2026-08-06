import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Catalog from '@/components/Catalog';
import Selection from '@/components/Selection';
import Prices from '@/components/Prices';
import Install from '@/components/Install';
import Faq from '@/components/Faq';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import RequestDialog from '@/components/RequestDialog';
import { BRANDS, Product, Vehicle } from '@/data/catalog';

const Index = () => {
  const [brand, setBrand] = useState(BRANDS[0].name);
  const [model, setModel] = useState(BRANDS[0].models[0]);
  const [year, setYear] = useState('2021');

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const applyVehicle = () => {
    setVehicle({ brand, model, year: Number(year) });
    setTimeout(
      () =>
        document
          .getElementById('catalog')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      40,
    );
  };

  const pickBrand = (b: string) => {
    setBrand(b);
    setModel(BRANDS.find((x) => x.name === b)?.models[0] ?? '');
  };

  const openRequest = (p: Product | null) => {
    setActiveProduct(p);
    setDialogOpen(true);
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
        <Hero {...selectorProps} />
        <Catalog
          vehicle={vehicle}
          onReset={() => setVehicle(null)}
          onRequest={(p) => openRequest(p)}
        />
        <Selection {...selectorProps} onPickBrand={pickBrand} />
        <Prices onRequest={() => openRequest(null)} />
        <Install />
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
