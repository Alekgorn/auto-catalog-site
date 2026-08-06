import funcUrls from '../../backend/func2url.json';

export const CATALOG_URL = (funcUrls as Record<string, string>).catalog;
export const ADMIN_URL = (funcUrls as Record<string, string>).admin;
export const ORDERS_URL = (funcUrls as Record<string, string>).orders;

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

export const ADMIN_TOKEN_KEY = 'shtatno.admin.token';

export const getAdminToken = (): string => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
};

export const setAdminToken = (token: string | null) => {
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