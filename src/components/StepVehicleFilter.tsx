import Icon from "@/components/ui/icon";
import SearchSelect from "@/components/SearchSelect";
import PhotoToMessenger from "@/components/PhotoToMessenger";
import { PartialVehicle, YEARS } from "@/data/catalog";
import { useCatalog } from "@/context/CatalogContext";
import { useBrandPicker } from "@/hooks/use-brand-picker";

interface Props {
  value: PartialVehicle | null;
  onChange: (v: PartialVehicle | null) => void;
  /** Сколько товаров осталось после текущего шага */
  count: number;
  /** Показывать ли товары без привязки к авто */
  withUniversal: boolean;
  onUniversal: (v: boolean) => void;
  /** Сколько среди показанных — универсальные */
  universalCount: number;
}

/**
 * Пошаговый подбор для полного каталога.
 *
 * Отличается от обычной панели тем, что каталог сужается сразу на каждом
 * шаге: выбрали марку — список уже отфильтрован, добавили модель — сузился
 * ещё, год — окончательно. Ждать заполнения всей формы не нужно.
 */
const StepVehicleFilter = ({
  value,
  onChange,
  count,
  withUniversal,
  onUniversal,
  universalCount,
}: Props) => {
  const { brands: BRANDS } = useCatalog();

  const brand = value?.brand ?? "";
  const model = value?.model ?? "";
  const year = value?.year ? String(value.year) : "";

  const { models } = useBrandPicker(brand);

  /**
   * Подсказка под фильтром: что уже учтено и что стоит уточнить дальше.
   *
   * Тёмной плашкой она становится сразу после выбора марки, а не только
   * когда заполнены все три поля: каталог сужается уже на первом шаге, и
   * человек должен это видеть, иначе он не понимает, сработал ли фильтр.
   * Что уточнить дальше — второй строкой, помельче.
   */
  const hint = () => {
    if (!brand)
      return {
        icon: "Car",
        text: "Выберите марку — каталог сразу отфильтруется под неё.",
        next: "",
        done: false,
      };
    if (!model)
      return {
        icon: "CircleCheck",
        text: `Каталог подобран под ${brand}`,
        next: "Выберите модель, чтобы подбор стал точнее.",
        done: true,
      };
    if (!year)
      return {
        icon: "CircleCheck",
        text: `Каталог подобран под ${brand} ${model}`,
        next: "Осталось выбрать год — тогда подбор будет точным.",
        done: true,
      };
    return {
      icon: "CircleCheck",
      /* Без «измените автомобиль выше»: поля стоят прямо над этой
         строкой, и объяснять дорогу к ним незачем */
      text: `Каталог подобран под ${brand} ${model}, ${year}\u00A0г.`,
      next: "",
      done: true,
    };
  };

  const h = hint();

  return (
    <div className="border-2 border-foreground bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <Icon name="Car" size={22} className="flex-none text-primary" />
          <span className="font-head text-[1rem] font-bold uppercase tracking-tight">
            Подбор по машине
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PhotoToMessenger inline />
          {brand && (
            <button
              onClick={() => onChange(null)}
              className="border border-border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-end gap-x-5 gap-y-3 px-4 py-4 md:grid-cols-12 md:px-5">
        <div className="md:col-span-4">
          <SearchSelect
            id="sv-brand"
            label="Марка"
            value={brand}
            options={BRANDS.map((b) => b.name)}
            placeholder="Выберите марку"
            alphabet
            brandMark
            emptyText="Такой марки нет — напишите нам"
            onChange={(b) => onChange(b ? { brand: b } : null)}
          />
        </div>

        <div className="md:col-span-4">
          <SearchSelect
            id="sv-model"
            label="Модель"
            value={model}
            options={models}
            placeholder={brand ? "Выберите модель" : "Сначала марка"}
            alphabet
            emptyText="Сначала выберите марку"
            onChange={(m) => brand && onChange({ brand, model: m || undefined })}
          />
        </div>

        <div className="md:col-span-4">
          <SearchSelect
            id="sv-year"
            label="Год"
            value={year}
            options={YEARS.map(String)}
            placeholder={model ? "Выберите год" : "Сначала модель"}
            emptyText="Сначала выберите модель"
            onChange={(y) =>
              brand &&
              onChange({
                brand,
                model: model || undefined,
                year: y ? Number(y) : undefined,
              })
            }
          />
        </div>
      </div>

      {/*
        Машина выбрана — строка становится тёмной плашкой во всю ширину.
        Раньше она была бледно-розовой с серым текстом и терялась между
        полями и переключателем: человек не замечал, что каталог уже
        подобран под его авто, и искал фильтр дальше.
      */}
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-4 py-3.5 md:px-5 ${
          h.done
            ? "border-foreground bg-foreground text-background"
            : "border-border text-[0.85rem] text-muted-foreground"
        }`}
      >
        {/* Значок и текст держим одним блоком: на узком экране значок
            отрывался и висел отдельной строкой над надписью.
            basis-full — на телефоне счётчик уходит на свою строку, иначе
            он отжимал надпись в колонку шириной в два слова */}
        <span className="flex min-w-0 flex-1 basis-full items-center gap-2.5 md:basis-auto">
          <Icon
            name={h.icon}
            size={h.done ? 18 : 16}
            strokeWidth={h.done ? 2.5 : 2}
            className={`flex-none ${h.done ? "text-background" : ""}`}
          />
          <span className="min-w-0">
            <span
              className={
                h.done
                  ? "block font-head text-[0.88rem] font-bold uppercase leading-tight tracking-tight md:text-[0.92rem]"
                  : ""
              }
            >
              {h.text}
            </span>
            {/* Что уточнить дальше — отдельной строкой и приглушённо:
                главное сообщение «фильтр уже работает», а не инструкция */}
            {h.next && (
              <span className="mt-1 block text-[0.78rem] font-normal normal-case leading-snug tracking-normal text-background/70">
                {h.next}
              </span>
            )}
          </span>
        </span>
        {brand && (
          <span
            className={`whitespace-nowrap font-medium ${
              h.done
                ? "flex-none bg-background px-2.5 py-1 font-head text-[0.78rem] font-bold uppercase tracking-tight text-foreground"
                : "ml-auto text-foreground"
            }`}
          >
            Подходит товаров: {count}
          </span>
        )}
      </div>

      {/*
        Универсальные позиции — без привязки к авто, встают на любую машину.
        По умолчанию показываем; переключатель убирает их, оставляя только
        то, что заявлено именно под выбранный автомобиль.
      */}
      {brand && (
        <button
          onClick={() => onUniversal(!withUniversal)}
          aria-pressed={!withUniversal}
          className={`flex w-full items-center gap-3 border-t-2 border-foreground px-4 py-4 text-left transition-colors md:px-5 ${
            withUniversal
              ? "bg-surface hover:bg-primary/10"
              : "bg-foreground text-background"
          }`}
        >
          <span
            className={`relative flex h-6 w-11 flex-none items-center rounded-full transition-colors ${
              withUniversal ? "bg-muted-foreground/40" : "bg-primary"
            }`}
          >
            <span
              className={`absolute h-5 w-5 rounded-full bg-background shadow transition-transform ${
                withUniversal ? "translate-x-0.5" : "translate-x-[22px]"
              }`}
            />
          </span>

          <span className="min-w-0">
            <span className="block font-head text-[0.95rem] font-bold uppercase tracking-tight">
              Скрыть товары, подходящие ко всем авто
            </span>
            <span
              className={`mt-0.5 block text-[0.82rem] ${
                withUniversal ? "text-muted-foreground" : "text-background/70"
              }`}
            >
              {withUniversal
                ? `Сейчас показаны и универсальные позиции — их ${universalCount}. Включите, чтобы оставить только совместимые с вашим авто.`
                : "Универсальные скрыты — в списке только то, что заявлено под ваш автомобиль."}
            </span>
          </span>

          <Icon
            name={withUniversal ? "Filter" : "FilterX"}
            size={20}
            className={`ml-auto flex-none ${withUniversal ? "text-primary" : ""}`}
          />
        </button>
      )}
    </div>
  );
};

export default StepVehicleFilter;