import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import {
  CatalogIssue,
  GROUP_TITLES,
  IssueGroup,
  collectIssues,
} from '@/lib/catalog-issues';

interface Props {
  products: AdminProduct[];
  brands: AdminBrand[];
  onEdit: (product: AdminProduct) => void;
}

const GROUPS: (IssueGroup | '')[] = ['', 'card', 'fits', 'wiring'];

/** Сколько строк показываем сразу — остальное по кнопке */
const PAGE = 60;

/**
 * Найденные проблемы — один список вместо пяти вкладок.
 *
 * Раньше расхождения в карточках, совместимость, комплект и сверка
 * проводок жили порознь, и часть правил повторялась: один товар
 * попадался в двух местах, а человек гадал, две это беды или одна.
 * Теперь всё в одном списке: сверху ошибки, рядом фильтр по типу.
 *
 * Ничего не чинится автоматически. Часть находок — не ошибки, а
 * особенность товара, и решать это должен тот, кто знает ассортимент.
 */
const IssuesPanel = ({ products, brands, onEdit }: Props) => {
  const [onlyActive, setOnlyActive] = useState(true);
  const [group, setGroup] = useState<IssueGroup | ''>('');
  const [rule, setRule] = useState('');
  const [shown, setShown] = useState(PAGE);

  const all = useMemo(
    () => collectIssues(products, brands, onlyActive),
    [products, brands, onlyActive],
  );

  const byGroup = useMemo(
    () => (group ? all.filter((i) => i.group === group) : all),
    [all, group],
  );

  /** Сколько находок у каждого правила — для кнопок фильтра */
  const rules = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    byGroup.forEach((i) => {
      const cur = map.get(i.rule);
      if (cur) cur.count += 1;
      else map.set(i.rule, { title: i.title, count: 1 });
    });
    return [...map.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [byGroup]);

  const list = useMemo(
    () => (rule ? byGroup.filter((i) => i.rule === rule) : byGroup),
    [byGroup, rule],
  );

  const errors = all.filter((i) => i.level === 'error').length;

  const groupCount = (g: IssueGroup | '') =>
    g ? all.filter((i) => i.group === g).length : all.length;

  const row = (issue: CatalogIssue, i: number) => (
    <div
      key={`${issue.rule}-${issue.subject}-${i}`}
      className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border py-3"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.04em] ${
              issue.level === 'error'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground'
            }`}
          >
            {issue.title}
          </span>
          <span className="text-[0.88rem] leading-snug">{issue.subject}</span>
        </div>
        <div className="mt-1 text-[0.82rem] leading-snug text-muted-foreground">
          {issue.text}
        </div>
        {issue.hint && (
          <div className="mt-0.5 text-[0.78rem] leading-snug text-muted-foreground/80">
            {issue.hint}
          </div>
        )}
      </div>

      {issue.product && (
        <button
          onClick={() => onEdit(issue.product!)}
          className="flex flex-none items-center gap-1.5 border border-foreground px-3 py-1.5 font-head text-[0.7rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Pencil" size={13} />
          Открыть
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
          Всё, что каталог считает странным: пустые поля, годы вразнобой,
          марки не из справочника, дыры в связках рамка-проводка. Часть
          находок — особенность товара, а не ошибка, поэтому ничего не
          чинится само: список только показывает, куда смотреть.
        </p>
        <label className="flex flex-none cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-[0.82rem] text-muted-foreground">
            Только видимые на сайте
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="font-head text-[1.5rem] font-bold leading-none">
          {all.length}
        </span>
        <span className="text-[0.85rem] text-muted-foreground">
          находок, из них ошибок {errors}
        </span>
      </div>

      {/* Крупные группы — по тому, что чинить */}
      <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 border-b border-border pb-3">
        {GROUPS.map((g) => (
          <button
            key={g || 'all'}
            onClick={() => {
              setGroup(g);
              setRule('');
              setShown(PAGE);
            }}
            className={`border-b-2 pb-1.5 text-[0.78rem] uppercase tracking-[0.08em] transition-colors ${
              group === g
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {g ? GROUP_TITLES[g] : 'Всё'} ({groupCount(g)})
          </button>
        ))}
      </div>

      {/* Точный фильтр по правилу */}
      {rules.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setRule('');
              setShown(PAGE);
            }}
            className={`px-2.5 py-1 text-[0.75rem] transition-colors ${
              rule === ''
                ? 'bg-foreground text-background'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Все типы
          </button>
          {rules.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                setRule(r.key);
                setShown(PAGE);
              }}
              className={`px-2.5 py-1 text-[0.75rem] transition-colors ${
                rule === r.key
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.title} ({r.count})
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-foreground">
        {list.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Здесь чисто — каталог не нашёл, к чему придраться.
          </p>
        ) : (
          list.slice(0, shown).map(row)
        )}
      </div>

      {list.length > shown && (
        <button
          onClick={() => setShown((s) => s + PAGE)}
          className="mt-5 flex items-center gap-2 border border-foreground px-4 py-2.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Plus" size={15} />
          Показать ещё ({list.length - shown})
        </button>
      )}
    </div>
  );
};

export default IssuesPanel;
