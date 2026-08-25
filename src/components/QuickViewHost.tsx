import { useEffect, useState } from 'react';
import QuickView from '@/components/QuickView';
import { Vehicle } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { loadVehicle } from '@/lib/vehicle';

/** Слушает клики по фото товара и показывает окно быстрого просмотра. */
const QuickViewHost = () => {
  const { allProducts } = useCatalog();
  const [id, setId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      setVehicle(loadVehicle());
      setId((e as CustomEvent<string>).detail ?? null);
    };
    window.addEventListener('quickview:open', onOpen);
    return () => window.removeEventListener('quickview:open', onOpen);
  }, []);

  const product = id ? (allProducts.find((p) => p.id === id) ?? null) : null;

  return <QuickView product={product} vehicle={vehicle} onClose={() => setId(null)} />;
};

export default QuickViewHost;
