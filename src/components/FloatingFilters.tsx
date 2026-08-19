import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  /** Сами фильтры — готовая разметка CatalogFilters */
  children: React.ReactNode;
  /** Сколько условий выбрано — цифра на вкладке у края экрана */
  activeCount?: number;
  /** Сколько товаров доступно сейчас — видно и на вкладке, и на кнопке */
  resultCount?: number;
  /**
   * Растёт при выборе категории — панель уезжает, открывая результат.
   * Именно категории, а не любая правка: ползунок цены двигают подряд,
   * и панель убегала бы из-под пальца.
   */
  hideOn?: string;
  /**
   * Своё имя страницы. По нему запоминаем, что панель здесь уже
   * показывали — второй раз она сама не выедет.
   */
  storageKey?: string;
  /** Куда прокрутить после выбора — начало списка товаров */
  scrollTargetId?: string;
}

/** Сколько панель висит открытой при заходе на страницу */
const SHOW_MS = 3000;
/** Длительность отъезда за край — столько же держим панель в разметке */
const SLIDE_MS = 400;
/**
 * Сколько помним, что панель уже показывали. Полчаса: за это время
 * человек успевает походить по каталогу и не устать от подсказки,
 * а вернувшись позже — снова увидит, где лежат фильтры.
 */
const SEEN_MS = 30 * 60 * 1000;
const SEEN_KEY = 'shtatno.filters-seen';

/** Показывали ли панель на этой странице недавно */
const wasSeen = (key: string): boolean => {
  if (typeof window === 'undefined' || !key) return false;
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const at = map?.[key];
    return typeof at === 'number' && Date.now() - at < SEEN_MS;
  } catch {
    return false;
  }
};

const markSeen = (key: string) => {
  if (typeof window === 'undefined' || !key) return;
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[key] = Date.now();
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch {
    /* приватный режим — просто не запоминаем */
  }
};

/**
 * Фильтры плавающей панелью поверх каталога.
 *
 * Раньше фильтры занимали четверть ширины постоянной колонкой — на товары
 * оставалось меньше места, а на телефоне они и вовсе раздвигали список.
 * Теперь панель показывается при первом заходе на пару секунд, уезжает за
 * правый край в узкую вкладку «Фильтр» и возвращается по нажатию. Каталог
 * при этом занимает всю ширину.
 */
const FloatingFilters = ({
  children,
  activeCount = 0,
  resultCount,
  hideOn,
  storageKey = '',
  scrollTargetId,
}: Props) => {
  /* Заходили сюда недавно — панель не выкатываем, сразу прячем во вкладку */
  const [open, setOpen] = useState(() => !wasSeen(storageKey));
  /** Панель ещё в разметке, пока доигрывает анимация отъезда */
  const [mounted, setMounted] = useState(true);
  /** Первый показ — тот, что сам прячется; дальше закрывает только человек */
  const auto = useRef(true);

  /* Показали при заходе и убрали — дальше панель ждёт нажатия на вкладку */
  useEffect(() => {
    if (!open) {
      auto.current = false;
      return;
    }
    markSeen(storageKey);
    const t = setTimeout(() => {
      auto.current = false;
      setOpen(false);
    }, SHOW_MS);
    return () => clearTimeout(t);
    // Только на первом заходе: дальше панелью управляет человек
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Уехавшую панель убираем из разметки — она не должна ловить нажатия */
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), SLIDE_MS);
    return () => clearTimeout(t);
  }, [open]);

  /* Открытую панель закрываем Escape — привычно и быстро */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        auto.current = false;
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => {
    auto.current = false;
    setOpen(false);
  };

  /**
   * Выбрали категорию — прячем панель и поднимаем к началу списка.
   * Иначе человек остаётся в середине прежней выдачи и не понимает,
   * что список под ним уже другой.
   */
  const firstHide = useRef(true);
  useEffect(() => {
    if (firstHide.current) {
      firstHide.current = false;
      return;
    }
    auto.current = false;
    setOpen(false);

    if (!scrollTargetId) return;
    const el = document.getElementById(scrollTargetId);
    if (!el) return;
    // Ждём, пока список перерисуется под новый фильтр
    requestAnimationFrame(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideOn]);

  return (
    <>
      {/* Вкладка у правого края — вернуть панель. Прячем, пока она открыта */}
      <button
        onClick={() => {
          auto.current = false;
          setOpen(true);
        }}
        aria-label="Открыть фильтры"
        className={`fixed left-0 top-1/2 z-[55] flex -translate-y-1/2 flex-col items-center gap-2 rounded-r-2xl border-2 border-l-0 border-primary-foreground/30 bg-primary px-2.5 py-5 text-primary-foreground shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition-all duration-300 hover:px-3.5 ${
          open
            ? 'pointer-events-none -translate-x-full opacity-0'
            : 'translate-x-0 opacity-100'
        }`}
      >
        <span
          className="font-head text-[0.72rem] font-bold uppercase tracking-[0.14em]"
          style={{ writingMode: 'vertical-rl' }}
        >
          Фильтр
        </span>

        {/* Сколько товаров сейчас доступно — видно, не открывая панель */}
        {typeof resultCount === 'number' && (
          <span className="flex min-w-[1.7rem] items-center justify-center rounded-full bg-primary-foreground px-1.5 py-0.5 font-head text-[0.68rem] font-bold text-primary">
            {resultCount}
          </span>
        )}

        {activeCount > 0 && (
          <span className="absolute -right-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[0.62rem] font-bold text-background">
            {activeCount}
          </span>
        )}
      </button>

      {mounted && (
        <>
          {/* Затемнение только на телефоне: на широком экране панель
              «парит» над каталогом и не мешает его читать */}
          <button
            aria-label="Закрыть фильтры"
            onClick={close}
            className={`fixed inset-0 z-[55] bg-foreground/40 transition-opacity duration-300 sm:hidden ${
              open ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />

          <aside
            className={`fixed left-0 top-[92px] z-[56] flex max-h-[calc(100vh-120px)] w-[86%] max-w-[22rem] flex-col overflow-hidden rounded-r-2xl border-2 border-primary bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out sm:left-4 sm:w-[20rem] sm:rounded-2xl ${
              open ? 'translate-x-0' : '-translate-x-[110%]'
            }`}
          >
            <div className="flex flex-none items-center justify-between border-b-2 border-primary bg-primary px-4 py-3 text-primary-foreground">
              <span className="flex items-center gap-2 font-head text-[0.85rem] font-bold uppercase tracking-[0.08em]">
                <Icon name="SlidersHorizontal" size={16} />
                Фильтры
                {typeof resultCount === 'number' && (
                  <span className="rounded-full bg-primary-foreground px-2 py-0.5 text-[0.68rem] font-bold text-primary">
                    {resultCount}
                  </span>
                )}
              </span>
              <button
                onClick={close}
                aria-label="Свернуть фильтры"
                className="flex items-center gap-1 text-[0.7rem] uppercase tracking-[0.08em] transition-opacity hover:opacity-70"
              >
                Свернуть
                <Icon name="ChevronLeft" size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {children}
            </div>

            {typeof resultCount === 'number' && (
              <button
                onClick={close}
                className="flex flex-none items-center justify-between border-t-2 border-primary bg-foreground px-4 py-3.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Показать {resultCount}
                <Icon name="ArrowRight" size={16} />
              </button>
            )}
          </aside>
        </>
      )}
    </>
  );
};

export default FloatingFilters;
