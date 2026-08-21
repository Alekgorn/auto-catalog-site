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
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 py-7 md:grid-cols-12 md:py-9">
        <div className="md:col-span-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex h-6 w-6 flex-none items-center justify-center bg-primary text-[0.72rem] font-bold text-primary-foreground">
              1
            </span>
            <span className="eyebrow !ml-0 !text-pick-muted">
              Подбор оборудования
            </span>
          </div>
          <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-[1.06] tracking-[-0.025em] sm:text-3xl lg:text-4xl">
            Найдём то, что{" "}
            <span className="text-pick-accent">подходит</span>
          </h2>
        </div>

        <p className="max-w-[34em] self-end text-[0.9rem] leading-relaxed text-pick-muted md:col-span-5">
          {active.hint}
        </p>
      </div>

      {/* Вкладки способов подбора. На телефоне занимают всю ширину
          по половине — попасть пальцем проще, чем в мелкие ссылки */}
      <div className="flex gap-0">
        {tabs.map((t) => {
          const on = t.key === mode;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              aria-pressed={on}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3.5 font-head text-[0.78rem] font-bold uppercase tracking-[0.06em] transition-colors sm:flex-none sm:px-7 sm:text-[0.82rem] ${
                on
                  ? "border-pick-accent text-pick-foreground"
                  : "border-pick-border text-pick-muted hover:text-pick-foreground"
              }`}
            >
              <Icon name={t.icon} size={16} className="flex-none" />
              {t.label}
            </button>
          );
        })}
        {/* Хвост линии до правого края — вкладки не висят в воздухе */}
        <span className="hidden flex-1 border-b-2 border-pick-border sm:block" />
      </div>

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
