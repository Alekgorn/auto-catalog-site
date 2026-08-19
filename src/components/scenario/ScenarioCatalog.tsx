import { Fragment } from "react";
import Icon from "@/components/ui/icon";
import ProductCard from "@/components/ProductCard";
import UniversalDivider from "@/components/UniversalDivider";
import CatalogFilters, { FilterState } from "@/components/CatalogFilters";
import { Vehicle } from "@/data/catalog";
import { Scenario } from "@/data/scenarios";
import { SearchHit } from "@/lib/smart-search";

export type SortKey = "relevance" | "price-asc" | "price-desc" | "name";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "по совпадению" },
  { key: "price-asc", label: "сначала дешёвые" },
  { key: "price-desc", label: "сначала дорогие" },
  { key: "name", label: "по названию" },
];

interface Props {
  scenario: Scenario;
  /** Отфильтрованный и отсортированный список */
  list: SearchHit[];
  /** Точные и универсальные — для разделителя между блоками */
  fit: { exact: SearchHit[]; universal: SearchHit[] };
  ordered: SearchHit[];
  visible: SearchHit[];
  hitsCount: number;
  vehicle: Vehicle | null;

  sort: SortKey;
  onSort: (v: SortKey) => void;

  /** Кнопки-группы над каталогом */
  categories: [string, number][];
  category: string;
  onCategory: (v: string) => void;

  /** Развёрнутые фильтры слева — только в полном каталоге */
  filters: FilterState;
  onFilters: (v: FilterState) => void;
  onResetFilters: () => void;
  bounds: { min: number; max: number };
  allCategories: string[];
  warranties: string[];
  catalogCounts: Record<string, number>;
  mobileFilters: boolean;
  onMobileFilters: (v: boolean) => void;

  shown: number;
  onShowMore: () => void;
}

/**
 * Список товаров сценария: счётчик и сортировка, кнопки-группы,
 * боковые фильтры полного каталога, сетка карточек и «показать ещё».
 */
const ScenarioCatalog = ({
  scenario,
  list,
  fit,
  ordered,
  visible,
  hitsCount,
  vehicle,
  sort,
  onSort,
  categories,
  category,
  onCategory,
  filters,
  onFilters,
  onResetFilters,
  bounds,
  allCategories,
  warranties,
  catalogCounts,
  mobileFilters,
  onMobileFilters,
  shown,
  onShowMore,
}: Props) => (
  <>
    <div
      id="catalog-list"
      className="flex scroll-mt-24 flex-wrap items-center justify-between gap-4 py-5"
    >
      <div className="text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
        Всего товаров: {list.length}
      </div>
      <label className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
        Сортировка
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="border border-border bg-surface px-3 py-2 text-[0.8rem] normal-case tracking-normal text-foreground outline-none transition-colors hover:border-primary"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>

    {categories.length > 1 && !scenario.fullCatalog && (
      <div className="flex flex-wrap gap-2 pb-6">
        <button
          onClick={() => onCategory("")}
          className={`border px-3.5 py-2 text-[0.78rem] transition-colors ${
            category
              ? "border-border bg-surface hover:border-primary hover:text-primary"
              : "border-foreground bg-foreground text-background"
          }`}
        >
          Все ({hitsCount})
        </button>
        {categories.map(([c, n]) => (
          <button
            key={c}
            onClick={() => onCategory(c)}
            className={`border px-3.5 py-2 text-[0.78rem] transition-colors ${
              category === c
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface hover:border-primary hover:text-primary"
            }`}
          >
            {c} ({n})
          </button>
        ))}
      </div>
    )}

    <div
      className={
        scenario.fullCatalog ? "grid grid-cols-1 gap-x-6 lg:grid-cols-12" : ""
      }
    >
      {scenario.fullCatalog && (
        <>
          {/* Кнопка фильтров на телефоне */}
          <button
            onClick={() => onMobileFilters(!mobileFilters)}
            className="mb-4 flex items-center justify-between border border-foreground px-4 py-3 text-[0.8rem] uppercase tracking-[0.1em] lg:hidden"
          >
            Фильтры
            <Icon name={mobileFilters ? "X" : "SlidersHorizontal"} size={17} />
          </button>

          <aside
            className={`lg:col-span-3 ${mobileFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="border border-border bg-surface p-4 lg:sticky lg:top-[100px]">
              <CatalogFilters
                state={filters}
                bounds={bounds}
                categories={allCategories}
                warranties={warranties}
                counts={catalogCounts}
                onChange={onFilters}
                onReset={onResetFilters}
              />
            </div>
          </aside>
        </>
      )}

      <div className={scenario.fullCatalog ? "lg:col-span-9" : ""}>
        <div
          className={`grid grid-cols-2 gap-3 pb-8 md:gap-4 ${
            scenario.fullCatalog ? "lg:grid-cols-3" : "lg:grid-cols-4"
          }`}
        >
          {visible.map((h, i) => (
            <Fragment key={h.product.id}>
              {/* Граница между «точно встанет» и «подойдёт почти всем» */}
              {i === fit.exact.length && fit.universal.length > 0 && (
                <UniversalDivider count={fit.universal.length} />
              )}
              <ProductCard product={h.product} vehicle={vehicle} />
            </Fragment>
          ))}
        </div>

        {shown < ordered.length && (
          <div className="pb-10 text-center">
            <button
              onClick={onShowMore}
              className="border border-foreground px-6 py-3 text-[0.8rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
            >
              Показать ещё
            </button>
          </div>
        )}
      </div>
    </div>
  </>
);

export default ScenarioCatalog;
