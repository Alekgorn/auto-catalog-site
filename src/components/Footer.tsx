import { Link } from 'react-router-dom';
import { useCatalog } from '@/context/CatalogContext';
import { telHref } from '@/lib/site-settings';
import { slugify } from '@/lib/slug';

const COLS: { title: string; links: string[]; target?: string; route?: string }[] = [
  {
    title: 'Покупателю',
    links: ['Подбор по авто', 'Доставка', 'Оплата', 'Возврат', 'Гарантия'],
    target: 'select',
  },
  {
    title: 'Инструкции',
    links: ['Подключение с фото', 'Все инструкции'],
    route: '/guides',
  },
  {
    title: 'Компания',
    links: ['О складе', 'Контакты', 'Для установщиков'],
    target: 'contacts',
  },
];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const hrefFor = (col: { target?: string; route?: string }) =>
  col.route ?? `/#${col.target ?? ''}`;

const Footer = () => {
  const { products, contacts, categories, brands } = useCatalog();

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
          Автоэлектроника и комплектующие с подбором по марке, модели и году выпуска.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="md:col-span-2">
          <div className="eyebrow">Каталог</div>
          <ul className="mt-4 space-y-2 text-[0.9rem]">
            {categories.map((c) => (
              <li key={c}>
                <Link
                  to={`/catalog/${slugify(c)}`}
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {COLS.map((col) => (
        <div key={col.title} className="md:col-span-2 md:col-start-auto">
          <div className="eyebrow">{col.title}</div>
          <ul className="mt-4 space-y-2 text-[0.9rem]">
            {col.links.map((l) => (
              <li key={l}>
                <Link
                  to={hrefFor(col)}
                  onClick={(e) => {
                    if (!col.route && window.location.pathname === '/') {
                      e.preventDefault();
                      if (col.target) scrollTo(col.target);
                    } else if (col.route) {
                      window.scrollTo({ top: 0 });
                    }
                  }}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="col-span-2 md:col-span-3">
        <div className="eyebrow">Связь</div>
        <a
          href={telHref(contacts.phone)}
          className="mt-4 block font-head text-2xl font-bold tracking-tight transition-colors hover:text-primary"
        >
          {contacts.phone}
        </a>
        <a
          href={`mailto:${contacts.email}`}
          className="mt-2 block text-muted-foreground transition-colors hover:text-primary"
        >
          {contacts.email}
        </a>
        <div className="mt-3 text-[0.85rem] text-muted-foreground">
          {contacts.address}
        </div>
      </div>
    </div>

    {brands.length > 0 && (
      <>
        <div className="rule-hair" />
        <nav aria-label="Подбор по маркам" className="py-6">
          <div className="eyebrow">Оборудование по маркам авто</div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem]">
            {brands.map((b) => (
              <li key={b.name}>
                <Link
                  to={`/brand/${slugify(b.name)}`}
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </>
    )}

    {products.length > 0 && (
      <>
        <div className="rule-hair" />
        <nav aria-label="Все товары" className="py-6">
          <div className="eyebrow">Популярные позиции</div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem]">
            {products.slice(0, 24).map((p) => (
              <li key={p.id}>
                <Link
                  to={`/product/${p.id}`}
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </>
    )}

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