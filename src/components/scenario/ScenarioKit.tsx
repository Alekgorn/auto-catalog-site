import KitSection from "@/components/kit/KitSection";
import KitRecommend from "@/components/kit/KitRecommend";
import { Product, Vehicle } from "@/data/catalog";
import { Scenario } from "@/data/scenarios";
import KitNoFrames from "@/components/kit/KitNoFrames";
import KitWiring from "@/components/kit/KitWiring";
import Icon from "@/components/ui/icon";
import { useCatalog } from "@/context/CatalogContext";
import { modelBodyTypes } from "@/data/catalog";
import { pickWires } from "@/lib/wire-pick";
import {
  FRAMES_CATEGORY,
  WIRES_CATEGORY,
  hasFramesForVehicle,
} from "@/lib/kit-filter";

interface Props {
  /** Шаги сборки комплекта — есть не у каждого сценария */
  kit: NonNullable<Scenario["kit"]>;
  /** Адрес сценария — попадёт в отчёт по машинам без решения */
  scenarioSlug?: string;
  products: Product[];
  /** Полный каталог — по нему решаем, существует ли решение под машину */
  allProducts: Product[];
  vehicle: Vehicle | null;
  brandsCount: number;
  picks: Record<string, string>;
  skipped: Record<string, boolean>;

  /** Диагональ ведущей магнитолы — по ней фильтруем рамки */
  leadSize: number | null;
  /**
   * Диагонали, под которые есть рамки на выбранную машину.
   * По ним сужаем выбор магнитол на первом шаге.
   */
  availableSizes: number[];

  stepId: (i: number) => string;
  stepLocked: (i: number) => boolean;
  onPick: (product: Product) => void;
  onPickPlain: (product: Product) => void;
  onNeedVehicle: () => void;
  onNeedLead: () => void;
  onSkip: (i: number, category: string, skip: boolean) => void;
}

/**
 * Пошаговая сборка комплекта: список шагов и блок рекомендаций.
 * Логика переходов между шагами остаётся на странице — сюда приходят
 * готовые обработчики.
 */
const ScenarioKit = ({
  kit,
  scenarioSlug,
  products,
  allProducts,
  vehicle,
  brandsCount,
  picks,
  skipped,
  leadSize,
  availableSizes,
  stepId,
  stepLocked,
  onPick,
  onPickPlain,
  onNeedVehicle,
  onNeedLead,
  onSkip,
}: Props) => {
  const { brands, vehicleWiring } = useCatalog();
  /*
   * Комплект держится на переходной рамке: без неё магнитоле некуда встать.
   * Если под выбранную машину рамок нет, выбирать нечего ни на одном шаге —
   * гасим сборку целиком и объясняем, что делать дальше.
   *
   * Проверяем только сценарии, где рамка обязательна (шаг strictFit).
   * Для «шумоизоляции» или «регистратора» рамка ни при чём.
   */
  const needsFrame = kit.some(
    (s) => s.strictFit && s.category === FRAMES_CATEGORY,
  );
  /*
   * Наличие рамок проверяем по ПОЛНОМУ каталогу: дилерский фильтр
   * «только в наличии» временно прячет позиции, но это не значит, что
   * решения под машину не существует — иначе заглушка врала бы.
   */
  const blocked =
    !!vehicle && needsFrame && !hasFramesForVehicle(allProducts, vehicle);

  if (blocked && vehicle) {
    return (
      <div className="relative py-6">
        <KitNoFrames vehicle={vehicle} scenario={scenarioSlug} />

        {/* Шаги остаются под заглушкой — видно, что именно недоступно */}
        <div
          aria-hidden
          className="pointer-events-none mt-6 select-none opacity-30 blur-[2px] saturate-0"
        >
          {kit.slice(0, 2).map((step) => (
            <div
              key={step.category}
              className="border-t border-border py-6 first:border-t-0"
            >
              <div className="font-head text-lg font-bold uppercase tracking-tight">
                {step.title}
              </div>
              <p className="mt-1 text-[0.85rem] text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
  <>
    {kit.map((step, i) => {
      /*
       * Рамка продаётся комплектом с проводкой — шаг подключения
       * пропускаем целиком. Предложить проводку тому, у кого она уже в
       * коробке, значит продать вторую и получить возврат.
       */
      const frame = products.find((p) => p.id === picks[FRAMES_CATEGORY]);
      if (step.category === WIRES_CATEGORY && frame?.wireIncluded) {
        /* Молча убрать шаг нельзя: человек помнит, что проводка нужна, и
           будет искать её глазами. Говорим прямо — вопрос закрыт */
        return (
          <div key={step.category}>
            {i > 0 && <div className="rule-hair" />}
            <section id={stepId(i)} className="scroll-mt-24 py-11 md:py-14">
              <div className="flex items-start gap-3 border border-success/40 bg-success/5 p-5">
                <Icon
                  name="CircleCheck"
                  size={20}
                  className="mt-0.5 shrink-0 text-success"
                />
                <div>
                  <div className="font-head text-lg font-bold uppercase tracking-tight">
                    Проводка уже в комплекте
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Выбранная рамка идёт вместе с проводкой — докупать
                    ничего не нужно. Всё для подключения будет в коробке.
                  </p>
                </div>
              </div>
            </section>
          </div>
        );
      }

      /* Проводки размечены — показываем умный подбор вместо списка
         визуально похожих позиций. Не размечены — всё как раньше. */
      const smart =
        step.category === WIRES_CATEGORY &&
        vehicle &&
        !stepLocked(i) &&
        !pickWires(
          products.filter((p) => p.category === step.category),
          vehicle,
          {},
          modelBodyTypes(brands, vehicle.brand, vehicle.model),
          null,
        ).fallback;

      return (
      <div key={step.category}>
        {i > 0 && <div className="rule-hair" />}
        {smart ? (
          <section id={stepId(i)} className="scroll-mt-24 py-11 md:py-14">
            <KitWiring
              products={products.filter((p) => p.category === step.category)}
              vehicle={vehicle}
              modelBodies={modelBodyTypes(brands, vehicle!.brand, vehicle!.model)}
              wirings={vehicleWiring}
              frame={frame}
              pickedId={picks[step.category]}
              onPick={onPick}
            />
          </section>
        ) : (
        <KitSection
          step={step}
          products={products}
          vehicle={vehicle}
          brandsCount={brandsCount}
          pickedId={picks[step.category]}
          onPick={onPick}
          onNeedVehicle={onNeedVehicle}
          anchorId={stepId(i)}
          helpOffer={step.helpOffer}
          locked={stepLocked(i)}
          size={step.matchScreen ? leadSize : null}
          availableSizes={availableSizes}
          vehicleLabel={
            vehicle
              ? `${vehicle.brand} ${vehicle.model} ${vehicle.year} г.`
              : ""
          }
          onNeedLead={onNeedLead}
          skipped={!!skipped[step.category]}
          onSkip={(skip) => onSkip(i, step.category, skip)}
        />
        )}
      </div>
      );
    })}
    <KitRecommend
      products={products}
      vehicle={vehicle}
      picks={picks}
      onPick={onPickPlain}
      /* Советуем только когда основа собрана */
      ready={kit.every((s) => picks[s.category] || s.optional)}
      exclude={kit.map((s) => s.category)}
    />
  </>
  );
};

export default ScenarioKit;