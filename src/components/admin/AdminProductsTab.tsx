import Icon from "@/components/ui/icon";
import { formatPrice } from "@/data/catalog";
import { AdminProduct } from "@/components/admin/ProductEditor";
import BulkBar from "@/components/admin/BulkBar";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  loading: boolean;
  filtered: AdminProduct[];
  allChecked: boolean;
  someChecked: boolean;
  selected: number[];
  onToggleAll: () => void;
  onToggleOne: (id?: number) => void;
  onToggleActive: (product: AdminProduct) => void;
  onEdit: (product: AdminProduct) => void;
  onRemove: (product: AdminProduct) => void;
  /** Создать заготовку нового товара на основе этого */
  onDuplicate: (product: AdminProduct) => void;
  /** Выбранная категория; пустая строка — показаны все товары */
  category: string;
  onCategoryChange: (value: string) => void;
  /** Сколько товаров в каждой категории — цифры на кнопках */
  categoryCounts: Record<string, number>;
  /** Сколько товаров всего — цифра на кнопке «Все» */
  totalCount: number;
  categories: string[];
  bulkBusy: boolean;
  onBulkMove: (category: string) => void;
  onBulkVisibility: (op: "show" | "hide") => void;
  onBulkDelete: () => void;
  onBulkClear: () => void;
}

/** Вкладка «Товары»: поиск, список с массовым выделением, панель массовых действий. */
const AdminProductsTab = ({
  search,
  onSearchChange,
  onCreate,
  loading,
  filtered,
  allChecked,
  someChecked,
  selected,
  onToggleAll,
  onToggleOne,
  onToggleActive,
  onEdit,
  onRemove,
  onDuplicate,
  category,
  onCategoryChange,
  categoryCounts,
  totalCount,
  categories,
  bulkBusy,
  onBulkMove,
  onBulkVisibility,
  onBulkDelete,
  onBulkClear,
}: Props) => (
  <>
    <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск по названию или категории"
        className="w-full max-w-sm border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary"
      />
      <button
        onClick={onCreate}
        className="flex items-center justify-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Icon name="Plus" size={16} />
        Добавить товар
      </button>
    </div>

    {/*
      Раньше все товары лежали одним списком — среди тысячи позиций нужную
      искали только поиском. Теперь сверху раскладка по каталогам: видно,
      сколько товаров в каждом, и можно работать с одним разделом.
    */}
    {categories.length > 0 && (
      <div className="mb-5 flex flex-wrap gap-2 border-b border-border pb-5">
        <button
          onClick={() => onCategoryChange("")}
          className={`px-3.5 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors ${
            category === ""
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          Все
          <span className="ml-2 opacity-60">{totalCount}</span>
        </button>

        {categories.map((c) => (
          <button
            key={c}
            onClick={() => onCategoryChange(c)}
            className={`px-3.5 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors ${
              category === c
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {c}
            <span className="ml-2 opacity-60">{categoryCounts[c] ?? 0}</span>
          </button>
        ))}
      </div>
    )}

    {loading ? (
      <div className="py-20 text-center text-muted-foreground">
        Загружаем…
      </div>
    ) : filtered.length === 0 ? (
      <div className="py-20 text-center text-muted-foreground">
        Товаров не найдено
      </div>
    ) : (
      <div className="border-t border-foreground">
        <label className="flex cursor-pointer items-center gap-4 border-b border-border py-3">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => {
              if (el) el.indeterminate = someChecked && !allChecked;
            }}
            onChange={onToggleAll}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          <span className="text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground">
            {allChecked ? "Снять выделение" : `Выбрать все — ${filtered.length}`}
          </span>
        </label>

        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-4 border-b border-border py-4"
          >
            <input
              type="checkbox"
              checked={!!p.id && selected.includes(p.id)}
              onChange={() => onToggleOne(p.id)}
              aria-label={`Выбрать ${p.name}`}
              className="h-4 w-4 flex-none cursor-pointer accent-primary"
            />
            <img
              src={p.images?.[0] ?? ""}
              alt=""
              className="h-14 w-14 flex-none bg-card object-contain p-1"
            />
            <div className="min-w-[200px] flex-1">
              <div className="font-head text-[1rem] font-medium leading-tight">
                {p.name}
              </div>
              <div className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                {p.sku || "—"} · {p.category} ·{" "}
                {Object.keys(p.fits ?? {}).length} марок
              </div>
            </div>
            <div className="font-head text-lg font-bold">
              {formatPrice(p.price)}
            </div>
            <button
              onClick={() => onToggleActive(p)}
              className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
                p.isActive
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {p.isActive ? "На сайте" : "Скрыт"}
            </button>
            <button
              onClick={() => onEdit(p)}
              className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
            >
              Изменить
            </button>
            <button
              onClick={() => onDuplicate(p)}
              title="Создать копию — заготовку для похожего товара"
              aria-label={`Копировать ${p.name}`}
              className="border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Icon name="Copy" size={16} />
            </button>
            <button
              onClick={() => onRemove(p)}
              aria-label="Удалить"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name="Trash2" size={17} />
            </button>
          </div>
        ))}
      </div>
    )}

    <BulkBar
      count={selected.length}
      categories={categories}
      busy={bulkBusy}
      onMove={onBulkMove}
      onVisibility={onBulkVisibility}
      onDelete={onBulkDelete}
      onClear={onBulkClear}
    />
  </>
);

export default AdminProductsTab;