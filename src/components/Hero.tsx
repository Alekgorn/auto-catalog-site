import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import MountPlan from "@/components/MountPlan";
import Scenarios from "@/components/Scenarios";
import HeroSearch from "@/components/HeroSearch";
import { useCatalog } from "@/context/CatalogContext";

interface Props {
  /** Блок подбора по машине — встаёт сразу под заголовком, до поиска */
  selection?: React.ReactNode;
}

const Hero = ({ selection }: Props) => {
  const navigate = useNavigate();
  const { shortcuts, shortcutsHidden } = useCatalog();

  /** Быстрая ссылка ведёт на страницу поиска — там же подбор по машине */
  const goToCategory = (category: string, label: string) =>
    navigate(`/search?q=${encodeURIComponent(category || label)}`);

  return (
    <section className="section-pad flex flex-col">
      <div className="rule" />

      <div className="grid grid-cols-1 items-center gap-x-6 md:grid-cols-12">
        <div className="flex min-h-0 min-w-0 flex-col pb-5 pt-6 md:col-span-6 md:pb-8 md:pr-8 md:pt-8">
          <div
            className="eyebrow rise ml-0 md:ml-4"
            style={{ animationDelay: ".05s" }}
          >
            Автоэлектроника и мультимедиа для авто
          </div>
          <h1
            className="rise ml-0 mt-3 font-head text-[9.5vw] font-bold uppercase leading-[1.04] tracking-[-0.035em] sm:text-5xl md:ml-3 md:mt-4 lg:text-[58px]"
            style={{ animationDelay: ".15s" }}
          >
            Только то, что
            <br />
            <span className="text-primary">подойдет</span>
          </h1>
          <p
            className="rise ml-0 mt-4 max-w-[26em] text-[0.95rem] leading-relaxed text-muted-foreground md:ml-4 md:mt-5 md:text-base"
            style={{ animationDelay: ".25s" }}
          >
            <b className="font-medium text-foreground">Начни с авто – </b>
            покажем оборудование, которое встаёт на твою модель по штатным
            местам и разъёмам. Не знаешь, что искать – выбери задачу ниже.
          </p>

          {/*
            Направления ассортимента. Одна строка, которая листается вбок:
            так блок не растёт в высоту от длинных подписей и не разъезжается
            рядами. На телефоне скрыт — там сразу под текстом должен идти
            подбор по машине, а не ряд кнопок.
          */}
          {!shortcutsHidden && shortcuts.length > 0 && (
            <div
              className="rise no-scrollbar mt-7 hidden w-full max-w-full gap-2 overflow-x-auto md:ml-4 md:flex"
              style={{ animationDelay: ".35s" }}
            >
              {shortcuts.map((s, i) => (
                <button
                  key={`${s.label}-${i}`}
                  onClick={() => goToCategory(s.category, s.label)}
                  className={`flex flex-none items-center gap-2 whitespace-nowrap border px-3.5 py-2.5 text-[0.78rem] transition-colors ${
                    s.category
                      ? "border-border bg-surface hover:border-primary hover:text-primary"
                      : "border-foreground bg-foreground text-background hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {/^(https?:)?\//.test(s.icon) ? (
                    <img
                      src={s.icon}
                      alt=""
                      className="h-4 w-4 flex-none object-contain"
                    />
                  ) : (
                    <Icon name={s.icon} size={16} className="flex-none" />
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative hidden h-[240px] flex-col py-4 md:col-span-6 md:flex md:h-[320px] md:py-6 md:pl-4">
          <MountPlan />
        </div>
      </div>

      {selection}

      <div className="rule" />

      <Scenarios />

      <div className="rule-hair" />

      <div className="py-6 md:py-10">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex h-6 w-6 flex-none items-center justify-center bg-primary text-[0.72rem] font-bold text-primary-foreground">
            3
          </span>
          <span className="font-head text-[1.05rem] font-bold uppercase tracking-tight">
            Знаете, что нужно
          </span>
          <span className="text-[0.85rem] text-muted-foreground">
            найдите сразу — «магнитола для Тойоты» или артикул с коробки
          </span>
        </div>

        <HeroSearch />
      </div>

      <div className="rule-hair" />

      <div className="grid grid-cols-1 gap-x-6 py-4 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground md:grid-cols-12">
        <div className="md:col-span-6">
          Розница и&nbsp;опт · отправка со&nbsp;склада в&nbsp;день заказа
        </div>
        <div className="md:col-span-6 md:text-right">
          Переходники и&nbsp;схема подключения в&nbsp;комплекте
        </div>
      </div>
    </section>
  );
};

export default Hero;