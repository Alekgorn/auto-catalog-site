import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import LogoMark from '@/components/ui/logo-mark';
import { useCatalog } from '@/context/CatalogContext';
import { telHref } from '@/lib/site-settings';
import { useCart } from '@/context/CartContext';
import DealerDialog from '@/components/DealerDialog';
import VehicleBadge from '@/components/VehicleBadge';

const NAV: { id: string; label: string; route?: string }[] = [
  { id: 'catalog', label: 'Каталог', route: '/scenario/vse-po-mashine' },
  { id: 'select', label: 'Подбор' },
  { id: 'guides', label: 'Инструкции', route: '/guides' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contacts', label: 'Контакты' },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Header = () => {
  const navigate = useNavigate();
  const { contacts } = useCatalog();
  const { count, setOpen: setCartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [dealerOpen, setDealerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id: string, route?: string) => {
    setOpen(false);
    if (route) {
      navigate(route);
      return;
    }
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scrollTo(id), 120);
      return;
    }
    setTimeout(() => scrollTo(id), 10);
  };

  return (
    <header
      className={`sticky top-0 z-50 section-pad transition-colors ${
        stuck ? 'bg-background/95 backdrop-blur border-b border-foreground' : 'bg-background'
      }`}
    >
      <div className="flex h-[76px] items-center justify-between gap-6">
        <Link
          to="/"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          aria-label="ШТАТНО — на главную"
          className="group flex items-center gap-2.5"
        >
          <LogoMark className="h-8 w-[34px] flex-none transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="wordmark text-[1.55rem]">
            Штат<span className="text-primary">но</span>
          </span>
        </Link>

        <nav className="hidden gap-6 lg:flex xl:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.id}
              to={item.route ?? `/#${item.id}`}
              onClick={(e) => {
                if (!item.route && window.location.pathname === '/') {
                  e.preventDefault();
                  go(item.id);
                }
              }}
              className="link-underline pb-0.5 text-[0.8rem] uppercase tracking-[0.1em]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 md:gap-6">
          <a
            href={telHref(contacts.phone)}
            className="hidden font-head text-[0.95rem] font-medium tracking-tight xl:block"
          >
            {contacts.phone}
          </a>
          {/* На узком экране номер не помещается — оставляем кнопку звонка,
              иначе позвонить можно только из меню */}
          <a
            href={telHref(contacts.phone)}
            aria-label={`Позвонить ${contacts.phone}`}
            className="transition-colors hover:text-primary xl:hidden"
          >
            <Icon name="Phone" size={21} />
          </a>
          <button
            onClick={() => {
              setOpen(false);
              setDealerOpen(true);
            }}
            className="hidden items-center gap-2 border border-foreground px-3.5 py-2 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary lg:flex"
          >
            <Icon name="BadgePercent" fallback="Tag" size={16} />
            Я дилер
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setCartOpen(true);
            }}
            aria-label="Заказ"
            className="relative flex items-center gap-2 transition-colors hover:text-primary"
          >
            <Icon name="ShoppingCart" size={22} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center bg-primary px-1 text-[0.65rem] font-medium text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            className="lg:hidden"
            aria-label="Меню"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'X' : 'Menu'} size={26} />
          </button>
        </div>
      </div>

      {/* Выбранная машина видна на любой странице — человек всегда знает,
          отфильтрован каталог или нет */}
      <VehicleBadge />

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-40 animate-fade-in bg-background section-pad lg:hidden">
          <div className="rule" />
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.id}
                to={item.route ?? `/#${item.id}`}
                onClick={(e) => {
                  if (!item.route && window.location.pathname === '/') {
                    e.preventDefault();
                    go(item.id);
                  } else {
                    setOpen(false);
                  }
                }}
                className="flex items-center justify-between border-b border-border py-5 text-left font-head text-2xl font-medium uppercase tracking-tight"
              >
                {item.label}
                <Icon name="ArrowRight" size={20} className="text-primary" />
              </Link>
            ))}
          </nav>
          <button
            onClick={() => {
              setOpen(false);
              setDealerOpen(true);
            }}
            className="mt-6 flex w-full items-center justify-between border border-foreground px-5 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
          >
            <span className="flex items-center gap-2">
              <Icon name="BadgePercent" fallback="Tag" size={18} />
              Я дилер
            </span>
            <Icon name="ArrowRight" size={18} className="text-primary" />
          </button>

          <a
            href={telHref(contacts.phone)}
            className="mt-6 block font-head text-2xl font-bold text-primary"
          >
            {contacts.phone}
          </a>
        </div>
      )}
      <DealerDialog open={dealerOpen} onOpenChange={setDealerOpen} />
    </header>
  );
};

export default Header;