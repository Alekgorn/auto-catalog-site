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
  const {
    toggle: toggleCompare,
    has: inCompare,
    canAdd,
    category: compareCategory,
    ids: compareIds,
  } = useCompare();
  const comparing = inCompare(product.id);
  const compareBlocked = !canAdd(product);
  // Список переполнен — это другая причина отказа, и объяснять её надо иначе
  const compareFull = compareBlocked && compareCategory === product.category;

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
   * Совместимость подтверждена выбранной машиной — зелёная плашка.
   * Универсальный товар под неё не попадает: «Для всех авто» — это про
   * ассортимент, а не про совместимость именно с вашим авто.
   */
  const fitConfirmed = !!vehicle && fits && !anyCar && !universal;

  /** Товар без ограничений по марке — про такой пишем строкой в теле */
  const forAnyCar = anyCar || universal;

  /**
   * Плашка на фото. Показываем, когда есть что сказать про конкретные
   * марки: подтверждённую машину, единственную марку или их количество.
   * «Для всех авто» на фото не выносим — оно стояло бы почти везде.
   */
  const platePhoto = (() => {
    if (fitConfirmed) return `Подходит: ${vehicle!.brand} ${vehicle!.model}`;
    if (forAnyCar) return null;
    if (vehicle && !fits) return null;
    if (fitBrands.length === 1) return `Для ${fitBrands[0]}`;
    if (fitBrands.length > 1) return `Для ${fitBrands.length} марок`;
    return null;
  })();

  /** Строка в теле карточки — только про универсальные позиции */
  const fitLine = forAnyCar ? 'Для всех авто' : null;

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

        {/* Сравнение — плашкой с подписью в углу фото.
            Раньше стоял голый значок 32×32: покупатель его просто не замечал,
            а по картинке нельзя догадаться, что она делает. Слово решает
            больше любого размера иконки, поэтому текст рядом со значком.
            Кнопкой внизу карточки сравнение конкурировало бы с «В корзину»,
            а нужно оно заметно реже */}
        <span
          role="button"
          tabIndex={0}
          aria-label={
            comparing ? 'Убрать из сравнения' : 'Добавить к сравнению'
          }
          title={
            compareBlocked
              ? compareFull
                ? `Уже отложено ${compareIds.length} — больше не помещается`
                : `Сейчас сравниваются другие товары: ${compareCategory}`
              : comparing
                ? 'Убрать из сравнения'
                : 'Отложить для сравнения характеристик'
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
          className={`absolute left-2 top-2 flex items-center gap-1.5 border px-2 py-1.5 text-[0.68rem] font-bold uppercase leading-none tracking-[0.04em] transition-colors sm:top-3 sm:text-[0.72rem] ${
            comparing
              ? 'border-primary bg-primary text-primary-foreground'
              : compareBlocked
                ? 'cursor-not-allowed border-border bg-background/80 text-muted-foreground/50'
                : 'border-border bg-background/90 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground'
          }`}
        >
          <Icon name={comparing ? 'Check' : 'Scale'} size={14} />
          {comparing ? 'В сравнении' : 'Сравнить'}
        </span>

        {/* На фото — только ответ про ВАШУ машину. «Для всех авто» и
            «подходит N маркам» стояли почти на каждой карточке, съедали
            низ снимка и ничего не решали — они ушли под характеристики */}
        {platePhoto && (
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
            <span className="truncate">{platePhoto}</span>
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
            и растягивала все карточки ряда по самой длинной.

            Набрано Rubik — тем же шрифтом, что заголовки разделов и кнопки.
            Раньше это был единственный Inter в карточке, и название читалось
            как первая строка таблицы характеристик, а не как заголовок.
            Заглавными не делаем: названия длинные, капслоком их не прочесть. */}
        <h3 className="font-head font-bold leading-snug tracking-tight text-foreground">
          <Link
            to={`/product/${product.id}`}
            className="line-clamp-2 text-[0.9rem] transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>

        {/* Характеристики уведены в серый и лишены жирности: раньше их
            значения были такими же тёмными и плотными, как название, и
            весь верх карточки выглядел одним куском текста. Теперь
            название — единственный тёмный акцент, а это фон под ним */}
        {specRows.length > 0 && (
          <dl className="mt-2.5 space-y-0.5 text-[0.72rem] leading-snug">
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
                <dd className="min-w-0 flex-1 truncate text-right text-muted-foreground">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Универсальные позиции — спокойной строкой в теле карточки:
            плашкой на фото они стояли бы почти на каждом товаре */}
        {fitLine && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[0.68rem] leading-snug text-muted-foreground">
            <Icon name="Car" size={12} className="mt-0.5 flex-none" />
            <span className="min-w-0 flex-1 truncate">{fitLine}</span>
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