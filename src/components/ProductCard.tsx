import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { slugify } from '@/lib/slug';
import {
  CARD_FIELDS,
  Product,
  Vehicle,
  fitsAll,
  isCompatible,
  isUniversal,
  productImages,
  productSpecs,
} from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import { isVehicle } from '@/lib/vehicle';
import PriceBlock from '@/components/PriceBlock';
import StockLine from '@/components/StockLine';
import { useCatalog } from '@/context/CatalogContext';
import { useCompare } from '@/context/CompareContext';

interface Props {
  product: Product;
  vehicle: Vehicle | null;
  /**
   * Режим сборки комплекта: кнопка не кладёт товар в корзину, а отмечает
   * его выбранным на своём шаге. Корзина заполняется одной кнопкой в конце.
   */
  picked?: boolean;
  onPick?: (product: Product) => void;
}

/** Сколько характеристик влезает в карточку, не раздувая её */
const SPEC_LIMIT = 3;

const ProductCard = ({ product, vehicle: raw, picked, onPick }: Props) => {
  // Неполные данные машины = машина не выбрана
  const vehicle = isVehicle(raw) ? raw : null;
  const fits = isCompatible(product, vehicle);
  const { cardFields, categorySpecs, brands } = useCatalog();
  /** Товар и правда подходит любой машине, а не «просто машина не выбрана» */
  const universal = isUniversal(product, brands.length);
  /** Марки не заданы — товар без ограничений по авто */
  const anyCar = fitsAll(product);
  /**
   * Идёт сборка комплекта — товар уходит в плавающую панель внизу,
   * а не в корзину. Так покупатель сначала собирает комплект целиком.
   */
  /*
   * Обычный каталог — товар уходит прямо в корзину.
   *
   * Раньше кнопка всегда звала сборку комплекта: человек хотел купить
   * один регистратор, а внизу выезжала панель «Ваша сборка 1 из 3» с
   * рамкой, проводкой и кнопкой в сценарий. Сборка нужна только внутри
   * сценария — там карточке передают onPick.
   */
  const { add: addToCart, has: inCart } = useCart();
  const chosen = onPick ? !!picked : inCart(product.id);

  /* Сравнение: отмечаем товар, чтобы потом свести характеристики в таблицу */
  const { toggle: toggleCompare, has: inCompare, canAdd } = useCompare();
  const comparing = inCompare(product.id);
  const compareBlocked = !canAdd(product);

  /**
   * Характеристики под названием — то, ради чего покупатель раньше заходил
   * в карточку. Сначала важные поля категории (диагональ, память), затем
   * общие вроде гарантии. Показываем только первые несколько.
   */
  const specRows = (() => {
    const rows: { label: string; value: string }[] = [];
    const seen = new Set<string>();
    const add = (label: string, value: string) => {
      const key = label.trim().toLowerCase();
      if (!value || seen.has(key)) return;
      seen.add(key);
      rows.push({ label, value });
    };

    const all = productSpecs(product);
    (categorySpecs[product.category] ?? []).forEach((field) => {
      const hit = all.find(
        ([k]) => k.trim().toLowerCase() === field.trim().toLowerCase(),
      );
      if (hit) add(field, hit[1]);
    });

    // Своих характеристик мало — дополняем тем, что настроено для карточек
    CARD_FIELDS.filter((f) => cardFields.includes(f.key)).forEach((f) =>
      add(f.label, f.get(product)),
    );

    return rows.slice(0, SPEC_LIMIT);
  })();

  /**
   * Короткая подпись о совместимости — плашкой прямо на фото.
   * Машина выбрана: «Подходит для Kia Rio». Не выбрана: сколько марок
   * поддерживает товар. Полный список моделей из карточки убран — он
   * занимал половину места, а нужен единицам (есть на странице товара).
   */
  const fitBrands = Object.keys(product.fits ?? {});
  const fitLabel = (() => {
    if (anyCar || universal) return 'Для всех авто';
    if (vehicle) return fits ? `Подходит: ${vehicle.brand} ${vehicle.model}` : null;
    if (fitBrands.length === 1) return `Для ${fitBrands[0]}`;
    if (fitBrands.length > 1) return `Подходит: ${fitBrands.length} марок`;
    return null;
  })();

  /* Зелёная плашка — только когда совместимость подтверждена машиной */
  const fitConfirmed = !!vehicle && fits && !anyCar;

  return (
    <article className="group flex flex-col bg-surface shadow-card transition-shadow duration-300 hover:shadow-card-hover">
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent('quickview:open', { detail: product.id }),
          )
        }
        aria-label={`Быстрый просмотр: ${product.name}`}
        className="relative block w-full overflow-hidden bg-surface-muted text-left"
      >
        <img
          src={productImages(product)[0]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          /* Размеры заранее — страница не прыгает, пока фото грузится */
          width={800}
          height={800}
          className="aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03] sm:p-4"
        />

        {product.badge && (
          <span className="absolute right-0 top-2 bg-primary px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-primary-foreground sm:top-3 sm:px-2.5 sm:text-[0.68rem]">
            {product.badge}
          </span>
        )}

        {/* Сравнение — значком в углу фото: кнопкой внизу карточки он
            конкурировал бы с «В заказ», а нужен заметно реже */}
        <span
          role="button"
          tabIndex={0}
          aria-label={
            comparing ? 'Убрать из сравнения' : 'Добавить к сравнению'
          }
          title={
            compareBlocked
              ? 'Сравнивать можно товары одного раздела'
              : comparing
                ? 'В сравнении'
                : 'Добавить к сравнению'
          }
          onClick={(e) => {
            e.stopPropagation();
            if (!compareBlocked) toggleCompare(product);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            e.stopPropagation();
            if (!compareBlocked) toggleCompare(product);
          }}
          className={`absolute left-2 top-2 flex h-8 w-8 items-center justify-center border transition-colors sm:top-3 ${
            comparing
              ? 'border-primary bg-primary text-primary-foreground'
              : compareBlocked
                ? 'cursor-not-allowed border-border bg-background/80 text-muted-foreground/50'
                : 'border-border bg-background/85 text-foreground hover:border-primary hover:text-primary'
          }`}
        >
          <Icon name={comparing ? "Check" : "GitCompare"} size={15} />
        </span>

        {/* Совместимость коротким текстом прямо на фото */}
        {fitLabel && (
          <span
            className={`absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-1.5 text-[0.62rem] font-bold uppercase leading-tight tracking-[0.04em] sm:px-3 sm:py-2 sm:text-[0.7rem] ${
              fitConfirmed
                ? 'bg-success text-success-foreground'
                : 'bg-foreground/85 text-background'
            }`}
          >
            <Icon
              name={fitConfirmed ? 'Check' : 'Car'}
              size={12}
              strokeWidth={fitConfirmed ? 3 : 2}
              className="flex-none"
            />
            <span className="truncate">{fitLabel}</span>
          </span>
        )}

        {vehicle && !fits && !anyCar && (
          <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-muted px-2 py-1.5 text-[0.62rem] font-bold uppercase leading-tight tracking-[0.04em] text-muted-foreground sm:px-3 sm:py-2 sm:text-[0.7rem]">
            <Icon name="CircleSlash" size={12} className="flex-none" />
            <span className="truncate">Не подходит машине</span>
          </span>
        )}
      </button>

      {/* Порядок как в приложениях магазинов: сразу под фото название и
          характеристики — по ним выбирают, а цена с наличием стоят внизу,
          вплотную к кнопке заказа */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="font-bold leading-snug tracking-tight text-foreground">
          <Link
            to={`/product/${product.id}`}
            className="line-clamp-3 text-[0.95rem] transition-colors hover:text-primary sm:text-[1rem]"
          >
            {product.name}
          </Link>
        </h3>

        <Link
          to={`/catalog/${slugify(product.category)}`}
          className="mt-1 truncate text-[0.7rem] text-muted-foreground transition-colors hover:text-primary sm:text-[0.75rem]"
        >
          {product.category}
        </Link>

        {specRows.length > 0 && (
          <dl className="mt-2 space-y-1 text-[0.74rem] leading-snug sm:text-[0.78rem]">
            {specRows.map((r) => (
              <div key={r.label} className="flex justify-between gap-2">
                <dt className="truncate text-muted-foreground">{r.label}</dt>
                <dd className="flex-none truncate text-right font-medium text-foreground">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Машина не выбрана и товар подходит не всем — зовём проверить */}
        {!vehicle && !universal && !anyCar && (
          <div className="mt-2 flex items-start gap-1.5 text-[0.7rem] leading-snug text-muted-foreground sm:text-[0.75rem]">
            <Icon name="Car" size={13} className="mt-0.5 flex-none" />
            Укажите машину — проверим совместимость
          </div>
        )}

        <div className="mt-auto pt-3">
          <PriceBlock product={product} />
          <StockLine product={product} />
        </div>

        <div className="flex items-center gap-2 pt-3">
          <Link
            to={`/product/${product.id}`}
            className="hidden flex-none border border-border px-3 py-2.5 font-head text-[0.72rem] font-medium uppercase tracking-[0.06em] transition-colors hover:border-foreground sm:block"
          >
            Подробнее
          </Link>
          <button
            onClick={() =>
              onPick ? onPick(product) : addToCart(product)
            }
            className={`flex flex-1 items-center justify-center gap-1.5 border px-3 py-2.5 font-head text-[0.72rem] font-medium uppercase tracking-[0.06em] transition-colors sm:text-[0.76rem] ${
              chosen
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
            }`}
          >
            {/* В сборке комплекта товар не уходит в корзину, а отмечается
                на своём шаге — «Выбрать» честнее, чем «В корзину» */}
            {onPick
              ? chosen
                ? 'Выбрано'
                : 'Выбрать'
              : chosen
                ? 'В корзине'
                : 'В корзину'}
            <Icon name={chosen ? 'Check' : 'Plus'} size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
