import { useState } from "react";
import Icon from "@/components/ui/icon";
import { SERIES_LEVELS } from "@/data/series-levels";

interface Props {
  /** Выбранный уровень: пустая строка — показываем все */
  value: string;
  onChange: (key: string) => void;
  /** Сколько магнитол в каждом уровне — по ключу уровня */
  counts: Record<string, number>;
}

/**
 * Справка «чем отличаются магнитолы», она же фильтр списка.
 *
 * Стоит в начале шага выбора магнитолы: объяснение нужно до выбора.
 * Нажатие на уровень сужает список ниже, повторное — снимает фильтр.
 * Никого не заставляет выбирать: не тронул — видит всё.
 */
const SeriesLevels = ({ value, onChange, counts }: Props) => {
  const [open, setOpen] = useState(false);

  /* Пустые уровни не показываем: обещать нечего, если товаров нет */
  const levels = SERIES_LEVELS.filter((l) => (counts[l.key] ?? 0) > 0);
  if (levels.length < 2) return null;

  /* Колонок ровно столько, сколько уровней: иначе справа зияет пустая
     клетка. Классы перечислены целиком — Tailwind не понимает имена,
     собранные из кусков на лету */
  const cols =
    levels.length === 2
      ? "sm:grid-cols-2"
      : levels.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section className="border border-border bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4">
        <h2 className="font-head text-[1.05rem] font-bold uppercase tracking-tight">
          Чем отличаются магнитолы
        </h2>
        <p className="text-[0.82rem] text-muted-foreground">
          {value
            ? "Нажмите ещё раз, чтобы показать все"
            : "Нажмите на уровень — оставим только его"}
        </p>
      </div>

      <div
        className={`mt-3.5 grid grid-cols-1 gap-px border-t border-border bg-border ${cols}`}
      >
        {levels.map((level) => {
          const active = value === level.key;
          return (
            <button
              key={level.key}
              onClick={() => onChange(active ? "" : level.key)}
              className={`flex flex-col p-4 text-left transition-colors ${
                active
                  ? "bg-primary/5 ring-1 ring-inset ring-primary"
                  : "bg-surface hover:bg-background"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-head text-[1.15rem] font-bold leading-none text-primary">
                  {level.step}
                </span>
                <span className="font-head text-[0.95rem] font-bold leading-snug tracking-tight">
                  {level.title}
                </span>
                {active && (
                  <Icon
                    name="Check"
                    size={15}
                    className="ml-auto flex-none text-primary"
                  />
                )}
              </div>

              <div className="mt-1 text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
                {level.series} · {counts[level.key]} шт
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
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border px-5 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {open ? "Свернуть характеристики" : "Показать характеристики"}
          <Icon
            name={open ? "ChevronUp" : "ChevronDown"}
            size={15}
            className="flex-none"
          />
        </button>

        {value && (
          <button
            onClick={() => onChange("")}
            className="text-[0.8rem] font-medium text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            Показать все магнитолы
          </button>
        )}
      </div>
    </section>
  );
};

export default SeriesLevels;