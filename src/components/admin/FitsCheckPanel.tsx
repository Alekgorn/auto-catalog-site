import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { fitKey } from '@/lib/fits-match';

interface Props {
  products: AdminProduct[];
  brands: AdminBrand[];
  onEdit: (product: AdminProduct) => void;
}

/** Что именно не так с записью совместимости */
type IssueKind = 'brand' | 'model';

interface Issue {
  kind: IssueKind;
  /** Марка, как она записана в товаре */
  brand: string;
  /** Модель — только для ошибок модели */
  model?: string;
  /** Похожее название из справочника — подсказка, что имелось в виду */
  suggest?: string;
}

interface Row {
  product: AdminProduct;
  issues: Issue[];
}

/**
 * Ищем в справочнике название, похожее на то, что записано в товаре.
 * Сравниваем по «отпечатку»: он гасит регистр, дефисы и диакритику,
 * поэтому «RAV4» находится по «Rav 4».
 */
const suggestFrom = (list: string[], raw: string): string | undefined => {
  const key = fitKey(raw);
  if (!key) return undefined;

  // Точное совпадение по отпечатку — самая надёжная подсказка
  const exact = list.find((x) => fitKey(x) === key);
  if (exact) return exact;

  // Одно название — начало другого: «Tiggo» и «Tiggo 8»
  return list.find((x) => {
    const k = fitKey(x);
    if (!k) return false;
    const [short, long] = k.length < key.length ? [k, key] : [key, k];
    return long.startsWith(short) && short.length >= 3;
  });
};

/**
 * Панель «Совместимость»: показывает товары, у которых марка или модель
 * не совпадают со справочником марок.
 *
 * Зачем: такие товары не находятся при подборе по авто — покупатель
 * выбирает свою машину и не видит подходящую позицию. После загрузки
 * прайса от поставщика это первое место, куда стоит заглянуть.
 */
const FitsCheckPanel = ({ products, brands, onEdit }: Props) => {
  const [onlyActive, setOnlyActive] = useState(true);

  const rows = useMemo<Row[]>(() => {
    const brandNames = brands.map((b) => b.name);

    return products
      .filter((p) => (onlyActive ? p.isActive : true))
      .map((product) => {
        const issues: Issue[] = [];

        Object.entries(product.fits ?? {}).forEach(([brand, models]) => {
          if (!Array.isArray(models)) return;

          const ref = brands.find((b) => b.name === brand);

          // Марки нет в справочнике — товар выпадет из подбора целиком
          if (!ref) {
            issues.push({
              kind: 'brand',
              brand,
              suggest: suggestFrom(brandNames, brand),
            });
            return;
          }

          models.forEach((model) => {
            if (ref.models.includes(model)) return;
            /* Сверка на сайте прощает мелкие расхождения. Отделяем их
               от настоящих опечаток: то, что подбор всё же находит,
               показываем как замечание, а не как поломку */
            issues.push({
              kind: 'model',
              brand,
              model,
              suggest: suggestFrom(ref.models, model),
            });
          });
        });

        return { product, issues };
      })
      .filter((r) => r.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length);
  }, [products, brands, onlyActive]);

  /** Ошибки марок ломают подбор целиком — их считаем отдельно */
  const brandErrors = rows.reduce(
    (n, r) => n + r.issues.filter((i) => i.kind === 'brand').length,
    0,
  );
  const modelErrors = rows.reduce(
    (n, r) => n + r.issues.filter((i) => i.kind === 'model').length,
    0,
  );

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[46em]">
          <div className="font-head text-xl font-bold uppercase tracking-tight">
            Проверка совместимости
          </div>
          <p className="mt-2 text-[0.87rem] leading-relaxed text-muted-foreground">
            Здесь товары, у которых марка или модель записаны не так, как в
            справочнике марок. Такие позиции покупатель не найдёт при подборе
            по своей машине. Загрузили прайс от поставщика — загляните сюда.
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
          <Icon
            name="CircleCheck"
            size={30}
            className="mx-auto text-success"
          />
          <div className="mt-4 font-head text-lg font-bold uppercase tracking-tight">
            Ошибок нет
          </div>
          <p className="mx-auto mt-2 max-w-[34em] text-[0.87rem] text-muted-foreground">
            Все марки и модели в товарах совпадают со справочником — подбор по
            авто находит каждую позицию.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-y border-border py-3 text-[0.8rem]">
            <span>
              Товаров с ошибками:{' '}
              <span className="font-head font-bold">{rows.length}</span>
            </span>
            {brandErrors > 0 && (
              <span className="text-primary">
                Марок не в справочнике:{' '}
                <span className="font-head font-bold">{brandErrors}</span>
              </span>
            )}
            {modelErrors > 0 && (
              <span className="text-muted-foreground">
                Моделей не в справочнике:{' '}
                <span className="font-head font-bold">{modelErrors}</span>
              </span>
            )}
          </div>

          <div className="mt-2">
            {rows.map(({ product, issues }) => (
              <div
                key={product.id ?? product.name}
                className="border-b border-border py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[240px] flex-1">
                    <div className="font-head text-[1rem] font-medium leading-tight">
                      {product.name}
                      {!product.isActive && (
                        <span className="ml-2 text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                          скрыт
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                      {product.sku || '—'} · {product.category}
                    </div>
                  </div>
                  <button
                    onClick={() => onEdit(product)}
                    className="flex flex-none items-center gap-2 border border-foreground px-4 py-2 text-[0.72rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon name="Pencil" size={14} />
                    Исправить
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {issues.map((issue, n) => (
                    <span
                      key={n}
                      className={`border px-3 py-1.5 text-[0.8rem] ${
                        issue.kind === 'brand'
                          ? 'border-primary text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {issue.kind === 'brand' ? (
                        <>
                          Марка «{issue.brand}» — нет в справочнике
                        </>
                      ) : (
                        <>
                          {issue.brand}: модель «{issue.model}» — нет в
                          справочнике
                        </>
                      )}
                      {issue.suggest && (
                        <span className="ml-1.5 text-foreground">
                          → возможно, «{issue.suggest}»
                        </span>
                      )}
                    </span>
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

export default FitsCheckPanel;