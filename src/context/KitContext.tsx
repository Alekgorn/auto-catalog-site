import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Product } from '@/data/catalog';
import { KitStep } from '@/data/scenarios';

const KEY = 'kit-build';

/** Позиция сборки: шаг и выбранный товар */
export interface KitPick {
  /** Раздел каталога — он же ключ шага */
  category: string;
  productId: string;
}

interface KitValue {
  /** Что выбрано: раздел → id товара */
  picks: Record<string, string>;
  /** Сколько штук каждой позиции: ключ позиции → количество */
  qty: Record<string, number>;
  /** Изменить количество позиции (меньше одной — убираем из панели) */
  setQty: (key: string, value: number) => void;
  /** Шаги сценария, в котором идёт сборка */
  steps: KitStep[];
  /** Адрес сценария — панель ведёт обратно к сборке */
  slug: string;
  /** Начать сборку по сценарию (запоминаем шаги для панели) */
  begin: (slug: string, steps: KitStep[]) => void;
  /** Выбрать позицию; повторный выбор того же товара снимает отметку */
  pick: (product: Product) => void;
  /** Убрать позицию шага */
  drop: (category: string) => void;
  /** Очистить сборку целиком */
  reset: () => void;
  /** Сборка окончена: комплект уехал в корзину — сайт снова обычный */
  finish: () => void;
  /** Товар выбран в сборке? */
  has: (id: string) => boolean;
}

const KitContext = createContext<KitValue | null>(null);

interface Saved {
  picks: Record<string, string>;
  qty: Record<string, number>;
  slug: string;
  steps: KitStep[];
}

const EMPTY: Saved = { picks: {}, qty: {}, slug: '', steps: [] };

const read = (): Saved => {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    return {
      picks: parsed.picks ?? {},
      // Старые сохранения без количеств — там везде по одной штуке
      qty: parsed.qty ?? {},
      slug: parsed.slug ?? '',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    };
  } catch {
    return EMPTY;
  }
};

/**
 * Сборка комплекта живёт вне страницы сценария: покупатель может уйти
 * в товар или каталог, а панель с выбранным останется с ним.
 */
export const KitProvider = ({ children }: { children: React.ReactNode }) => {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [qty, setQtyMap] = useState<Record<string, number>>({});
  const [steps, setSteps] = useState<KitStep[]>([]);
  const [slug, setSlug] = useState('');
  const [ready, setReady] = useState(false);
  /**
   * Страница сценария успевает объявить свои шаги раньше, чем сюда доедет
   * сохранённая сборка: эффекты дочерних компонентов срабатывают первыми.
   * Флаг бережёт свежие шаги от затирания старыми.
   */
  const started = useRef(false);

  useEffect(() => {
    const saved = read();
    setPicks(saved.picks);
    setQtyMap(saved.qty);
    if (!started.current) setSteps(saved.steps);
    setSlug((prev) => prev || saved.slug);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ picks, qty, steps, slug }));
    } catch {
      /* приватный режим — просто не сохраняем */
    }
  }, [picks, qty, steps, slug, ready]);

  const begin = useCallback((nextSlug: string, nextSteps: KitStep[]) => {
    started.current = true;
    setSlug((prev) => {
      // Зашли в другой сценарий — старую сборку не тащим
      if (prev && prev !== nextSlug) setPicks({});
      return nextSlug;
    });
    setSteps(nextSteps);
  }, []);

  /**
   * Кладём товар в панель. На шаге сценария позиция одна на раздел —
   * новый выбор заменяет прежний. Всё остальное копится свободно,
   * поэтому такие товары храним по своему id, а не по разделу.
   */
  const pick = useCallback(
    (product: Product) => {
      const isStep = steps.some((s) => s.category === product.category);
      const key = isStep ? product.category : product.id;
      setPicks((prev) => {
        const next = { ...prev };
        if (next[key] === product.id) {
          delete next[key];
          setQtyMap((q) => {
            const rest = { ...q };
            delete rest[key];
            return rest;
          });
        } else {
          next[key] = product.id;
          // Новая позиция начинается с одной штуки
          setQtyMap((q) => ({ ...q, [key]: 1 }));
        }
        return next;
      });
    },
    [steps],
  );

  const drop = useCallback((category: string) => {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
    setQtyMap((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }, []);

  /** Минус до нуля убирает позицию; больше 99 штук не даём набрать */
  const setQty = useCallback(
    (key: string, value: number) => {
      if (value < 1) {
        drop(key);
        return;
      }
      setQtyMap((prev) => ({ ...prev, [key]: Math.min(value, 99) }));
    },
    [drop],
  );

  const reset = useCallback(() => {
    setPicks({});
    setQtyMap({});
  }, []);

  const finish = useCallback(() => {
    setPicks({});
    setQtyMap({});
    setSteps([]);
    setSlug('');
  }, []);

  const value = useMemo<KitValue>(
    () => ({
      picks,
      qty,
      setQty,
      steps,
      slug,
      begin,
      pick,
      drop,
      reset,
      finish,
      has: (id) => Object.values(picks).includes(id),
    }),
    [picks, qty, setQty, steps, slug, begin, pick, drop, reset, finish],
  );

  return <KitContext.Provider value={value}>{children}</KitContext.Provider>;
};

/** Заглушка для страниц вне сборки (например, при предрендере) */
const IDLE: KitValue = {
  picks: {},
  qty: {},
  setQty: () => {},
  steps: [],
  slug: '',
  begin: () => {},
  pick: () => {},
  drop: () => {},
  reset: () => {},
  finish: () => {},
  has: () => false,
};

export const useKit = (): KitValue => useContext(KitContext) ?? IDLE;