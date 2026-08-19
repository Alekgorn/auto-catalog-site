import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Product } from '@/data/catalog';

const KEY = 'shtatno.compare';

/**
 * Больше четырёх колонок в таблицу не помещается даже на широком экране,
 * а на телефоне и это приходится листать вбок.
 */
export const COMPARE_LIMIT = 4;

interface CompareValue {
  /** Что сравниваем: id товаров по порядку добавления */
  ids: string[];
  /** Раздел, в котором идёт сравнение — сравнивать можно только внутри него */
  category: string;
  /** Добавить или убрать товар; чужой раздел заменяет список целиком */
  toggle: (product: Product) => void;
  /** Убрать один товар */
  remove: (id: string) => void;
  /** Очистить сравнение */
  clear: () => void;
  /** Товар уже в сравнении? */
  has: (id: string) => boolean;
  /** Можно ли добавить ещё — список не переполнен */
  canAdd: (product: Product) => boolean;
}

const CompareContext = createContext<CompareValue | null>(null);

interface Saved {
  ids: string[];
  category: string;
}

const EMPTY: Saved = { ids: [], category: '' };

const read = (): Saved => {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return EMPTY;
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
      category: typeof parsed.category === 'string' ? parsed.category : '',
    };
  } catch {
    return EMPTY;
  }
};

/**
 * Сравнение товаров.
 *
 * Сравнивать имеет смысл только однотипные вещи: у магнитолы и
 * видеорегистратора нет общих характеристик, таблица получилась бы пустой.
 * Поэтому список привязан к разделу каталога — товар из другого раздела
 * начинает сравнение заново.
 */
export const CompareProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  /* Список и раздел меняются только вместе — держим их одним значением */
  const [{ ids, category }, setState] = useState<Saved>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ids, category }));
    } catch {
      /* приватный режим — просто не сохраняем */
    }
  }, [ids, category, ready]);

  /*
   * Считаем от предыдущего состояния, а не от значения из замыкания:
   * иначе два быстрых нажатия подряд видят один и тот же старый список
   * и второй товар в сравнение не попадает.
   */
  const toggle = useCallback((product: Product) => {
    setState((prev) => {
      // Уже в списке — убираем
      if (prev.ids.includes(product.id)) {
        const ids = prev.ids.filter((x) => x !== product.id);
        return { ids, category: ids.length ? prev.category : '' };
      }

      // Товар из другого раздела — сравнение начинается заново с него
      if (prev.ids.length && prev.category !== product.category) {
        return { ids: [product.id], category: product.category };
      }

      return {
        ids: [...prev.ids, product.id].slice(-COMPARE_LIMIT),
        category: product.category,
      };
    });
  }, []);

  const remove = useCallback((id: string) => {
    setState((prev) => {
      const ids = prev.ids.filter((x) => x !== id);
      return { ids, category: ids.length ? prev.category : '' };
    });
  }, []);

  const clear = useCallback(() => setState(EMPTY), []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const canAdd = useCallback(
    (product: Product) =>
      ids.includes(product.id) ||
      (ids.length < COMPARE_LIMIT &&
        (!category || category === product.category)),
    [ids, category],
  );

  const value = useMemo<CompareValue>(
    () => ({ ids, category, toggle, remove, clear, has, canAdd }),
    [ids, category, toggle, remove, clear, has, canAdd],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
};

export const useCompare = (): CompareValue => {
  const ctx = useContext(CompareContext);
  if (ctx) return ctx;
  // Вне провайдера (например при сборке страниц) — тихая заглушка
  return {
    ids: [],
    category: '',
    toggle: () => {},
    remove: () => {},
    clear: () => {},
    has: () => false,
    canAdd: () => true,
  };
};
