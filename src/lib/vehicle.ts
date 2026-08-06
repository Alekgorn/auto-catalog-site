import { Vehicle } from '@/data/catalog';

const KEY = 'shtatno.vehicle';

export const loadVehicle = (): Vehicle | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Vehicle) : null;
  } catch {
    return null;
  }
};

export const saveVehicle = (v: Vehicle | null) => {
  try {
    if (v) sessionStorage.setItem(KEY, JSON.stringify(v));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};
