import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ProductLevel } from "@/data/catalog";

interface Props {
  /** Классы из админки — уже отфильтрованные по наличию товаров */
  levels: ProductLevel[];
  /** Выбранный класс: пустая строка — показываем все */
  value: string;
  onChange: (key: string) => void;
  /** Сколько магнитол в каждом классе — по ключу класса */
  counts: Record<string, number>;
  /** Вилка цен по классу, посчитанная от реальных товаров */
  prices: Record<string, string>;
}

/**
 * Справка «чем отличаются магнитолы», она же фильтр списка.
 *
 * Стоит в начале шага выбора магнитолы: объяснение нужно до выбора.
 * Нажатие на класс сужает список ниже, повторное — снимает фильтр.
 * Никого не заставляет выбирать: не тронул — видит всё.
 *
 * Содержание классов правится в админке, цены считаются от каталога.
 */
const SeriesLevels = ({ levels, value, onChange, counts, prices }: Props) => {
  const [open, setOpen] = useState(false);

  /* Один класс объяснять нечего: сравнивать не с чем */
  if (levels.length < 2) return null;

  /* Колонок ровно столько, сколько классов: иначе справа зияет пустая
     клетка. Классы перечислены целиком — Tailwind не понимает имена,
     собранные из кусков на лету */
  const cols =
    levels.length === 2
      ? "sm:grid-cols-2"
      : levels.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  /* Раскрывать нечего, если ни у одного класса нет характеристик */
  const hasDetails = levels.some(
    (l) => l.specs.length > 0 || l.extra.length > 0 || l.suits.trim(),
  );

  return (
    <section className="border border-foreground bg-surface">
      {/* Шапка залита цветом бренда: раньше блок читался как продолжение
          фона и подсказку про нажатие просто не замечали */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-foreground px-5 py-3">
        <h2 className="font-head text-[1.05rem] font-bold uppercase tracking-tight text-background">
          Чем отличаются магнитолы
        </h2>
        <p className="flex items-center gap-2 bg-primary px-3 py-1.5 font-head text-[0.76rem] font-bold uppercase tracking-[0.04em] text-primary-foreground">
          <Icon name="MousePointerClick" size={14} className="flex-none" />
          {value
            ? "Нажмите ещё раз, чтобы показать все"
            : "Нажмите на класс — оставим только его"}
        </p>
      </div>

      <div
        className={`mt-3.5 grid grid-cols-1 gap-px border-t border-border bg-border ${cols}`}
      >
        {levels.map((level, i) => {
          const active = value === level.id;
          /* Класс без товаров всё равно показываем: лестница уровней
             начинается с базового, и без него кажется, что дешёвых
             магнитол не бывает. Но нажимать нечего — фильтр даст пустоту */
          const empty = !counts[level.id];
          return (
            <button
              key={level.id}
              onClick={() => !empty && onChange(active ? "" : level.id)}
              aria-disabled={empty}
              className={`flex flex-col p-4 text-left transition-colors ${
                empty
                  ? "cursor-default bg-surface opacity-60"
                  : active
                    ? "bg-primary/5 ring-1 ring-inset ring-primary"
                    : "bg-surface hover:bg-background"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-head text-[1.15rem] font-bold leading-none text-primary">
                  {i + 1}
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

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {level.series && (
                  <span className="border border-border bg-background px-1.5 py-0.5 font-head text-[0.7rem] font-bold uppercase tracking-[0.04em] text-foreground">
                    {level.series}
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 font-head text-[0.7rem] font-bold uppercase tracking-[0.04em] ${
                    counts[level.id]
                      ? "bg-foreground text-background"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {counts[level.id]
                    ? `${counts[level.id]} шт`
                    : "нет в наличии"}
                </span>
              </div>

              {level.summary && (
                <p className="mt-2 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {level.summary}
                </p>
              )}

              {open && (
                <div className="mt-3 border-t border-border pt-3 text-[0.78rem] leading-snug">
                  {level.suits && (
                    <p className="mb-2 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Подходит:{" "}
                      </span>
                      {level.suits}
                    </p>
                  )}

                  <dl className="space-y-1.5">
                    {[...level.specs, ...level.extra].map(([k, v], si) => (
                      <div key={`${k}-${si}`}>
                        <dt className="font-medium text-foreground">{k}</dt>
                        <dd className="text-muted-foreground">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div
                className={`mt-auto pt-3 font-head text-[0.9rem] font-bold ${
                  empty ? "text-muted-foreground" : "text-primary"
                }`}
              >
                {prices[level.id] ?? "Сейчас не возим"}
              </div>
            </button>
          );
        })}
      </div>

      {(hasDetails || value) && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border px-5 py-3">
          {hasDetails && (
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
          )}

          {value && (
            <button
              onClick={() => onChange("")}
              className="text-[0.8rem] font-medium text-primary underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              Показать все магнитолы
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default SeriesLevels;
