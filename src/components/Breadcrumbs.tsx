import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { SITE_URL } from "@/lib/seo";

export interface Crumb {
  /** Надпись в цепочке */
  label: string;
  /** Адрес страницы. У последнего звена не указывается */
  to?: string;
}

/**
 * Цепочка «Главная → Раздел → Страница» под шапкой.
 * Показывает покупателю, где он находится, и даёт вернуться на шаг назад.
 */
const Breadcrumbs = ({ items }: { items: Crumb[] }) => (
  <nav
    aria-label="Вы находитесь здесь"
    className="flex flex-wrap items-center gap-x-2 gap-y-1 py-5 text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground"
  >
    <Link to="/" className="transition-colors hover:text-primary">
      Главная
    </Link>
    {items.map((item, i) => (
      <span key={`${item.label}-${i}`} className="flex items-center gap-x-2">
        <Icon name="ChevronRight" size={13} className="flex-none opacity-60" />
        {item.to && i < items.length - 1 ? (
          <Link to={item.to} className="transition-colors hover:text-primary">
            {item.label}
          </Link>
        ) : (
          <span className="text-foreground" aria-current="page">
            {item.label}
          </span>
        )}
      </span>
    ))}
  </nav>
);

/** Та же цепочка для поисковых систем — показывают её в результатах выдачи. */
export const crumbsJsonLd = (items: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ label: "Главная", to: "/" }, ...items].map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.label,
    ...(item.to ? { item: `${SITE_URL}${item.to}` } : {}),
  })),
});

export default Breadcrumbs;
