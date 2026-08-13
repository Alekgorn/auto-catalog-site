import { Vehicle } from '@/data/catalog';

const KEY = 'shtatno.vehicle';

/**
 * Машина считается выбранной, только если известны марка, модель и год.
 * Огрызок данных (например, после старой версии сайта) — это «не выбрано»:
 * иначе товары начнут помечаться «не подходит» без причины.
 */
export const isVehicle = (v: unknown): v is Vehicle => {
  if (!v || typeof v !== 'object') return false;
  const { brand, model, year } = v as Partial<Vehicle>;
  return (
    typeof brand === 'string' &&
    brand.trim() !== '' &&
    typeof model === 'string' &&
    model.trim() !== '' &&
    typeof year === 'number' &&
    Number.isFinite(year)
  );
};

export const loadVehicle = (): Vehicle | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return isVehicle(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveVehicle = (v: Vehicle | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (isVehicle(v)) sessionStorage.setItem(KEY, JSON.stringify(v));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
};