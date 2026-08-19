import { useMemo } from "react";
import Icon from "@/components/ui/icon";
import SearchSelect from "@/components/SearchSelect";
import PhotoToMessenger from "@/components/PhotoToMessenger";
import { PartialVehicle, YEARS } from "@/data/catalog";
import { useCatalog } from "@/context/CatalogContext";

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

  const models = useMemo(
    () => BRANDS.find((b) => b.name === brand)?.models ?? [],
    [brand, BRANDS],
  );

  /** Подсказка под фильтром: что уже учтено и что стоит уточнить дальше */
  const hint = () => {
    if (!brand)
      return {
        icon: "Car",
        text: "Выберите марку — каталог сразу отфильтруется под неё.",
        done: false,
      };
    if (!model)
      return {
        icon: "Check",
        text: `Каталог отфильтрован по марке ${brand}. Выберите модель, чтобы отфильтровать точнее.`,
        done: false,
      };
    if (!year)
      return {
        icon: "Check",
        text: `Марка и модель выбраны: ${brand} ${model}. Осталось выбрать год вашего авто, чтобы получить максимально точные товары.`,
        done: false,
      };
    return {
      icon: "CircleCheck",
      text: `Каталог отфильтрован по ${brand} ${model}, ${year}. Если нужно, измените автомобиль выше в фильтре.`,
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

      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-3 text-[0.85rem] md:px-5 ${
          h.done
            ? "border-primary bg-primary/10 text-foreground"
            : "border-border text-muted-foreground"
        }`}
      >
        <Icon
          name={h.icon}
          size={16}
          className={`flex-none ${h.done ? "text-primary" : ""}`}
        />
        <span>{h.text}</span>
        {brand && (
          <span className="ml-auto whitespace-nowrap font-medium text-foreground">
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