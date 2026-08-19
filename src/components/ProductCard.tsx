import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
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

  /*
   * Зелёная плашка на фото — только прямой ответ про выбранную машину.
   * Универсальный товар под неё не попадает: «Для всех авто» — это про
   * ассортимент, а не про совместимость именно с вашим авто.
   */
  const fitConfirmed = !!vehicle && fits && !anyCar && !universal;

  const fitLabel = (() => {
    if (fitConfirmed) return `Подходит: ${vehicle!.brand} ${vehicle!.model}`;
    if (anyCar || universal) return 'Для всех авто';
    if (vehicle && !fits) return null;
    if (fitBrands.length === 1) return `Для ${fitBrands[0]}`;
    if (fitBrands.length > 1) return `Подходит: ${fitBrands.length} марок`;
    return null;
  })();

  return (
    <article className="group flex flex-col border border-border bg-surface transition-colors duration-200 hover:border-foreground/40">
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
          className="aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03] sm:p-3"
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

        {/* На фото — только ответ про ВАШУ машину. «Для всех авто» и
            «подходит N маркам» стояли почти на каждой карточке, съедали
            низ снимка и ничего не решали — они ушли под характеристики */}
        {fitConfirmed && (
          <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-success px-2 py-1.5 text-[0.62rem] font-bold uppercase leading-tight tracking-[0.04em] text-success-foreground sm:px-3 sm:py-2 sm:text-[0.7rem]">
            <Icon name="Check" size={12} strokeWidth={3} className="flex-none" />
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
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        {/* Название в две строки: третья почти всегда оставалась пустой
            и растягивала все карточки ряда по самой длинной */}
        <h3 className="font-bold leading-snug tracking-tight text-foreground">
          <Link
            to={`/product/${product.id}`}
            className="line-clamp-2 text-[0.88rem] transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        {specRows.length > 0 && (
          <dl className="mt-1.5 space-y-0.5 text-[0.72rem] leading-snug">
            {/* Значение не сжималось из-за flex-none и вылезало за карточку.
                Даём обеим колонкам ужиматься и обрезаем длинный текст */}
            {specRows.map((r) => (
              <div
                key={r.label}
                className="flex items-baseline justify-between gap-2"
                title={`${r.label}: ${r.value}`}
              >
                <dt className="min-w-0 max-w-[55%] flex-none truncate text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="min-w-0 flex-1 truncate text-right font-medium text-foreground">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Совместимость строкой в теле карточки — рядом с остальными
            характеристиками, где её и ищут глазами */}
        {!fitConfirmed && fitLabel && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[0.68rem] leading-snug text-muted-foreground">
            <Icon name="Car" size={12} className="mt-0.5 flex-none" />
            <span className="min-w-0 flex-1 truncate">{fitLabel}</span>
          </div>
        )}

        {/* Машина не выбрана, а товар подходит не всем: строка выше
            сказала «подходит N маркам» — тут зовём проверить свою */}
        {!vehicle && !universal && !anyCar && (
          <div className="mt-1 text-[0.66rem] leading-snug text-primary">
            Укажите машину — проверим совместимость
          </div>
        )}

        <div className="mt-auto pt-2">
          <PriceBlock product={product} />
          <StockLine product={product} />
        </div>

        <div className="flex items-center gap-2 pt-2">
          {/* «Подробнее» — иконкой: в узкой карточке отдельная кнопка
              съедала половину строки, а на страницу товара ведут ещё
              и фото, и название */}
          <Link
            to={`/product/${product.id}`}
            aria-label={`Подробнее: ${product.name}`}
            title="Открыть страницу товара"
            className="hidden h-[38px] w-[38px] flex-none items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:flex"
          >
            <Icon name="ArrowRight" size={16} />
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
