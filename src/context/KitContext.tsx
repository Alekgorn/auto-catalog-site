import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  /** Товар выбран в сборке? */
  has: (id: string) => boolean;
}

const KitContext = createContext<KitValue | null>(null);

const read = (): { picks: Record<string, string>; slug: string; steps: KitStep[] } => {
  if (typeof window === 'undefined') return { picks: {}, slug: '', steps: [] };
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') {
      return { picks: {}, slug: '', steps: [] };
    }
    return {
      picks: parsed.picks ?? {},
      slug: parsed.slug ?? '',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    };
  } catch {
    return { picks: {}, slug: '', steps: [] };
  }
};

/**
 * Сборка комплекта живёт вне страницы сценария: покупатель может уйти
 * в товар или каталог, а панель с выбранным останется с ним.
 */
export const KitProvider = ({ children }: { children: React.ReactNode }) => {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [steps, setSteps] = useState<KitStep[]>([]);
  const [slug, setSlug] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = read();
    setPicks(saved.picks);
    setSteps(saved.steps);
    setSlug(saved.slug);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ picks, steps, slug }));
    } catch {
      /* приватный режим — просто не сохраняем */
    }
  }, [picks, steps, slug, ready]);

  const begin = useCallback((nextSlug: string, nextSteps: KitStep[]) => {
    setSlug((prev) => {
      // Зашли в другой сценарий — старую сборку не тащим
      if (prev && prev !== nextSlug) setPicks({});
      return nextSlug;
    });
    setSteps(nextSteps);
  }, []);

  const pick = useCallback((product: Product) => {
    setPicks((prev) => {
      const next = { ...prev };
      if (next[product.category] === product.id) delete next[product.category];
      else next[product.category] = product.id;
      return next;
    });
  }, []);

  const drop = useCallback((category: string) => {
    setPicks((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  }, []);

  const reset = useCallback(() => setPicks({}), []);

  const value = useMemo<KitValue>(
    () => ({
      picks,
      steps,
      slug,
      begin,
      pick,
      drop,
      reset,
      has: (id) => Object.values(picks).includes(id),
    }),
    [picks, steps, slug, begin, pick, drop, reset],
  );

  return <KitContext.Provider value={value}>{children}</KitContext.Provider>;
};

export const useKit = (): KitValue => {
  const ctx = useContext(KitContext);
  if (!ctx) throw new Error('useKit вне KitProvider');
  return ctx;
};
