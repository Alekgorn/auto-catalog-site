import { useState } from "react";
import Icon from "@/components/ui/icon";
import { SERIES_LEVELS } from "@/data/series-levels";

/**
 * Справка «чем отличаются магнитолы»: четыре уровня от базового
 * до флагмана. Стоит перед списком, потому что объяснение нужно
 * до выбора, а не после него.
 *
 * Свёрнутый вид — четыре строки с ценой: занимает мало места и не
 * отодвигает товары. Подробные характеристики открываются по нажатию,
 * чтобы не заваливать цифрами тех, кому это не нужно.
 */
const SeriesLevels = () => {
  const [open, setOpen] = useState(false);

  return (
    <section className="border border-border bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4">
        <h2 className="font-head text-[1.05rem] font-bold uppercase tracking-tight">
          Чем отличаются магнитолы
        </h2>
        <p className="text-[0.82rem] text-muted-foreground">
          Внешне похожи — разница внутри
        </p>
      </div>

      <div className="mt-3.5 grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {SERIES_LEVELS.map((level) => (
          <article key={level.title} className="flex flex-col bg-surface p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-head text-[1.15rem] font-bold leading-none text-primary">
                {level.step}
              </span>
              <span className="font-head text-[0.95rem] font-bold leading-snug tracking-tight">
                {level.title}
              </span>
            </div>

            <div className="mt-1 text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
              {level.series}
            </div>

            <p className="mt-2 text-[0.82rem] leading-relaxed text-muted-foreground">
              {level.summary}
            </p>

            {open && (
              <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[0.78rem] leading-snug">
                {level.specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="font-medium text-foreground">
                      {spec.label}
                    </dt>
                    <dd className="text-muted-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-auto pt-3 font-head text-[0.9rem] font-bold text-primary">
              {level.price}
            </div>
          </article>
        ))}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 border-t border-border px-5 py-3 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        {open ? "Свернуть характеристики" : "Показать характеристики"}
        <Icon
          name={open ? "ChevronUp" : "ChevronDown"}
          size={15}
          className="flex-none"
        />
      </button>
    </section>
  );
};

export default SeriesLevels;
