import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  BRANDS as FALLBACK_BRANDS,
  Brand,
  Guide,
  PRODUCTS as FALLBACK_PRODUCTS,
  Product,
  WireFeature,
} from '@/data/catalog';
import { VehicleWiring } from '@/lib/wire-pick';
import { CATALOG_URL } from '@/lib/api';
import { useDealer } from '@/context/DealerContext';
import { compareNames } from '@/lib/slug';
import {
  DEFAULT_CONTACTS,
  DEFAULT_FAQ,
  DEFAULT_FILTER_BLOCKS,
  DEFAULT_SHORTCUTS,
  DEFAULT_ANALYTICS,
  DEFAULT_HOTSPOTS,
  SiteAnalytics,
  HeroShortcut,
  HeroHotspot,
  FaqItem,
  FilterBlockKey,
  ShowcaseKit,
  SiteContacts,
} from '@/lib/site-settings';

export interface PrerenderData {
  products?: Product[];
  brands?: Brand[];
  vehicleWiring?: VehicleWiring[];
  categories?: string[];
  categorySpecs?: Record<string, string[]>;
  guides?: Guide[];
  settings?: {
    card_fields?: string[];
    wire_features?: WireFeature[];
    showcase?: ShowcaseKit[];
    contacts?: Partial<SiteContacts>;
    faq?: FaqItem[];
    filter_blocks?: FilterBlockKey[];
    shortcuts?: HeroShortcut[];
    shortcuts_hidden?: boolean;
    hotspots?: HeroHotspot[];
    analytics?: Partial<SiteAnalytics>;
  };
}

interface CatalogValue {
  /**
   * Товары для показа. В дилерском режиме с фильтром «только в наличии»
   * здесь остаются лишь позиции с остатком — списки, поиск и подбор
   * сразу работают по доступному товару.
   */
  products: Product[];
  /**
   * Полный каталог без фильтра наличия. Нужен там, где товар ищут по
   * ссылке: страница товара должна открыться, даже если склад пуст.
   */
  allProducts: Product[];
  brands: Brand[];
  /** Настройки подбора проводки по машинам — из вкладки «Марки» */
  vehicleWiring: VehicleWiring[];
  guides: Guide[];
  categories: string[];
  categorySpecs: Record<string, string[]>;
  cardFields: string[];
  /** Справочник признаков подключения — по нему подбор задаёт вопросы */
  wireFeatures: WireFeature[];
  showcase: ShowcaseKit[];
  contacts: SiteContacts;
  faq: FaqItem[];
  filterBlocks: FilterBlockKey[];
  shortcuts: HeroShortcut[];
  shortcutsHidden: boolean;
  hotspots: HeroHotspot[];
  analytics: SiteAnalytics;
  loading: boolean;
  reload: () => void;
}

const CatalogContext = createContext<CatalogValue | null>(null);

const DEFAULT_CARD_FIELDS = ['warranty'];

/** Данные, вшитые в HTML на этапе сборки, чтобы первый экран не ждал сеть. */
/**
 * Общий адрес картинок в слепке каталога заменён на «~» — так файл,
 * который скачивает каждый посетитель, весит на пару сотен килобайт
 * меньше. Здесь возвращаем адресам полный вид.
 */
const IMG_PREFIX = 'https://cdn.poehali.dev/projects/';

const expandImages = (data: PrerenderData): PrerenderData => {
  if (!data?.products?.length) return data;
  return {
    ...data,
    products: data.products.map((p) => ({
      // Пустые поля в слепок не попадают ради его размера — возвращаем их
      // на место, чтобы товар выглядел ровно так же, как пришёл бы с сервера
      subcategory: '',
      badge: '',
      ozonUrl: '',
      wbUrl: '',
      stockNote: '',
      videoUrl: '',
      notes: [],
      guides: [],
      kit: [],
      ...p,
      // Список совместимости есть не у всех товаров (универсальные позиции),
      // но код местами перебирает его напрямую — держим объект всегда
      fits: p.fits ?? {},
      images: p.images?.some((u) => u.startsWith('~'))
        ? p.images.map((u) => (u.startsWith('~') ? IMG_PREFIX + u.slice(1) : u))
        : p.images,
    })),
  };
};

const bootData = (): PrerenderData | null => {
  if (typeof window === 'undefined') return null;
  const raw = (window as unknown as { __CATALOG__?: PrerenderData }).__CATALOG__;
  return raw && typeof raw === 'object' ? expandImages(raw) : null;
};

/**
 * Сколько минут считаем каталог свежим и не идём за ним в сеть.
 *
 * Каталог весит больше пяти мегабайт, и каждый поход за ним — это и
 * вызов платной функции, и заметная пауза у посетителя.
 *
 * Сутки, а не час: каталог меняется только при пересборке сайта, и
 * новые данные приезжают вместе со страницей — со своей меткой времени.
 * Часа не хватало: уже назавтра каждый посетитель тянул с сервера ровно
 * то же самое, что лежало у него в странице.
 *
 * Свежие правки видно сразу в обоих случаях: пересборка приносит новую
 * метку, а из админки сайт открывается с ?fresh — эта метка обходит
 * проверку и тянет каталог принудительно.
 */
const FRESH_MINUTES = 24 * 60;
const CACHE_KEY = 'catalog-cache';

/** Когда собрали страницу — метку кладёт сборщик рядом с данными */
const bootTime = (): number => {
  if (typeof window === 'undefined') return 0;
  const at = (window as unknown as { __CATALOG_AT__?: number }).__CATALOG_AT__;
  return typeof at === 'number' ? at : 0;
};

/**
 * Каталог, сохранённый браузером при прошлом визите.
 * Он свежее вшитого в страницу, если сайт пересобирали давно.
 */
const cachedData = (): { data: PrerenderData; at: number } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data?.products?.length || typeof parsed.at !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const saveCache = (data: PrerenderData) => {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, at: Date.now() }),
    );
  } catch {
    /* приватный режим или переполнение — просто не сохраняем */
  }
};

export const CatalogProvider = ({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: PrerenderData;
}) => {
  const isPrerender = typeof window === 'undefined';

  /**
   * Стартовые данные: что свежее — вшитое в страницу при сборке или
   * сохранённое браузером в прошлый заход.
   */
  const cached = initialData ? null : cachedData();
  const built = initialData ?? bootData();
  const { onlyInStock } = useDealer();
  const builtAt = initialData ? Date.now() : bootTime();
  const useCache = !!cached && cached.at > builtAt;

  const seed = useCache ? cached!.data : built;
  const seedAt = useCache ? cached!.at : builtAt;

  const [products, setProducts] = useState<Product[]>(
    seed?.products?.length ? seed.products : FALLBACK_PRODUCTS,
  );
  const [brands, setBrands] = useState<Brand[]>(
    seed?.brands?.length ? seed.brands : FALLBACK_BRANDS,
  );
  const [vehicleWiring, setVehicleWiring] = useState<VehicleWiring[]>(
    seed?.vehicleWiring ?? [],
  );
  const [guides, setGuides] = useState<Guide[]>(seed?.guides ?? []);
  const [cardFields, setCardFields] = useState<string[]>(
    seed?.settings?.card_fields?.length
      ? seed.settings.card_fields
      : DEFAULT_CARD_FIELDS,
  );
  const [wireFeatures, setWireFeatures] = useState<WireFeature[]>(
    seed?.settings?.wire_features ?? [],
  );
  const [showcase, setShowcase] = useState<ShowcaseKit[]>(
    seed?.settings?.showcase ?? [],
  );
  const [contacts, setContacts] = useState<SiteContacts>({
    ...DEFAULT_CONTACTS,
    ...(seed?.settings?.contacts ?? {}),
  });
  const [faq, setFaq] = useState<FaqItem[]>(
    seed?.settings?.faq?.length ? seed.settings.faq : DEFAULT_FAQ,
  );
  const [filterBlocks, setFilterBlocks] = useState<FilterBlockKey[]>(
    seed?.settings?.filter_blocks?.length
      ? seed.settings.filter_blocks
      : DEFAULT_FILTER_BLOCKS,
  );
  const [shortcuts, setShortcuts] = useState<HeroShortcut[]>(
    seed?.settings?.shortcuts?.length ? seed.settings.shortcuts : DEFAULT_SHORTCUTS,
  );
  const [shortcutsHidden, setShortcutsHidden] = useState<boolean>(
    seed?.settings?.shortcuts_hidden === true,
  );
  const [hotspots, setHotspots] = useState<HeroHotspot[]>(
    seed?.settings?.hotspots?.length ? seed.settings.hotspots : DEFAULT_HOTSPOTS,
  );
  const [analytics, setAnalytics] = useState<SiteAnalytics>({
    ...DEFAULT_ANALYTICS,
    ...(seed?.settings?.analytics ?? {}),
  });
  const [catalogCategories, setCatalogCategories] = useState<string[]>(
    seed?.categories ?? [],
  );
  const [categorySpecs, setCategorySpecs] = useState<Record<string, string[]>>(
    seed?.categorySpecs ?? {},
  );
  const [loading, setLoading] = useState(!seed && !isPrerender);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isPrerender) return;

    /**
     * Данные свежие — второй запрос не нужен.
     * Каталог уже приехал вместе со страницей: качать те же 650 КБ
     * повторно на каждом переходе бессмысленно и дорого по вызовам функции.
     * Кнопка «обновить» (tick) обходит проверку принудительно.
     *
     * Метка ?fresh в адресе — переход из админки после сброса кеша:
     * там копию не используем вовсе, правки должны быть видны сразу.
     */
    const forced = window.location.search.includes('fresh=');

    const fresh = seedAt > 0 && Date.now() - seedAt < FRESH_MINUTES * 60_000;
    if (fresh && !forced && tick === 0 && seed?.products?.length) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    /*
     * Показываем «загружаем» только когда показывать больше нечего.
     * Если товары уже есть (пришли со страницей или из копии), обновляем
     * их молча в фоне — иначе готовый каталог подменялся бы заглушкой.
     */
    if (!seed?.products?.length) setLoading(true);
    fetch(CATALOG_URL)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.products) && data.products.length) {
          setProducts(data.products);
        }
        if (Array.isArray(data.vehicleWiring)) {
          setVehicleWiring(data.vehicleWiring);
        }
        if (Array.isArray(data.brands) && data.brands.length) {
          // Марки и модели — по алфавиту, чтобы работала прокрутка по буквам
          setBrands(
            [...data.brands]
              .sort((a, b) => compareNames(a.name, b.name))
              .map((b) => ({
                ...b,
                models: [...(b.models ?? [])].sort(compareNames),
              })),
          );
        }
        if (Array.isArray(data.guides)) {
          setGuides(data.guides);
        }
        if (Array.isArray(data.categories)) {
          setCatalogCategories(data.categories);
        }
        if (data.categorySpecs && typeof data.categorySpecs === 'object') {
          setCategorySpecs(data.categorySpecs);
        }
        if (Array.isArray(data.settings?.card_fields)) {
          setCardFields(data.settings.card_fields);
        }
        if (Array.isArray(data.settings?.showcase)) {
          setShowcase(data.settings.showcase);
        }
        if (Array.isArray(data.settings?.wire_features)) {
          setWireFeatures(data.settings.wire_features);
        }
        if (data.settings?.contacts && typeof data.settings.contacts === 'object') {
          setContacts({ ...DEFAULT_CONTACTS, ...data.settings.contacts });
        }
        if (Array.isArray(data.settings?.faq) && data.settings.faq.length) {
          setFaq(data.settings.faq);
        }
        if (Array.isArray(data.settings?.filter_blocks)) {
          setFilterBlocks(data.settings.filter_blocks);
        }
        if (Array.isArray(data.settings?.shortcuts) && data.settings.shortcuts.length) {
          setShortcuts(data.settings.shortcuts);
        }
        setShortcutsHidden(data.settings?.shortcuts_hidden === true);
        if (Array.isArray(data.settings?.hotspots) && data.settings.hotspots.length) {
          setHotspots(data.settings.hotspots);
        }
        if (data.settings?.analytics && typeof data.settings.analytics === 'object') {
          setAnalytics({ ...DEFAULT_ANALYTICS, ...data.settings.analytics });
        }
        // Запоминаем на время визита — переходы по сайту больше не дёргают функцию
        saveCache(data);
      })
      .catch(() => {
        /* остаёмся на встроенных данных */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, isPrerender]);

  /*
   * Дилер включил «только в наличии» — убираем всё, чего нет на складе.
   * Фильтруем в одном месте, чтобы каталог, поиск, подбор комплекта и
   * рекомендации разом показывали только то, что можно отгрузить.
   */
  const visibleProducts = useMemo(
    () => (onlyInStock ? products.filter((p) => (p.stock ?? 0) > 0) : products),
    [products, onlyInStock],
  );

  // Порядок категорий задаётся в админке; товары без категории тоже показываем
  const categories = useMemo(() => {
    const set = [...catalogCategories];
    visibleProducts.forEach((p) => {
      if (p.category && !set.includes(p.category)) set.push(p.category);
    });
    return set;
  }, [visibleProducts, catalogCategories]);

  const value: CatalogValue = {
    products: visibleProducts,
    allProducts: products,
    brands,
    vehicleWiring,
    guides,
    categories,
    categorySpecs,
    cardFields,
    wireFeatures,
    showcase,
    contacts,
    faq,
    filterBlocks,
    shortcuts,
    shortcutsHidden,
    hotspots,
    analytics,
    loading,
    reload: () => setTick((t) => t + 1),
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = (): CatalogValue => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
};