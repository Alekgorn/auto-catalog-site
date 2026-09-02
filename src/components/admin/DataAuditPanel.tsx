import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { RULE_TITLES, auditProducts } from '@/lib/data-audit';

interface Props {
  products: AdminProduct[];
  /** Открыть карточку в редакторе — чинить сразу, не уходя со списка */
  onEdit: (product: AdminProduct) => void;
}

/**
 * Проверка данных каталога.
 *
 * Показывает расхождения внутри карточек: год в названии против поля,
 * перевёрнутый диапазон, пустые описания и характеристики. Только
 * список — правки делает человек, потому что часть «ошибок» на деле
 * особенность товара, и решать это должен тот, кто знает ассортимент.
 */
const DataAuditPanel = ({ products, onEdit }: Props) => {
  const [onlyActive, setOnlyActive] = useState(true);
  const [rule, setRule] = useState<string>('');

  const rows = useMemo(
    () => auditProducts(products, onlyActive),
    [products, onlyActive],
  );

  /** Сколько товаров задето каждым правилом — для кнопок-фильтров */
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const seen = new Set<string>();
      r.issues.forEach((i) => {
        if (seen.has(i.rule)) return;
        seen.add(i.rule);
        map[i.rule] = (map[i.rule] ?? 0) + 1;
      });
    });
    return map;
  }, [rows]);

  const shown = useMemo(
    () => (rule ? rows.filter((r) => r.issues.some((i) => i.rule === rule)) : rows),
    [rows, rule],
  );

  const errors = rows.filter((r) =>
    r.issues.some((i) => i.level === 'error'),
  ).length;

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[46em]">
          <div className="font-head text-xl font-bold uppercase tracking-tight">
            Проверка данных
          </div>
          <p className="mt-2 text-[0.87rem] leading-relaxed text-muted-foreground">
            Ищем расхождения внутри карточек: год в названии не сходится с
            полем годов, диапазон задом наперёд, пустое описание. Здесь
            ничего не меняется — только список, что стоит посмотреть.
            Часть находок окажется нормой, решаете вы.
          </p>
        </div>
        <button
          onClick={() => setOnlyActive((v) => !v)}
          className="flex flex-none items-center gap-2 border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-foreground"
        >
          <Icon name={onlyActive ? 'SquareCheck' : 'Square'} size={15} />
          Только видимые на сайте
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 border border-border bg-surface px-6 py-14 text-center">
          <Icon name="CircleCheck" size={30} className="mx-auto text-success" />
          <div className="mt-4 font-head text-lg font-bold uppercase tracking-tight">
            Расхождений нет
          </div>
          <p className="mx-auto mt-2 max-w-[34em] text-[0.87rem] text-muted-foreground">
            Все карточки заполнены без противоречий.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-y border-border py-3 text-[0.8rem]">
            <span>
              Карточек с замечаниями:{' '}
              <span className="font-head font-bold">{rows.length}</span>
            </span>
            {errors > 0 && (
              <span className="text-primary">
                Из них требуют внимания:{' '}
                <span className="font-head font-bold">{errors}</span>
              </span>
            )}
            <span className="text-muted-foreground">
              Проверено товаров:{' '}
              <span className="font-head font-bold">{products.length}</span>
            </span>
          </div>

          {/* Фильтр по виду замечания — чинить удобнее пачкой одного типа */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setRule('')}
              className={`border px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.06em] transition-colors ${
                rule === ''
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground'
              }`}
            >
              Все ({rows.length})
            </button>
            {Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([key, n]) => (
                <button
                  key={key}
                  onClick={() => setRule(key === rule ? '' : key)}
                  className={`border px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.06em] transition-colors ${
                    rule === key
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground'
                  }`}
                >
                  {RULE_TITLES[key] ?? key} ({n})
                </button>
              ))}
          </div>

          <div className="mt-2">
            {shown.map(({ product, issues }) => (
              <div key={product.id ?? product.slug ?? product.name} className="border-b border-border py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-left font-head text-[0.95rem] font-bold transition-colors hover:text-primary"
                    >
                      {product.name}
                    </button>
                    <div className="mt-0.5 text-[0.75rem] text-muted-foreground">
                      {product.category}
                      {product.sku ? ` · ${product.sku}` : ''}
                      {product.isActive ? '' : ' · скрыт с сайта'}
                    </div>
                  </div>
                  <button
                    onClick={() => onEdit(product)}
                    className="flex flex-none items-center gap-1.5 border border-border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] transition-colors hover:border-foreground"
                  >
                    <Icon name="Pencil" size={13} />
                    Открыть
                  </button>
                </div>

                <div className="mt-2 space-y-1.5">
                  {issues.map((issue, i) => (
                    <div
                      key={`${issue.rule}-${i}`}
                      className="flex items-start gap-2 text-[0.82rem]"
                    >
                      <Icon
                        name={
                          issue.level === 'error' ? 'TriangleAlert' : 'Info'
                        }
                        size={14}
                        className={`mt-0.5 flex-none ${
                          issue.level === 'error'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span className="min-w-0">
                        <span
                          className={
                            issue.level === 'error' ? 'text-foreground' : ''
                          }
                        >
                          {issue.text}
                        </span>
                        {issue.hint && (
                          <span className="block text-[0.76rem] text-muted-foreground">
                            {issue.hint}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DataAuditPanel;
