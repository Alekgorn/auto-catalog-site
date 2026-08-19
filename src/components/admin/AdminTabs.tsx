export type AdminTab =
  | "products"
  | "guides"
  | "orders"
  | "dealers"
  | "brands"
  | "categories"
  | "site"
  | "settings";

interface Props {
  tab: AdminTab;
  onChange: (tab: AdminTab) => void;
  newOrders: number;
  productsCount: number;
  guidesCount: number;
  brandsCount: number;
  categoriesCount: number;
}

/** Панель вкладок админки со счётчиками заявок, товаров, инструкций и т.д. */
const AdminTabs = ({
  tab,
  onChange,
  newOrders,
  productsCount,
  guidesCount,
  brandsCount,
  categoriesCount,
}: Props) => (
  <div className="flex flex-wrap gap-8 border-b border-border py-5">
    {(
      [
        ["orders", newOrders > 0 ? `Заявки (${newOrders} новых)` : "Заявки"],
        ["products", `Товары (${productsCount})`],
        ["guides", `Инструкции (${guidesCount})`],
        ["brands", `Марки (${brandsCount})`],
        ["categories", `Категории (${categoriesCount})`],
        ["dealers", "Дилеры"],
        ["site", "Сайт"],
        ["settings", "Настройки"],
      ] as const
    ).map(([key, label]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`border-b-2 pb-2 text-[0.8rem] uppercase tracking-[0.1em] transition-colors ${
          tab === key
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

export default AdminTabs;
