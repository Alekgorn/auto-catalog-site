import { useNavigate } from 'react-router-dom';

const COLS: { title: string; links: string[]; target?: string; route?: string }[] = [
  {
    title: 'Каталог',
    links: ['Фаркопы', 'Багажники', 'Пороги', 'Защита', 'Салон', 'Электроника'],
    target: 'catalog',
  },
  {
    title: 'Покупателю',
    links: ['Подбор по авто', 'Цены и акции', 'Установка', 'Доставка', 'Гарантия'],
    target: 'select',
  },
  {
    title: 'Инструкции',
    links: ['Установка с фото', 'Все инструкции'],
    route: '/guides',
  },
  {
    title: 'Компания',
    links: ['О складе', 'Контакты', 'Возврат', 'Оплата'],
    target: 'contacts',
  },
];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const Footer = () => {
  const navigate = useNavigate();

  const go = (col: { target?: string; route?: string }) => {
    if (col.route) {
      navigate(col.route);
      window.scrollTo({ top: 0 });
      return;
    }
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => col.target && scrollTo(col.target), 120);
      return;
    }
    if (col.target) scrollTo(col.target);
  };

  return (
  <footer className="section-pad bg-background">
    <div className="rule" />
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-12">
      <div className="col-span-2 md:col-span-3">
        <div className="flex items-center gap-3 font-head text-xl font-bold uppercase tracking-[-0.02em]">
          <span className="block h-4 w-4 flex-none bg-primary" />
          Штатно
        </div>
        <p className="mt-4 max-w-[22em] text-[0.88rem] leading-relaxed text-muted-foreground">
          Дополнительное оборудование для автомобиля с подбором по марке, модели и году
          выпуска.
        </p>
      </div>

      {COLS.map((col) => (
        <div key={col.title} className="md:col-span-2 md:col-start-auto">
          <div className="eyebrow">{col.title}</div>
          <ul className="mt-4 space-y-2 text-[0.9rem]">
            {col.links.map((l) => (
              <li key={l}>
                <button
                  onClick={() => go(col)}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="col-span-2 md:col-span-3">
        <div className="eyebrow">Связь</div>
        <a
          href="tel:+78003334455"
          className="mt-4 block font-head text-2xl font-bold tracking-tight transition-colors hover:text-primary"
        >
          8 800 333-44-55
        </a>
        <a
          href="mailto:zakaz@shtatno.ru"
          className="mt-2 block text-muted-foreground transition-colors hover:text-primary"
        >
          zakaz@shtatno.ru
        </a>
        <div className="mt-3 text-[0.85rem] text-muted-foreground">
          Москва, Кировоградская, 24, стр. 3
        </div>
      </div>
    </div>

    <div className="rule-hair" />
    <div className="grid grid-cols-1 gap-x-6 py-5 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground md:grid-cols-12">
      <div className="md:col-span-6">© 2026 Штатно · Розничная продажа</div>
      <div className="mt-2 md:col-span-6 md:mt-0 md:text-right">
        Цены на сайте не являются публичной офертой
      </div>
    </div>
  </footer>
  );
};

export default Footer;