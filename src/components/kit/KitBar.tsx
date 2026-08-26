import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { formatPrice, productImages } from '@/data/catalog';
import { useKit } from '@/context/KitContext';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';
import { useVehicle } from '@/hooks/use-vehicle';
import { usePrice } from '@/hooks/use-price';
import { buildShareUrl } from '@/lib/share-kit';
import ShareKitDialog from '@/components/share/ShareKitDialog';
import Confetti from '@/components/kit/Confetti';

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
  const { picks, qty, setQty, steps, skipped, slug, drop, reset, finish } =
    useKit();
  // Уже выбранное показываем всегда: фильтр наличия не должен вытирать
  // позиции из собранного комплекта
  const { allProducts: products } = useCatalog();
  const { add, setOpen } = useCart();
  const { vehicle } = useVehicle();
  /* Дилер собирает комплект по своим ценам: он считает закупку, а не
     то, что заплатит его клиент. Розница остаётся рядом — по ней он
     называет цену заказчику */
  const { dealer, priceOf } = usePrice();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [added, setAdded] = useState(false);
  const [hidden, setHidden] = useState(false);
  /** Открыто окно «Поделиться» */
  const [sharing, setSharing] = useState(false);
  /** Счётчик залпов салюта: растёт — значит пора праздновать */
  const [boom, setBoom] = useState(0);
  const wasFull = useRef(false);
  /** Первый заход: сборка могла быть готова ещё до перезагрузки страницы */
  const firstRun = useRef(true);

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
      // Старые сохранения без количества считаем как одну штуку
      count: qty[category] ?? 1,
    }))
    .filter((x) => !!x.product);

  /**
   * Комплект готов к заказу: по каждому шагу принято решение — товар
   * выбран либо шаг осознанно пропущен.
   *
   * Раньше «необязательные» шаги (проводка, камера, регистратор) не
   * учитывались вовсе, и салют гремел сразу после рамки — покупатель
   * ещё выбирал проводку, а ему уже сообщали, что всё готово.
   */
  const complete =
    steps.length > 0 &&
    steps.every((s) => !!picks[s.category] || !!skipped[s.category]);

  /** Сколько шагов ещё ждут решения — для счётчика «2 из 3» */
  const stepsTotal = steps.filter((s) => !skipped[s.category]).length;
  const stepsLeft = steps.filter(
    (s) => !picks[s.category] && !skipped[s.category],
  ).length;

  // Последняя позиция встала на место — салют и подсказка на кнопку
  useEffect(() => {
    // На перезагрузке салют не повторяем — празднуем только живой выбор
    if (firstRun.current) {
      firstRun.current = false;
      wasFull.current = complete;
      return;
    }
    if (complete && !wasFull.current) {
      setBoom((n) => n + 1);
      // Свёрнутую панель разворачиваем — иначе праздновать некуда
      setHidden(false);
    }
    // Сборку разобрали — гасим салют, иначе он повторится при новом выборе:
    // панель на пустой сборке скрывается, а вместе с ней и холст конфетти
    if (!complete) setBoom(0);
    wasFull.current = complete;
  }, [complete]);

  /*
   * Панель сборки живёт только там, где сборка реально идёт: сценарий
   * с пошаговым подбором и сравнение, куда из него уходят выбирать.
   * Сверяем адрес с тем сценарием, в котором сборка начата: подборки
   * без шагов («Всё, что у нас есть») живут по такому же адресу, но это
   * обычный каталог — там «Ваша сборка 1 из 3» только путала.
   */
  const inKitFlow =
    (!!slug && steps.length > 0 && pathname === `/scenario/${slug}`) ||
    pathname.startsWith('/compare');

  if (!chosen.length || !inKitFlow || pathname.startsWith('/checkout')) {
    return null;
  }

  /** Сумма по цене текущего посетителя: дилеру — закупочная */
  const total = chosen.reduce(
    (sum, x) => sum + (x.product ? priceOf(x.product) : 0) * x.count,
    0,
  );
  /** Розничная стоимость того же набора */
  const retail = chosen.reduce(
    (sum, x) => sum + (x.product?.price ?? 0) * x.count,
    0,
  );
  const old = chosen.reduce(
    (sum, x) => sum + (x.product?.oldPrice ?? x.product?.price ?? 0) * x.count,
    0,
  );
  /* У дилера выгода — это разница с розницей, а не старая цена по акции */
  const save = dealer ? retail - total : old - total;
  const onScenario = pathname === `/scenario/${slug}`;

  const addAll = () => {
    chosen.forEach((x) => x.product && add(x.product, x.count));
    setAdded(true);
    setOpen(true);
    // Комплект в корзине — выходим из режима сборки, сайт снова обычный
    setTimeout(finish, 400);
  };

  const celebrate = complete && !added;

  /* Ссылку собираем из того же состава, что видно в панели: получатель
     откроет ровно этот комплект под ту же машину */
  const shareUrl = buildShareUrl({
    lines: chosen.map((x) => ({ id: x.product!.id, qty: x.count })),
    vehicle,
    slug,
  });

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
      <Confetti fire={boom} />

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
                {/* Пропущенные шаги из счётчика убираем — иначе «2 из 5»
                    висело бы даже там, где покупатель всё решил */}
                {stepsLeft > 0
                  ? `${chosen.length} из ${stepsTotal}`
                  : `${chosen.length} ${plural(chosen.length)}`}
              </span>

              {/* Готовность на телефоне — строкой в шапке панели,
                  чтобы не закрывать собой список позиций */}
              {celebrate && (
                <span className="flex items-center gap-1 bg-primary px-2 py-1 font-head text-[0.62rem] font-bold uppercase tracking-[0.06em] text-primary-foreground sm:hidden">
                  <Icon name="Check" size={11} strokeWidth={3} />
                  Готов
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 xl:hidden">
              <button
                onClick={reset}
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
            {chosen.map(({ category, product, count }) => (
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
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => setQty(category, count - 1)}
                        aria-label="Меньше"
                        className="px-1.5 py-0.5 text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Icon name="Minus" size={12} />
                      </button>
                      <span className="min-w-[1.6em] text-center font-head text-[0.75rem] font-bold">
                        {count}
                      </span>
                      <button
                        onClick={() => setQty(category, count + 1)}
                        aria-label="Больше"
                        className="px-1.5 py-0.5 text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Icon name="Plus" size={12} />
                      </button>
                    </div>
                    <span className="font-head text-[0.85rem] font-bold">
                      {formatPrice(priceOf(product!) * count)}
                    </span>
                    {/* Розница рядом с закупкой: по ней дилер называет
                        цену своему заказчику */}
                    {dealer && priceOf(product!) < product!.price && (
                      <span className="text-[0.72rem] text-muted-foreground line-through">
                        {formatPrice(product!.price * count)}
                      </span>
                    )}
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
                {dealer ? 'Ваша закупка' : 'Итого'}
              </div>
              <div className="mt-1 font-head text-[1.45rem] font-bold tracking-tight">
                {formatPrice(total)}
              </div>
              {dealer && retail > total ? (
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[0.72rem]">
                  <span className="text-muted-foreground">
                    в рознице {formatPrice(retail)}
                  </span>
                  <span className="text-success">
                    выгода {formatPrice(save)}
                  </span>
                </div>
              ) : (
                save > 0 && (
                  <div className="mt-1 text-[0.72rem] text-success">
                    выгода {formatPrice(save)}
                  </div>
                )
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

              {/* «Спросить друга» — второстепенное действие рядом с
                  заказом: подпись прячем на узком экране, чтобы кнопка
                  не отжимала главную */}
              <button
                onClick={() => setSharing(true)}
                title="Поделиться сборкой"
                aria-label="Поделиться сборкой"
                className="flex flex-none items-center gap-2 border border-foreground px-3.5 py-3.5 font-head text-[0.75rem] font-bold uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary sm:px-4"
              >
                <Icon name="Share2" size={16} />
                <span className="hidden lg:inline">Поделиться</span>
              </button>

              <div className="relative">
                {/* Комплект собран — ведём взгляд прямо на кнопку заказа.
                    На телефоне подсказку прячем: там она ложилась поверх
                    списка позиций, и покупатель переставал видеть сборку.
                    Вместо неё под шапкой панели идёт спокойная строка. */}
                {celebrate && (
                  <div className="pointer-events-none absolute bottom-[calc(100%+2.1rem)] right-0 z-10 hidden w-max animate-in fade-in slide-in-from-bottom-2 duration-500 sm:block">
                    <div className="relative border-2 border-primary bg-primary px-4 py-2.5 text-primary-foreground shadow-lg">
                      <div className="font-head text-[0.78rem] font-bold uppercase tracking-[0.06em]">
                        Комплект для вашего авто готов
                      </div>
                      <div className="mt-0.5 text-[0.72rem] opacity-90">
                        Осталось нажать — и заказ у нас
                      </div>
                    </div>
                    <Icon
                      name="ArrowDown"
                      size={22}
                      className="absolute -bottom-[1.7rem] right-[5.5rem] animate-bounce text-primary"
                      strokeWidth={3}
                    />
                  </div>
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
              </div>

              <div className="hidden items-center gap-1 xl:flex">
                <button
                  onClick={reset}
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

      <ShareKitDialog
        open={sharing}
        onClose={() => setSharing(false)}
        url={shareUrl}
        total={total}
        vehicle={vehicle}
        items={chosen.map((x) => ({ product: x.product!, qty: x.count }))}
      />
    </>
  );
};

export default KitBar;