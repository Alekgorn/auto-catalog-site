import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  /** Сами фильтры — готовая разметка CatalogFilters */
  children: React.ReactNode;
  /** Сколько условий выбрано — цифра на вкладке у края экрана */
  activeCount?: number;
  /** Сколько товаров осталось — подпись на кнопке «Показать» */
  resultCount?: number;
  /**
   * Растёт при выборе категории — панель уезжает, открывая результат.
   * Именно категории, а не любая правка: ползунок цены двигают подряд,
   * и панель убегала бы из-под пальца.
   */
  hideOn?: string;
}

/** Сколько панель висит открытой при заходе на страницу */
const SHOW_MS = 3000;
/** Длительность отъезда за край — столько же держим панель в разметке */
const SLIDE_MS = 400;

/**
 * Фильтры плавающей панелью поверх каталога.
 *
 * Раньше фильтры занимали четверть ширины постоянной колонкой — на товары
 * оставалось меньше места, а на телефоне они и вовсе раздвигали список.
 * Теперь панель показывается при заходе на пару секунд, уезжает за правый
 * край в узкую вкладку «Фильтр» и возвращается по нажатию. Каталог при
 * этом занимает всю ширину.
 */
const FloatingFilters = ({
  children,
  activeCount = 0,
  resultCount,
  hideOn,
}: Props) => {
  const [open, setOpen] = useState(true);
  /** Панель ещё в разметке, пока доигрывает анимация отъезда */
  const [mounted, setMounted] = useState(true);
  /** Первый показ — тот, что сам прячется; дальше закрывает только человек */
  const auto = useRef(true);

  /* Показали при заходе и убрали — дальше панель ждёт нажатия на вкладку */
  useEffect(() => {
    if (!auto.current) return;
    const t = setTimeout(() => {
      auto.current = false;
      setOpen(false);
    }, SHOW_MS);
    return () => clearTimeout(t);
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

  /* Категорию выбрали — прячем панель, чтобы стал виден новый список */
  const firstHide = useRef(true);
  useEffect(() => {
    if (firstHide.current) {
      firstHide.current = false;
      return;
    }
    auto.current = false;
    setOpen(false);
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
        className={`fixed right-0 top-1/2 z-[55] flex -translate-y-1/2 items-center gap-2 border-2 border-r-0 border-primary bg-primary px-2 py-4 text-primary-foreground shadow-lg transition-all duration-300 ${
          open
            ? 'pointer-events-none translate-x-full opacity-0'
            : 'translate-x-0 opacity-100'
        }`}
      >
        <span
          className="font-head text-[0.72rem] font-bold uppercase tracking-[0.14em]"
          style={{ writingMode: 'vertical-rl' }}
        >
          Фильтр
        </span>
        {activeCount > 0 && (
          <span className="absolute -left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[0.62rem] font-bold text-background">
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
            className={`fixed right-0 top-[92px] z-[56] flex max-h-[calc(100vh-120px)] w-[86%] max-w-[22rem] flex-col border-2 border-primary bg-surface-muted shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out sm:right-4 sm:w-[20rem] ${
              open ? 'translate-x-0' : 'translate-x-[110%]'
            }`}
          >
            <div className="flex flex-none items-center justify-between border-b-2 border-primary bg-primary px-4 py-3 text-primary-foreground">
              <span className="flex items-center gap-2 font-head text-[0.85rem] font-bold uppercase tracking-[0.08em]">
                <Icon name="SlidersHorizontal" size={16} />
                Фильтры
              </span>
              <button
                onClick={close}
                aria-label="Свернуть фильтры"
                className="flex items-center gap-1 text-[0.7rem] uppercase tracking-[0.08em] transition-opacity hover:opacity-70"
              >
                Свернуть
                <Icon name="ChevronRight" size={16} />
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
