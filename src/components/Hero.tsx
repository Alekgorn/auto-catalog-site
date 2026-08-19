import MountPlan from "@/components/MountPlan";
import Scenarios from "@/components/Scenarios";
import HeroSearch from "@/components/HeroSearch";
import { useCatalog } from "@/context/CatalogContext";

interface Props {
  /** Блок подбора по машине — встаёт сразу под заголовком, до поиска */
  selection?: React.ReactNode;
}

const Hero = ({ selection }: Props) => {
  const { hotspots } = useCatalog();

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
            местам и разъёмам. Не знаешь, что искать – ткни в нужный узел на
            схеме справа.
          </p>
        </div>

        <div className="relative hidden h-[250px] flex-col py-3 md:col-span-6 md:flex md:h-[330px] md:py-4 md:pl-2">
          <MountPlan hotspots={hotspots} />
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