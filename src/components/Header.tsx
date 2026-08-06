import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

const NAV = [
  { id: 'catalog', label: 'Каталог' },
  { id: 'select', label: 'Подбор' },
  { id: 'prices', label: 'Цены' },
  { id: 'install', label: 'Установка' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contacts', label: 'Контакты' },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Header = () => {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

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

  const go = (id: string) => {
    setOpen(false);
    setTimeout(() => scrollTo(id), 10);
  };

  return (
    <header
      className={`sticky top-0 z-50 section-pad transition-colors ${
        stuck ? 'bg-background/95 backdrop-blur border-b border-foreground' : 'bg-background'
      }`}
    >
      <div className="flex h-[76px] items-center justify-between gap-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 font-head text-xl font-bold uppercase tracking-[-0.02em]"
        >
          <span className="block h-4 w-4 flex-none bg-primary" />
          Штатно
        </button>

        <nav className="hidden gap-8 lg:flex xl:gap-10">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className="link-underline pb-0.5 text-[0.8rem] uppercase tracking-[0.1em]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <a
            href="tel:+78003334455"
            className="hidden font-head text-[0.95rem] font-medium tracking-tight md:block"
          >
            8 800 333-44-55
          </a>
          <button
            className="lg:hidden"
            aria-label="Меню"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'X' : 'Menu'} size={26} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-40 animate-fade-in bg-background section-pad lg:hidden">
          <div className="rule" />
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className="flex items-center justify-between border-b border-border py-5 text-left font-head text-2xl font-medium uppercase tracking-tight"
              >
                {item.label}
                <Icon name="ArrowRight" size={20} className="text-primary" />
              </button>
            ))}
          </nav>
          <a
            href="tel:+78003334455"
            className="mt-8 block font-head text-2xl font-bold text-primary"
          >
            8 800 333-44-55
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
