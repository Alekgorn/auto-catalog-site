import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PRODUCTS, Product } from '@/data/catalog';

const KEY = 'shtatno.cart';

export interface CartLine {
  id: string;
  qty: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartValue {
  lines: CartLine[];
  items: CartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (product: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const CartContext = createContext<CartValue | null>(null);

const read = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>(read);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* noop */
    }
  }, [lines]);

  const add = useCallback((product: Product, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === product.id);
      if (found) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, qty: Math.min(l.qty + qty, 99) } : l,
        );
      }
      return [...prev, { id: product.id, qty }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 99) } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const items = useMemo<CartItem[]>(
    () =>
      lines
        .map((l) => {
          const product = PRODUCTS.find((p) => p.id === l.id);
          return product ? { product, qty: l.qty } : null;
        })
        .filter((x): x is CartItem => x !== null),
    [lines],
  );

  const count = useMemo(() => items.reduce((a, i) => a + i.qty, 0), [items]);
  const total = useMemo(
    () => items.reduce((a, i) => a + i.product.price * i.qty, 0),
    [items],
  );

  const value: CartValue = {
    lines,
    items,
    count,
    total,
    open,
    setOpen,
    add,
    remove,
    setQty,
    clear,
    has: (id: string) => lines.some((l) => l.id === id),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
