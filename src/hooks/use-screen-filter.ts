import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/data/catalog';
import { useVehicle } from '@/hooks/use-vehicle';
import { useCatalog } from '@/context/CatalogContext';
import {
  HEADUNITS_CATEGORY,
  availableScreenSizes,
  fitsAvailableSizes,
} from '@/lib/kit-filter';

/**
 * Отбор магнитол по диагонали для каталога и поиска.
 *
 * Логика та же, что в сборке комплекта: смотрим переходные рамки, которые
 * подходят машине покупателя, и оставляем магнитолы тех размеров, под
 * которые рамка есть. Экран, который некуда поставить, предлагать незачем.
 *
 * Отбор молча пропускает всё, когда ограничивать нечем: машина не выбрана,
 * рамок под неё нет или у товара не заполнен размер. Лучше показать лишнее,
 * чем спрятать нужное.
 */
export const useScreenFilter = <T,>(
  items: T[],
  /* В каталоге элемент — сам товар, в поиске он лежит внутри находки */
  pick: (item: T) => Product = (i) => i as unknown as Product,
) => {
  const { allProducts } = useCatalog();
  const { vehicle } = useVehicle();
  const [filtered, setFiltered] = useState(true);

  /* Сменили машину — снова показываем подобранное, а не прошлый выбор */
  useEffect(() => {
    setFiltered(true);
  }, [vehicle?.brand, vehicle?.model, vehicle?.year]);

  /*
   * Размеры считаем по всему каталогу, а не по показанному списку:
   * рамки лежат в своём разделе, и на странице магнитол их нет.
   */
  const sizes = useMemo(
    () => availableScreenSizes(allProducts, vehicle),
    [allProducts, vehicle],
  );

  /** Магнитолы, которые не встанут в эту машину */
  const hidden = useMemo(() => {
    if (!sizes.length) return [];
    return items.filter((item) => {
      const p = pick(item);
      return (
        p.category === HEADUNITS_CATEGORY && !fitsAvailableSizes(p, sizes)
      );
    });
    // pick — стабильная функция выборки, в зависимости не берём
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sizes]);

  const list = useMemo(() => {
    if (!filtered || !hidden.length) return items;
    const skip = new Set(hidden.map((item) => pick(item).id));
    return items.filter((item) => !skip.has(pick(item).id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hidden, filtered]);

  return {
    /** Список с учётом отбора */
    list,
    sizes,
    hiddenCount: hidden.length,
    filtered,
    toggle: () => setFiltered((v) => !v),
    vehicleLabel: vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year} г.`
      : '',
  };
};