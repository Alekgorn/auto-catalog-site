import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { formatPrice, productImages } from '@/data/catalog';
import { useKit } from '@/context/KitContext';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';

/**
 * Плавающая панель сборки — живёт на всех страницах сайта.
 * Пока покупатель ходит по каталогу и карточкам товара, собранный комплект
 * остаётся перед глазами: фото позиций, итоговая цена и кнопка в корзину.
 */
/** «1 позиция», «2 позиции», «5 позиций» */
const plural = (n: number) => {
  const ten = n % 100;
  const one = n % 10;
  if (ten > 10 && ten < 20) return 'позиций';
  if (one === 1) return 'позиция';
  if (one >= 2 && one <= 4) return 'позиции';
  return 'позиций';
};

const KitBar = () => {
  const { picks, steps, slug, drop, finish } = useKit();
  const { products } = useCatalog();
  const { add, setOpen } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [added, setAdded] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Сначала шаги сценария по порядку, следом добавленное из рекомендаций
  const order = [
    ...steps.map((s) => s.category),
    ...Object.keys(picks).filter(
      (c) => !steps.some((s) => s.category === c),
    ),
  ];

  const chosen = order
    .map((category) => ({
      category,
      step: steps.find((s) => s.category === category),
      product: products.find((p) => p.id === picks[category]),
    }))
    .filter((x) => !!x.product);

  // Пустая сборка или оформление заказа — панель только мешает
  if (!chosen.length || pathname.startsWith('/checkout')) return null;

  const total = chosen.reduce((sum, x) => sum + (x.product?.price ?? 0), 0);
  const old = chosen.reduce(
    (sum, x) => sum + (x.product?.oldPrice ?? x.product?.price ?? 0),
    0,
  );
  const save = old - total;
  const onScenario = pathname === `/scenario/${slug}`;

  const addAll = () => {
    chosen.forEach((x) => x.product && add(x.product));
    setAdded(true);
    setOpen(true);
    // Комплект в корзине — выходим из режима сборки, сайт снова обычный
    setTimeout(finish, 400);
  };

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-foreground px-4 py-3 font-head text-[0.75rem] font-bold uppercase tracking-[0.08em] text-background shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Icon name="Package" size={16} />
        Сборка ({chosen.length})
      </button>
    );
  }

  return (
    <>
      {/* Панель перекрывает низ страницы — освобождаем под неё место */}
      <div aria-hidden className="h-[132px] xl:h-[104px]" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-foreground bg-background shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">
      <div className="section-pad py-3 md:py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="Package" size={17} className="text-primary" />
              <span className="font-head text-[0.8rem] font-bold uppercase tracking-[0.08em]">
                {steps.length ? 'Ваша сборка' : 'Ваш выбор'}
              </span>
              <span className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                {steps.length && chosen.length <= steps.length
                  ? `${chosen.length} из ${steps.length}`
                  : `${chosen.length} ${plural(chosen.length)}`}
              </span>
            </div>

            <div className="flex items-center gap-1 xl:hidden">
              <button
                onClick={finish}
                aria-label="Очистить сборку"
                className="p-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="Trash2" size={15} />
              </button>
              <button
                onClick={() => setHidden(true)}
                aria-label="Свернуть панель"
                className="p-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="ChevronDown" size={17} />
              </button>
            </div>
          </div>

          {/* Позиции с фото — видно, что именно собрано */}
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1 xl:pb-0">
            {chosen.map(({ category, product }) => (
              <div
                key={category}
                className="group relative flex flex-none items-center gap-2.5 border border-border bg-surface p-2 pr-8"
              >
                <img
                  src={productImages(product!)[0]}
                  alt=""
                  loading="lazy"
                  className="h-12 w-12 flex-none bg-surface-muted object-contain"
                />
                <div className="min-w-0 max-w-[13em]">
                  <div className="truncate text-[0.75rem] font-medium leading-tight">
                    {product!.name}
                  </div>
                  <div className="mt-1 font-head text-[0.85rem] font-bold">
                    {formatPrice(product!.price)}
                  </div>
                </div>
                <button
                  onClick={() => drop(category)}
                  aria-label="Убрать из сборки"
                  className="absolute right-1.5 top-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            ))}

            {/* Чего ещё не хватает — подсказка следующего шага */}
            {steps
              .filter((s) => !picks[s.category])
              .slice(0, 2)
              .map((s) => (
                <button
                  key={s.category}
                  onClick={() => navigate(`/scenario/${slug}`)}
                  className="flex flex-none items-center gap-2 border border-dashed border-border px-3 py-2 text-left text-[0.72rem] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name="Plus" size={14} className="flex-none" />
                  <span className="max-w-[9em] truncate">{s.unit ?? s.title}</span>
                </button>
              ))}
          </div>

          <div className="flex flex-none items-center justify-between gap-4">
            <div className="leading-none">
              <div className="text-[0.66rem] uppercase tracking-[0.12em] text-muted-foreground">
                Итого
              </div>
              <div className="mt-1 font-head text-[1.45rem] font-bold tracking-tight">
                {formatPrice(total)}
              </div>
              {save > 0 && (
                <div className="mt-1 text-[0.72rem] text-success">
                  выгода {formatPrice(save)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!onScenario && slug && (
                <button
                  onClick={() => navigate(`/scenario/${slug}`)}
                  className="hidden items-center gap-2 border border-foreground px-4 py-3.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary sm:flex"
                >
                  К сборке
                  <Icon name="ArrowRight" size={15} />
                </button>
              )}

              <button
                onClick={addAll}
                className={`flex flex-none items-center gap-2 px-5 py-3.5 font-head text-[0.78rem] font-bold uppercase tracking-[0.08em] transition-colors ${
                  added
                    ? 'bg-success text-success-foreground'
                    : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {added ? (
                  <>
                    <Icon name="Check" size={16} strokeWidth={3} />
                    В корзине
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      {steps.length ? 'Добавить комплект' : 'Добавить в заказ'}
                    </span>
                    <span className="sm:hidden">В корзину</span>
                    <Icon name="ShoppingCart" size={16} />
                  </>
                )}
              </button>

              <div className="hidden items-center gap-1 xl:flex">
                <button
                  onClick={finish}
                  aria-label="Очистить сборку"
                  className="p-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Trash2" size={16} />
                </button>
                <button
                  onClick={() => setHidden(true)}
                  aria-label="Свернуть панель"
                  className="p-2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="ChevronDown" size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default KitBar;
