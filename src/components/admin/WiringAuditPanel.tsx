import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import {
  findYearGaps,
  findBrandMismatch,
  findStaleFits,
} from '@/lib/wiring-audit';

interface Props {
  products: AdminProduct[];
  brands: AdminBrand[];
  onEdit: (product: AdminProduct) => void;
}

type View = 'years' | 'brand' | 'stale';

/**
 * Сверка проводок — три расхождения, которые не видно глазами.
 *
 * Все три не являются ошибками сами по себе: годы проводки честно могут
 * быть уже срока рамки, а марку в названии не пишут, если товар на
 * несколько марок. Поэтому ничего не исправляем автоматически — только
 * показываем, чтобы человек прошёл список раз в месяц вместо проверки
 * четырёхсот карточек вручную.
 */
const WiringAuditPanel = ({ products, brands, onEdit }: Props) => {
  const [view, setView] = useState<View>('stale');

  const gaps = useMemo(() => findYearGaps(products), [products]);
  const mismatch = useMemo(() => findBrandMismatch(products), [products]);
  const stale = useMemo(
    () => findStaleFits(products, brands),
    [products, brands],
  );

  const VIEWS: { id: View; label: string; count: number; hint: string }[] = [
    {
      id: 'stale',
      label: 'Устаревшие списки',
      count: stale.length,
      hint: 'Выбрано почти всё — похоже, брали «всю марку» перечнем. Переведите на «Выбрать все»: тогда новые модели подхватятся сами.',
    },
    {
      id: 'years',
      label: 'Годы против рамки',
      count: gaps.length,
      hint: 'Проводка закрывает не весь срок рамки. Часто это нормально — разные поколения электроники. Смотрим, нет ли опечатки в годах.',
    },
    {
      id: 'brand',
      label: 'Марка не в названии',
      count: mismatch.length,
      hint: 'Марка проставлена в совместимости, но в названии её нет. Либо отметили по ошибке, либо название неполное.',
    },
  ];

  const active = VIEWS.find((v) => v.id === view);

  return (
    <div className="py-6">
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-3">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`pb-1 text-[0.8rem] transition-colors ${
              view === v.id
                ? 'font-medium text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v.label}
            <span className="ml-1.5 opacity-70">{v.count}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 max-w-[46em] text-[0.83rem] leading-relaxed text-muted-foreground">
        {active?.hint}
      </p>

      {view === 'stale' && (
        <div className="mt-5 space-y-2">
          {stale.length === 0 && (
            <div className="text-[0.87rem] text-muted-foreground">
              Устаревших списков нет — все марки отмечены целиком.
            </div>
          )}
          {stale.map((s) => (
            <button
              key={`${s.product.slug}-${s.brand}`}
              onClick={() => onEdit(s.product)}
              className="flex w-full items-start justify-between gap-4 border border-border p-3.5 text-left transition-colors hover:border-foreground"
            >
              <div className="min-w-0">
                <div className="truncate text-[0.88rem] font-medium">
                  {s.product.name}
                </div>
                <div className="mt-1 text-[0.8rem] text-muted-foreground">
                  {s.brand}: выбрано {s.selected} из {s.total}. Не хватает:{' '}
                  {s.missing.join(', ')}
                </div>
              </div>
              <Icon
                name="ChevronRight"
                size={16}
                className="mt-0.5 flex-none text-muted-foreground"
              />
            </button>
          ))}
        </div>
      )}

      {view === 'years' && (
        <div className="mt-5 space-y-2">
          {gaps.length === 0 && (
            <div className="text-[0.87rem] text-muted-foreground">
              Все проводки покрывают срок своих рамок.
            </div>
          )}
          {gaps.map((g, i) => (
            <div
              key={`${g.frame.slug}-${g.wire.slug}-${i}`}
              className="border border-border p-3.5"
            >
              <button
                onClick={() => onEdit(g.frame)}
                className="block w-full truncate text-left text-[0.88rem] font-medium transition-colors hover:text-primary"
              >
                {g.frame.name}
                <span className="ml-2 font-normal text-muted-foreground">
                  {g.frameYears[0]}–{g.frameYears[1]}
                </span>
              </button>
              <button
                onClick={() => onEdit(g.wire)}
                className="mt-1.5 flex w-full items-start gap-2 text-left text-[0.8rem] text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="CornerDownRight" size={14} className="mt-0.5 flex-none" />
                <span className="min-w-0">
                  <span className="truncate">{g.wire.name}</span>{' '}
                  <span className="whitespace-nowrap">
                    {g.wireYears[0]}–{g.wireYears[1]}
                  </span>
                  <span className="ml-1 text-foreground">
                    — не закрывает {g.uncovered}
                  </span>
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {view === 'brand' && (
        <div className="mt-5 space-y-2">
          {mismatch.length === 0 && (
            <div className="text-[0.87rem] text-muted-foreground">
              Расхождений между марками и названиями нет.
            </div>
          )}
          {mismatch.map((m) => (
            <button
              key={m.product.slug}
              onClick={() => onEdit(m.product)}
              className="flex w-full items-start justify-between gap-4 border border-border p-3.5 text-left transition-colors hover:border-foreground"
            >
              <div className="min-w-0">
                <div className="truncate text-[0.88rem] font-medium">
                  {m.product.name}
                </div>
                <div className="mt-1 text-[0.8rem] text-muted-foreground">
                  В названии нет: {m.missing.join(', ')}
                  {m.present.length > 0 && ` · есть: ${m.present.join(', ')}`}
                </div>
              </div>
              <Icon
                name="ChevronRight"
                size={16}
                className="mt-0.5 flex-none text-muted-foreground"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WiringAuditPanel;
