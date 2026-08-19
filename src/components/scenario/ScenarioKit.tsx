import KitSection from "@/components/kit/KitSection";
import KitRecommend from "@/components/kit/KitRecommend";
import { Product, Vehicle } from "@/data/catalog";
import { Scenario } from "@/data/scenarios";

interface Props {
  /** Шаги сборки комплекта — есть не у каждого сценария */
  kit: NonNullable<Scenario["kit"]>;
  products: Product[];
  vehicle: Vehicle | null;
  brandsCount: number;
  picks: Record<string, string>;
  skipped: Record<string, boolean>;

  /** Диагональ ведущей магнитолы — по ней фильтруем рамки */
  leadSize: number | null;

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
  products,
  vehicle,
  brandsCount,
  picks,
  skipped,
  leadSize,
  stepId,
  stepLocked,
  onPick,
  onPickPlain,
  onNeedVehicle,
  onNeedLead,
  onSkip,
}: Props) => (
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

export default ScenarioKit;