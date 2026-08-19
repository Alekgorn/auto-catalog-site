import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Scenario } from "@/data/scenarios";

interface Props {
  scenario: Scenario;
  /** Другие сценарии — плитки внизу страницы */
  others: Scenario[];
}

/**
 * Нижняя часть страницы сценария: подсказка, частые вопросы
 * и переходы к другим задачам.
 */
const ScenarioFooterInfo = ({ scenario, others }: Props) => {
  const navigate = useNavigate();

  return (
    <>
      {scenario.hint && (
        <>
          <div className="rule-hair" />
          <p className="flex items-start gap-3 py-6 text-[0.88rem] leading-relaxed text-muted-foreground">
            <Icon
              name="Info"
              size={17}
              className="mt-0.5 flex-none text-primary"
            />
            {scenario.hint}
          </p>
        </>
      )}

      {/* Частые вопросы */}
      {scenario.faq.length > 0 && (
        <>
          <div className="rule" />
          <div className="grid grid-cols-1 gap-x-6 py-9 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="eyebrow">Вопросы и ответы</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-tight">
                Частые вопросы
              </h2>
              <p className="mt-3 max-w-[24em] text-[0.87rem] leading-relaxed text-muted-foreground">
                Не нашли свой вопрос? Позвоните — подскажем по вашей машине.
              </p>
            </div>

            <div className="mt-6 md:col-span-8 md:mt-0">
              <Accordion type="single" collapsible className="w-full">
                {scenario.faq.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`q-${i}`}
                    className="border-t border-foreground border-b-0"
                  >
                    <AccordionTrigger className="py-4 text-left font-head text-[1.05rem] font-medium tracking-tight hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-[46em] pb-5 text-[0.92rem] leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </>
      )}

      {/* Другие сценарии */}
      <div className="rule-hair" />
      <div className="py-8">
        <div className="eyebrow">Другие задачи</div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((s) => (
            <button
              key={s.slug}
              onClick={() => navigate(`/scenario/${s.slug}`)}
              className="group flex h-full flex-col border border-border bg-surface p-4 text-left transition-colors hover:border-primary"
            >
              <Icon
                name={s.icon}
                fallback="CircleAlert"
                size={30}
                className="text-primary"
              />
              <span className="mt-3 block font-head text-[0.95rem] font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ScenarioFooterInfo;
