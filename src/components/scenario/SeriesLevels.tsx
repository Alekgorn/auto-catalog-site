import { SERIES_LEVELS } from "@/data/series-levels";

/**
 * Справка «чем отличаются магнитолы»: четыре уровня от базового
 * до флагмана. Ничего не фильтрует и ни о чём не спрашивает —
 * покупатель просто видит, за что берут доплату.
 */
const SeriesLevels = () => (
  <section className="py-9">
    <div className="rule" />

    <div className="pt-8">
      <div className="eyebrow">Как выбрать</div>
      <h2 className="mt-3 max-w-[18em] font-head text-2xl font-bold uppercase leading-tight tracking-tight">
        Чем отличаются магнитолы
      </h2>
      <p className="mt-3 max-w-[38em] text-[0.87rem] leading-relaxed text-muted-foreground">
        Внешне они похожи, а разница внутри. Четыре уровня — от самого
        доступного до флагманского. Посмотрите, что даёт доплата.
      </p>
    </div>

    <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SERIES_LEVELS.map((level) => (
        <article
          key={level.title}
          className="flex h-full flex-col border border-border bg-surface p-5"
        >
          <div className="flex items-baseline gap-2.5">
            <span className="font-head text-[1.6rem] font-bold leading-none text-primary">
              {level.step}
            </span>
            <span className="font-head text-[1.02rem] font-bold leading-snug tracking-tight">
              {level.title}
            </span>
          </div>

          <div className="mt-1.5 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground">
            {level.series}
          </div>

          <p className="mt-3 text-[0.85rem] leading-relaxed text-muted-foreground">
            {level.summary}
          </p>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-[0.8rem] leading-snug">
            {level.specs.map((spec) => (
              <div key={spec.label}>
                <dt className="font-medium text-foreground">{spec.label}</dt>
                <dd className="text-muted-foreground">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-auto pt-5">
            <div className="border border-border bg-background px-3 py-2.5 text-center">
              <div className="text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
                Цена
              </div>
              <div className="mt-0.5 font-head text-[0.95rem] font-bold text-primary">
                {level.price}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export default SeriesLevels;
