import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEALERS_URL } from '@/lib/api';

interface Dealer {
  phone: string;
  name: string;
}

interface DealerState {
  /** Дилерский режим включён */
  active: boolean;
  dealer: Dealer | null;
  /** Проверяет номер в базе. Возвращает текст ошибки или null при успехе */
  login: (phone: string) => Promise<string | null>;
  logout: () => void;
}

const KEY = 'shtatno.dealer';

const DealerContext = createContext<DealerState>({
  active: false,
  dealer: null,
  login: async () => 'Недоступно',
  logout: () => {},
});

export const DealerProvider = ({ children }: { children: React.ReactNode }) => {
  const [dealer, setDealer] = useState<Dealer | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDealer(JSON.parse(raw) as Dealer);
    } catch {
      /* noop */
    }
  }, []);

  const login = useCallback(async (phone: string): Promise<string | null> => {
    try {
      const res = await fetch(DEALERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!data.ok) return data.error ?? 'Номер не найден';

      const next = { phone: data.phone as string, name: (data.name as string) ?? '' };
      setDealer(next);
      localStorage.setItem(KEY, JSON.stringify(next));
      return null;
    } catch {
      return 'Не удалось связаться с сервером. Попробуйте ещё раз.';
    }
  }, []);

  const logout = useCallback(() => {
    setDealer(null);
    localStorage.removeItem(KEY);
  }, []);

  const value = useMemo(
    () => ({ active: !!dealer, dealer, login, logout }),
    [dealer, login, logout],
  );

  return (
    <DealerContext.Provider value={value}>{children}</DealerContext.Provider>
  );
};

export const useDealer = () => useContext(DealerContext);
