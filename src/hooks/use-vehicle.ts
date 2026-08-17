import { useEffect, useState } from 'react';
import { Vehicle } from '@/data/catalog';
import { VEHICLE_EVENT, loadVehicle, saveVehicle } from '@/lib/vehicle';

/**
 * Выбранная машина, единая для всего сайта.
 *
 * Читаем не при отрисовке, а после неё: страницы собираются заранее
 * на сервере, где хранилища браузера нет. Иначе первая отрисовка
 * не совпала бы с готовой страницей.
 */
export const useVehicle = () => {
  const [vehicle, setVehicleState] = useState<Vehicle | null>(null);

  useEffect(() => {
    const sync = () => setVehicleState(loadVehicle());
    sync();
    window.addEventListener(VEHICLE_EVENT, sync);
    // Машину сменили в другой вкладке — подхватываем и здесь
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(VEHICLE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setVehicle = (v: Vehicle | null) => {
    saveVehicle(v);
    setVehicleState(v);
  };

  return { vehicle, setVehicle };
};
