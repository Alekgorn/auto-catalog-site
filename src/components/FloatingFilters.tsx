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
  /** Куда прокрутить после выбора — начало списка товаров */
  scrollTargetId?: string;
}

/** Длительность отъезда за край — столько же держим панель в разметке */
const SLIDE_MS = 400;

/** Насколько нужно проскроллить, чтобы вкладка спряталась или вернулась */
const SCROLL_STEP = 60;

/**
 * Фильтры плавающей панелью поверх каталога.
 *
 * Раньше фильтры занимали четверть ширины постоянной колонкой — на товары
 * оставалось меньше места, а на телефоне они и вовсе раздвигали список.
 * Теперь это узкая вкладка «Фильтр» у левого края, панель открывается по
 * нажатию, а каталог занимает всю ширину.
 *
 * Сама панель при заходе не выезжает: она перекрывала выбор авто как раз
 * в тот момент, когда человек только пришёл на страницу. На телефоне
 * вкладка вдобавок прячется, пока листают вниз, и возвращается при
 * движении вверх — иначе она висит поверх цен и названий товаров.
 */
const FloatingFilters = ({
  children,
  activeCount = 0,
  resultCount,
  hideOn,
  scrollTargetId,
}: Props) => {
  /* Панель открывается только по нажатию — сама не выезжает */
  const [open, setOpen] = useState(false);
  /** Панель ещё в разметке, пока доигрывает анимация отъезда */
  const [mounted, setMounted] = useState(false);
  /** Вкладка спрятана: листают вниз, читают товары */
  const [tabHidden, setTabHidden] = useState(false);

  /**
   * Листают вниз — убираем вкладку с глаз: она висит поверх карточек и
   * закрывает цену с названием. Повели вверх — возвращаем. На широком
   * экране прятать незачем, там места хватает.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < SCROLL_STEP) return;
      // У самого верха страницы вкладка нужна всегда
      setTabHidden(y > last && y > 200);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

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
      {/*
        Вкладка у левого края. На телефоне сидит ниже середины: там она не
        попадает ни на панель подбора авто сверху, ни на нижние панели
        сборки и сравнения. Прячется, пока панель открыта или листают вниз.
      */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Открыть фильтры"
        className={`fixed left-0 top-[72%] z-[55] flex -translate-y-1/2 flex-col items-center gap-2 rounded-r-2xl border-2 border-l-0 border-primary-foreground/30 bg-primary px-2.5 py-5 text-primary-foreground shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition-all duration-300 hover:px-3.5 md:top-1/2 ${
          open || tabHidden
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