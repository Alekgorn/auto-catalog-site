export type AdminTab =
  | "products"
  | "guides"
  | "orders"
  | "dealers"
  | "brands"
  | "categories"
  | "fits"
  | "missing-fit"
  | "site"
  | "storage"
  | "settings";

interface Props {
  tab: AdminTab;
  onChange: (tab: AdminTab) => void;
  newOrders: number;
  productsCount: number;
  guidesCount: number;
  brandsCount: number;
  categoriesCount: number;
  /** Сколько товаров с ошибками совместимости — счётчик у вкладки */
  fitsIssues: number;
  /** Машины, под которые не собрался комплект */
  missingFits: number;
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
  fitsIssues,
  missingFits,
}: Props) => (
  <div className="flex flex-wrap gap-8 border-b border-border py-5">
    {(
      [
        ["orders", newOrders > 0 ? `Заявки (${newOrders} новых)` : "Заявки"],
        ["products", `Товары (${productsCount})`],
        ["guides", `Инструкции (${guidesCount})`],
        ["brands", `Марки (${brandsCount})`],
        ["categories", `Категории (${categoriesCount})`],
        [
          "fits",
          fitsIssues > 0
            ? `Совместимость (${fitsIssues})`
            : "Совместимость",
        ],
        [
          "missing-fit",
          missingFits > 0 ? `Нет решения (${missingFits})` : "Нет решения",
        ],
        ["dealers", "Дилеры"],
        ["site", "Сайт"],
        ["storage", "Хранилище"],
        ["settings", "Настройки"],
      ] as const
    ).map(([key, label]) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`border-b-2 pb-2 text-[0.8rem] uppercase tracking-[0.1em] transition-colors ${
          tab === key
            ? "border-primary text-primary"
            : (key === "fits" && fitsIssues > 0) ||
                (key === "missing-fit" && missingFits > 0)
              ? // Ошибки совместимости прячут товары от покупателя, а машины
                // без решения — это упущенный спрос. И то и другое видно сразу
                "border-transparent text-primary hover:text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

export default AdminTabs;