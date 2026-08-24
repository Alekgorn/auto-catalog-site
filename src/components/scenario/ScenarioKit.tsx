import KitSection from "@/components/kit/KitSection";
import KitRecommend from "@/components/kit/KitRecommend";
import { Product, Vehicle } from "@/data/catalog";
import { Scenario } from "@/data/scenarios";
import KitNoFrames from "@/components/kit/KitNoFrames";
import { FRAMES_CATEGORY, hasFramesForVehicle } from "@/lib/kit-filter";

interface Props {
  /** Шаги сборки комплекта — есть не у каждого сценария */
  kit: NonNullable<Scenario["kit"]>;
  /** Адрес сценария — попадёт в отчёт по машинам без решения */
  scenarioSlug?: string;
  products: Product[];
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
  const blocked =
    !!vehicle && needsFrame && !hasFramesForVehicle(products, vehicle);

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
    {kit.map((step, i) => (
      <div key={step.category}>
        {i > 0 && <div className="rule-hair" />}
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
      </div>
    ))}
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