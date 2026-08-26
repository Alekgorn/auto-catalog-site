import { Fragment } from "react";
import ProductCard from "@/components/ProductCard";
import UniversalDivider from "@/components/UniversalDivider";
import CatalogFilters, { FilterState } from "@/components/CatalogFilters";
import CategorySection, {
  CATEGORY_FIRST,
} from "@/components/scenario/CategorySection";
import FloatingFilters from "@/components/FloatingFilters";
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

  shown: number;
  onShowMore: () => void;

  /** Полный каталог: товары, разложенные по разделам */
  sections: { title: string; items: SearchHit[]; exactCount: number }[];
  /** Раздел → сколько его товаров показано */
  sectionShown: Record<string, number>;
  onSectionMore: (title: string) => void;
  onSectionCollapse: (title: string) => void;
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
  shown,
  onShowMore,
  sections,
  sectionShown,
  onSectionMore,
  onSectionCollapse,
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

    {/* Разделы сценария уехали в плавающую панель справа: раньше они
        занимали несколько строк над каталогом и отодвигали товары вниз */}
    {categories.length > 1 && !scenario.fullCatalog && (
      <FloatingFilters
        activeCount={category ? 1 : 0}
        resultCount={list.length}
        hideOn={category}
        scrollTargetId="catalog-top"
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onCategory("")}
            className={`flex items-center justify-between border px-3.5 py-2.5 text-left text-[0.82rem] transition-colors ${
              category
                ? "border-border bg-surface hover:border-primary hover:text-primary"
                : "border-foreground bg-foreground text-background"
            }`}
          >
            Все
            <span className="text-[0.75rem] opacity-70">{hitsCount}</span>
          </button>
          {categories.map(([c, n]) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
              className={`flex items-center justify-between gap-3 border px-3.5 py-2.5 text-left text-[0.82rem] transition-colors ${
                category === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:border-primary hover:text-primary"
              }`}
            >
              <span className="min-w-0 flex-1">{c}</span>
              <span className="flex-none text-[0.75rem] opacity-70">{n}</span>
            </button>
          ))}
        </div>
      </FloatingFilters>
    )}

    <div>
      {scenario.fullCatalog && (
        <FloatingFilters
          activeCount={filters.categories.length + filters.warranties.length}
          resultCount={list.length}
          hideOn={filters.categories.join("|")}
          scrollTargetId="catalog-top"
        >
          <CatalogFilters
            state={filters}
            bounds={bounds}
            categories={allCategories}
            warranties={warranties}
            counts={catalogCounts}
            onChange={onFilters}
            onReset={onResetFilters}
          />
        </FloatingFilters>
      )}

      {/* Полный каталог разложен по разделам: покупатель сразу видит,
          что вообще есть, и разворачивает только нужный раздел */}
      {scenario.fullCatalog ? (
        <div id="catalog-top">
          {sections.length === 0 ? (
            <div className="border border-border bg-surface px-5 py-8 text-center text-[0.9rem] text-muted-foreground">
              По заданным условиям товаров не нашлось. Снимите часть фильтров.
            </div>
          ) : (
            sections.map((s) => (
              <CategorySection
                key={s.title}
                title={s.title}
                items={s.items}
                shown={sectionShown[s.title] ?? CATEGORY_FIRST}
                exactCount={s.exactCount}
                vehicle={vehicle}
                onShowMore={() => onSectionMore(s.title)}
                onCollapse={() => onSectionCollapse(s.title)}
              />
            ))
          )}
        </div>
      ) : (
        <div>
          <div
            id="catalog-top"
            className="grid grid-cols-2 gap-3 pb-8 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {visible.map((h, i) => (
              <Fragment key={h.product.id}>
                {/* Граница между «точно встанет» и «подойдёт почти всем» */}
                {i === fit.exact.length && fit.universal.length > 0 && (
                  <UniversalDivider count={fit.universal.length} vehicle={vehicle} />
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
      )}
    </div>
  </>
);

export default ScenarioCatalog;