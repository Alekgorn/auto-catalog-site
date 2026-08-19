import Icon from "@/components/ui/icon";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Scenario } from "@/data/scenarios";

interface Props {
  scenario: Scenario;
  /** Вступление, разрезанное по выделяемой фразе */
  introParts: string[];
  /** Марка из ссылки — «популярные марки» в футере ведут сюда */
  brandFilter: string;
  onClearBrand: () => void;
}

/**
 * Шапка страницы сценария: хлебные крошки, заголовок с иконкой,
 * вводный текст и плашка «пришли по ссылке с маркой».
 */
const ScenarioHero = ({
  scenario,
  introParts,
  brandFilter,
  onClearBrand,
}: Props) => (
  <>
    <Breadcrumbs
      items={[
        { label: "Подбор по задаче", to: "/#scenarios" },
        { label: scenario.heading },
      ]}
    />

    <div className="rule" />

    {/* Заголовок и живой текст */}
    <div className="grid grid-cols-1 gap-x-6 gap-y-6 py-9 md:grid-cols-12 md:py-12">
      <div className="md:col-span-7">
        <div className="flex items-start gap-4">
          <span className="flex h-16 w-16 flex-none items-center justify-center border border-foreground bg-primary text-primary-foreground">
            <Icon name={scenario.icon} fallback="CircleAlert" size={32} />
          </span>
          <div className="min-w-0 flex-1">
            {/* Подпись прячем, когда она повторяет заголовок */}
            {!scenario.hideEyebrow && (
              <div className="eyebrow">{scenario.title}</div>
            )}
            <h1
              className={`font-head text-3xl font-bold uppercase leading-[1.05] tracking-tight md:text-[40px] ${
                scenario.hideEyebrow ? "" : "mt-2"
              }`}
            >
              {scenario.heading}
            </h1>
          </div>
        </div>
      </div>

      <div className="md:col-span-5">
        <p className="text-[0.98rem] leading-relaxed text-muted-foreground">
          {introParts.map((part, i) =>
            // Нечётные куски — то, что попало между вырезанной фразой,
            // то есть сама выделяемая часть
            i % 2 === 1 ? (
              <strong key={i} className="font-semibold text-primary">
                {part}
              </strong>
            ) : (
              part
            ),
          )}
        </p>
      </div>
    </div>

    <div className="rule-hair" />

    {/* Пришли по ссылке с маркой */}
    {brandFilter && (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-primary bg-surface px-5 py-4">
        <div className="flex items-center gap-3">
          <Icon name="Tag" size={20} className="flex-none text-primary" />
          <div className="font-head text-[1.05rem] font-bold tracking-tight">
            Оборудование для {brandFilter}
          </div>
        </div>
        <button
          onClick={onClearBrand}
          className="border border-border px-4 py-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Показать все марки
        </button>
      </div>
    )}
  </>
);

export default ScenarioHero;
