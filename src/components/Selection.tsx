import { useState } from "react";
import Icon from "@/components/ui/icon";
import VehicleSelector from "@/components/VehicleSelector";
import HeroSearch from "@/components/HeroSearch";
import PhotoToMessenger from "@/components/PhotoToMessenger";

interface Props {
  brand: string;
  model: string;
  year: string;
  onBrand: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onSubmit: () => void;
}

type Mode = "car" | "search";

/**
 * Шаг 1 главной — два способа найти товар в одном блоке.
 * Раньше подбор по машине стоял здесь, а поиск уезжал третьим пунктом
 * вниз страницы: тот, кто знает, что ищет, до него не долистывал.
 * Теперь оба способа равноправны и переключаются вкладками.
 */
const Selection = (selector: Props) => {
  const [mode, setMode] = useState<Mode>("car");

  const tabs: { key: Mode; label: string; icon: string; hint: string }[] = [
    {
      key: "car",
      label: "По машине",
      icon: "Car",
      hint: "Покажем только то, что встаёт на вашу модель по штатным местам.",
    },
    {
      key: "search",
      label: "Знаю, что ищу",
      icon: "Search",
      hint: "Название, марка или артикул с коробки — найдём сразу.",
    },
  ];

  const active = tabs.find((t) => t.key === mode) ?? tabs[0];

  return (
    <div
      id="select"
      className="anchor-offset -mx-6 bg-pick px-6 text-pick-foreground md:-mx-14 md:px-14"
    >
      {/* Крупного заголовка здесь больше нет: он повторял слоган
          первого экрана почти теми же словами. Осталась служебная
          строка — что это шаг 1 и что сейчас происходит */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-7 md:pt-9">
        <span className="flex h-6 w-6 flex-none items-center justify-center bg-primary text-[0.72rem] font-bold text-primary-foreground">
          1
        </span>
        <span className="eyebrow !ml-0 !text-pick-muted">
          Как будем искать
        </span>
      </div>

      {/*
       * Переключатель способов. Раньше это были подчёркнутые надписи —
       * их принимали за два ярлыка и не понимали, что можно нажать.
       * Теперь активный вариант залит светлым и выглядит нажатым.
       */}
      <div
        role="tablist"
        aria-label="Способ подбора"
        className="mt-4 flex w-full gap-1 border border-pick-border bg-pick-field p-1 sm:w-fit"
      >
        {tabs.map((t) => {
          const on = t.key === mode;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setMode(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 font-head text-[0.78rem] font-bold uppercase tracking-[0.06em] transition-colors sm:flex-none sm:px-8 sm:text-[0.82rem] ${
                on
                  ? "bg-white text-pick shadow-sm"
                  : "text-pick-muted hover:text-pick-foreground"
              }`}
            >
              <Icon name={t.icon} size={16} className="flex-none" />
              {t.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 max-w-[34em] text-[0.88rem] leading-relaxed text-pick-muted">
        {active.hint}
      </p>

      <div className="mt-5 h-px bg-pick-border" />

      {mode === "car" ? (
        <VehicleSelector
          {...selector}
          buttonLabel="Подобрать"
          idPrefix="sel2"
          onDark
        />
      ) : (
        <div className="py-6 md:py-7">
          <HeroSearch onDark />
        </div>
      )}

      <div className="h-px bg-pick-border" />

      {/* Подсказка про фото торпедо — одной строкой, чтобы не спорить
          с основным действием блока */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-4 text-[0.85rem] text-pick-muted">
        <Icon
          name="Camera"
          size={16}
          className="flex-none text-pick-accent"
        />
        <span>Не знаете комплектацию?</span>
        <PhotoToMessenger asLink onDark />
      </div>
    </div>
  );
};

export default Selection;