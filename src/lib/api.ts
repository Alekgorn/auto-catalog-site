import funcUrls from '../../backend/func2url.json';

export const CATALOG_URL = (funcUrls as Record<string, string>).catalog;
export const ADMIN_URL = (funcUrls as Record<string, string>).admin;
export const ORDERS_URL = (funcUrls as Record<string, string>).orders;
export const DEALERS_URL = (funcUrls as Record<string, string>).dealers;

export interface OrderItemPayload {
  slug: string;
  name: string;
  price: number;
  qty: number;
}

export interface OrderPayload {
  name: string;
  phone: string;
  comment?: string;
  vehicle?: string;
  source?: string;
  items: OrderItemPayload[];
}

export const sendOrder = async (payload: OrderPayload): Promise<boolean> => {
  try {
    const res = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Машина, под которую не собрался комплект.
 *
 * Отправляем и просто при показе заглушки (без контакта), и когда человек
 * просит сообщить о появлении. Так в админке видно весь спрос, а не только
 * оставленные заявки: понятно, какие авто вообще ищут.
 */
export interface MissingFitPayload {
  brand: string;
  model: string;
  year?: number;
  /** Сценарий, в котором упёрлись */
  scenario?: string;
  /** Телефон или почта — пусто, если человек ничего не оставил */
  contact?: string;
}

export const sendMissingFit = async (
  payload: MissingFitPayload,
): Promise<boolean> => {
  try {
    const res = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, kind: 'missing-fit' }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const ADMIN_TOKEN_KEY = 'shtatno.admin.token';

export const getAdminToken = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
};

export const setAdminToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* noop */
  }
};

export const adminFetch = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> =>
  fetch(`${ADMIN_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': getAdminToken(),
      ...(init.headers ?? {}),
    },
  });