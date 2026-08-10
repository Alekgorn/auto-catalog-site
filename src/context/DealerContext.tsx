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
  /** Дилерские цены показываются прямо сейчас */
  active: boolean;
  /** Дилер вошёл в систему (даже если цены временно скрыты) */
  loggedIn: boolean;
  dealer: Dealer | null;
  /** Цены временно скрыты кнопкой — чтобы показать экран клиенту */
  hidden: boolean;
  /** Переключает показ дилерских цен */
  toggleHidden: () => void;
  /** Проверяет номер в базе. Возвращает текст ошибки или null при успехе */
  login: (phone: string) => Promise<string | null>;
  logout: () => void;
}

const KEY = 'shtatno.dealer';
/** Запоминаем, что дилер скрыл свои цены */
const HIDE_KEY = 'shtatno.dealer.hidden';

/** Сколько помним вход дилера — 7 дней */
const TTL_DAYS = 7;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

interface Stored extends Dealer {
  /** Время окончания доступа */
  until: number;
}

const DealerContext = createContext<DealerState>({
  active: false,
  loggedIn: false,
  dealer: null,
  hidden: false,
  toggleHidden: () => {},
  login: async () => 'Недоступно',
  logout: () => {},
});

export const DealerProvider = ({ children }: { children: React.ReactNode }) => {
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [hidden, setHidden] = useState(false);

  // Восстанавливаем вход, если срок ещё не вышел
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Stored;
      if (!saved?.until || saved.until < Date.now()) {
        localStorage.removeItem(KEY);
        return;
      }
      setDealer({ phone: saved.phone, name: saved.name });
      setHidden(localStorage.getItem(HIDE_KEY) === '1');
    } catch {
      localStorage.removeItem(KEY);
    }
  }, []);

  /** Прячем или возвращаем дилерские цены — например, при клиенте */
  const toggleHidden = useCallback(() => {
    setHidden((v) => {
      const next = !v;
      try {
        if (next) localStorage.setItem(HIDE_KEY, '1');
        else localStorage.removeItem(HIDE_KEY);
      } catch {
        /* noop */
      }
      return next;
    });
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
      // Запоминаем на 7 дней — повторно вводить номер не нужно
      localStorage.setItem(
        KEY,
        JSON.stringify({ ...next, until: Date.now() + TTL_MS }),
      );
      return null;
    } catch {
      return 'Не удалось связаться с сервером. Попробуйте ещё раз.';
    }
  }, []);

  const logout = useCallback(() => {
    setDealer(null);
    setHidden(false);
    localStorage.removeItem(HIDE_KEY);
    localStorage.removeItem(KEY);
  }, []);

  const value = useMemo(
    () => ({
      // Цены показываем, только если дилер вошёл и не скрыл их вручную
      active: !!dealer && !hidden,
      loggedIn: !!dealer,
      dealer,
      hidden,
      toggleHidden,
      login,
      logout,
    }),
    [dealer, hidden, toggleHidden, login, logout],
  );

  return (
    <DealerContext.Provider value={value}>{children}</DealerContext.Provider>
  );
};

export const useDealer = () => useContext(DealerContext);
