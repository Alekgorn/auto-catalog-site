import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import GuideContent from '@/components/GuideContent';
import { Guide, Product, productDescription, productKit } from '@/data/catalog';

export type ProductTab = 'about' | 'notes' | 'extra' | 'guides';

interface Props {
  product: Product;
  guides: Guide[];
  /** Вкладка, которую нужно открыть снаружи — например по кнопке «Инструкция» */
  active: ProductTab;
  onChange: (tab: ProductTab) => void;
}

/**
 * Описание товара тремя вкладками: как устроено, нюансы монтажа и инструкции.
 * Нюансы подсвечены, только если продавец их заполнил.
 */
const ProductTabs = ({ product, guides, active, onChange }: Props) => {
  const notes = product.notes ?? [];
  const hasNotes = notes.length > 0;
  /* Свой раздел магазина. Показываем только когда задан заголовок
     и есть содержимое — иначе вкладка была бы безымянной */
  const extra = product.extra ?? [];
  const extraTitle = (product.extraTitle ?? '').trim();
  const hasExtra = extra.length > 0 && !!extraTitle;
  const hasGuides = guides.length > 0;
  const [openGuides, setOpenGuides] = useState<string[]>([]);

  useEffect(() => {
    setOpenGuides([]);
  }, [product.id]);

  const toggleGuide = (slug: string) =>
    setOpenGuides((list) =>
      list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug],
    );

  const tabs: {
    key: ProductTab;
    label: string;
    icon: string;
    disabled?: boolean;
  }[] = [
    { key: 'about', label: 'Как это устроено', icon: 'FileText' },
    {
      key: 'notes',
      label: hasNotes ? 'Нюансы монтажа' : 'Установка стандартная',
      icon: hasNotes ? 'TriangleAlert' : 'Check',
      disabled: !hasNotes,
    },
    ...(hasExtra
      ? [
          {
            key: 'extra' as ProductTab,
            label: extraTitle,
            icon: 'Images',
          },
        ]
      : []),
    ...(hasGuides
      ? [
          {
            key: 'guides' as ProductTab,
            label: guides.length > 1 ? 'Инструкции' : 'Инструкция',
            icon: 'BookOpen',
          },
        ]
      : []),
  ];

  return (
    <div>
      {/* Вкладки — заметные кнопки: раньше выглядели как бледный текст и их пролистывали */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = active === t.key && !t.disabled;
          return (
            <button
              key={t.key}
              onClick={() => !t.disabled && onChange(t.key)}
              disabled={t.disabled}
              aria-selected={isActive}
              title={
                t.disabled
                  ? 'Особенностей нет — ставится штатно, без доработок'
                  : undefined
              }
              className={`flex items-center gap-2 border px-4 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : t.disabled
                    ? 'cursor-default border-border bg-surface-muted text-muted-foreground'
                    : 'border-foreground text-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {active === 'about' && (
        <div className="pt-7">
          <div className="space-y-4 text-muted-foreground">
            {productDescription(product).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-8">
            <div className="eyebrow">Комплектация</div>
            <ul className="mt-4 space-y-2">
              {productKit(product).map((k) => (
                <li
                  key={k}
                  className="flex items-start gap-3 border-b border-border pb-2 text-[0.9rem]"
                >
                  <Icon
                    name="Check"
                    size={15}
                    className="mt-1 flex-none text-primary"
                  />
                  {k}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {active === 'notes' && hasNotes && (
        <div className="pt-7">
          <GuideContent
            guide={
              {
                slug: `${product.id}-notes`,
                title: product.name,
                excerpt: '',
                cover: '',
                duration: '',
                difficulty: '',
                tools: [],
                blocks: notes,
                products: [],
              } as Guide
            }
            compact
          />
        </div>
      )}

      {active === 'extra' && hasExtra && (
        <div className="pt-7">
          <GuideContent
            guide={
              {
                slug: `${product.id}-extra`,
                title: extraTitle,
                excerpt: '',
                cover: '',
                duration: '',
                difficulty: '',
                tools: [],
                blocks: extra,
                products: [],
              } as Guide
            }
            compact
          />
        </div>
      )}

      {active === 'guides' && hasGuides && (
        <div className="pt-7">
          {guides.map((g) => {
            const open = openGuides.includes(g.slug);
            const steps = g.blocks?.filter((b) => b.type === 'step').length ?? 0;
            return (
              <div key={g.slug} className="border-b border-border pb-7 pt-5 first:pt-0">
                <h3 className="font-head text-xl font-medium tracking-tight">
                  {g.title}
                </h3>
                {g.excerpt && (
                  <p className="mt-3 max-w-[46em] text-muted-foreground">{g.excerpt}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                  {steps > 0 && (
                    <span className="flex items-center gap-2">
                      <Icon name="ListOrdered" size={14} />
                      {steps} шагов
                    </span>
                  )}
                  {g.difficulty && (
                    <span className="flex items-center gap-2">
                      <Icon name="Wrench" size={14} />
                      {g.difficulty}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => toggleGuide(g.slug)}
                    aria-expanded={open}
                    className={`flex flex-1 items-center justify-between px-5 py-3 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] transition-colors ${
                      open
                        ? 'border border-foreground hover:border-primary hover:text-primary'
                        : 'bg-primary text-primary-foreground hover:bg-foreground'
                    }`}
                  >
                    {open ? 'Свернуть' : 'Показать инструкцию'}
                    <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={17} />
                  </button>
                  <Link
                    to={`/guides/${g.slug}`}
                    className="flex items-center justify-center gap-2 border border-foreground px-5 py-3 font-head text-[0.85rem] font-medium uppercase tracking-[0.02em] transition-colors hover:border-primary hover:text-primary"
                  >
                    Открыть отдельно
                    <Icon name="ArrowUpRight" size={16} />
                  </Link>
                </div>

                {open && (
                  <div className="mt-7">
                    <GuideContent guide={g} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductTabs;