import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Product,
  Vehicle,
  BodyType,
  formatPrice,
  bodyTypeLabel,
  productImages,
} from '@/data/catalog';
import {
  pickWires,
  WireAnswers,
  KEEP_LABELS,
  VehicleWiring,
  findWiring,
  wiringBodyChoice,
  bodyFromFrame,
  transitionalYear,
  matchingWirings,
} from '@/lib/wire-pick';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  /** Товары раздела проводок */
  products: Product[];
  vehicle: Vehicle | null;
  /** Кузова, которые бывают у этой модели — из справочника марок */
  modelBodies: BodyType[];
  /** Все настройки подбора — какая подойдёт, решаем по кузову */
  wirings?: VehicleWiring[];
  /** Выбранная рамка — по ней узнаём кузов, не спрашивая покупателя */
  frame?: Product | null;
  pickedId?: string;
  onPick: (product: Product) => void;
}

/**
 * Карточка варианта подключения.
 *
 * Фото крупное и кликабельное: проводки различаются разъёмами, и по снимку
 * это видно быстрее, чем по названию. Клик открывает быстрый просмотр —
 * тот же, что в каталоге, чтобы поведение нигде не отличалось.
 */
const WireCard = ({
  wire,
  recommended,
  picked,
  onPick,
  note,
  limited,
}: {
  wire: Product;
  recommended: boolean;
  picked: boolean;
  onPick: () => void;
  /** Пояснение админа — почему этот вариант такой */
  note?: string;
  /** Вариант из скрытого списка: работает, но с ограничениями */
  limited?: boolean;
}) => {
  const photos = productImages(wire);
  const keeps = wire.wireKeeps || {};
  const rows = Object.keys(KEEP_LABELS).filter((k) => k in keeps);
  const text = note || wire.wireNote;

  return (
    <div
      className={`border p-5 ${
        recommended ? 'border-foreground bg-card' : 'border-border bg-card/60'
      }`}
    >
      {(recommended || limited) && (
        <div className="flex flex-wrap items-center gap-2">
          {recommended && (
            <span className="bg-foreground px-2 py-1 font-head text-[0.65rem] font-bold uppercase tracking-[0.08em] text-background">
              Рекомендуем
            </span>
          )}
          {/* Про ограничения предупреждаем только у скрытых вариантов —
              у остальных ярлык «полная совместимость» лишний шум */}
          {limited && (
            <span className="flex items-center gap-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-[#B45309]">
              <Icon name="TriangleAlert" size={14} />
              Ограниченная совместимость
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-5 sm:flex-row">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('quickview:open', { detail: wire.id }),
            )
          }
          aria-label={`Быстрый просмотр: ${wire.name}`}
          className="group relative h-44 w-full flex-none overflow-hidden border border-border bg-surface-muted sm:h-40 sm:w-40"
        >
          <img
            src={photos[0]}
            alt={wire.name}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center bg-background/85 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name="Maximize2" size={14} />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="font-medium leading-snug">{wire.name}</div>

          {/* Текст админа идёт сразу под названием — он объясняет, за что
              цена, и должен читаться раньше кнопки «Выбрать» */}
          {text && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {text}
            </p>
          )}

          {rows.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {rows.map((k) => (
                <li key={k} className="flex items-start gap-2 text-sm">
                  <Icon
                    name={keeps[k] ? 'Check' : 'X'}
                    size={15}
                    className={`mt-0.5 shrink-0 ${
                      keeps[k] ? 'text-success' : 'text-primary'
                    }`}
                  />
                  <span
                    className={
                      keeps[k] ? '' : 'text-muted-foreground line-through'
                    }
                  >
                    {KEEP_LABELS[k]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="font-head text-2xl font-bold">
          {formatPrice(wire.price)}
        </div>
        <button
          onClick={onPick}
          className={`px-5 py-2.5 font-head text-[0.75rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
            picked
              ? 'bg-success text-success-foreground'
              : recommended
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border border-foreground hover:bg-foreground hover:text-background'
          }`}
        >
          {picked ? 'В комплекте' : 'Выбрать'}
        </button>
      </div>
    </div>
  );
};

/**
 * Блок «Подключение» — умный подбор проводки вместо списка похожих позиций.
 *
 * Показывается только там, где проводки размечены. Пока разметки нет,
 * компонент возвращает null, и шаг рисуется как раньше — обычным списком.
 * Так результат виден сразу на тех машинах, до которых дошли руки, а
 * остальное продолжает работать по-старому.
 */
const KitWiring = ({
  products,
  vehicle,
  modelBodies,
  wirings = [],
  frame,
  pickedId,
  onPick,
}: Props) => {
  const { contacts } = useCatalog();
  const [answers, setAnswers] = useState<WireAnswers>({});
  const [openBudget, setOpenBudget] = useState(false);
  /** Раскрыты ли проводки соседнего периода — для переходного года */
  const [openTransition, setOpenTransition] = useState(false);
  const [warnFor, setWarnFor] = useState<string | null>(null);

  /*
   * Кузов знаем из ответа покупателя или из выбранной рамки. Он решает,
   * какая настройка подходит: у Civic 2006–2011 их две — под хэтчбек с
   * дорогим интерфейсом и общая с обычным переходником.
   */
  const knownBody = answers.body ?? bodyFromFrame(frame);
  const wiring = useMemo(
    () => findWiring(wirings, vehicle, knownBody),
    [wirings, vehicle, knownBody],
  );

  /*
   * Год машины попал на стык двух периодов: рамки «2006–2011» и
   * «2011–2017» обе продаются под 2011-й. Мы взяли проводку старшего
   * периода, но это выбор по вероятности, а не по факту — молчать о нём
   * нечестно: покупатель закажет не ту деталь и вернётся с претензией.
   */
  const transitional = useMemo(
    () => transitionalYear(wirings, vehicle),
    [wirings, vehicle],
  );
  /*
   * Кузова для вопроса. Если одна настройка привязана к хэтчбеку, а вторая
   * общая — выбор всё равно есть, просто вторая описана «для остальных».
   * Поэтому дополняем кузовами модели: спросить надо «хэтчбек или седан»,
   * а не показать единственную кнопку.
   */
  const bodyChoice = useMemo(() => {
    if (knownBody) return [];
    const fromWirings = wiringBodyChoice(wirings, vehicle);
    if (!fromWirings.length) return [];
    const all = new Set<BodyType>([...fromWirings, ...modelBodies]);
    return [...all];
  }, [wirings, vehicle, knownBody, modelBodies]);

  const res = useMemo(
    () => pickWires(products, vehicle, answers, modelBodies, wiring, frame),
    [products, vehicle, answers, modelBodies, wiring, frame],
  );

  /*
   * Проводки соседнего периода — то, что показываем под жёлтой плашкой.
   * Считаем их так же, как основные, но от строки другого периода: у неё
   * своя проводка и свои ограничения. Дубли отсеиваем — если обе строки
   * ведут к одному товару, показывать его дважды незачем.
   */
  const otherPeriodWires = useMemo(() => {
    if (!transitional || !wiring) return [];
    const others = matchingWirings(wirings, vehicle).filter(
      (w) => `${w.years[0]}-${w.years[1]}` !== `${wiring.years[0]}-${wiring.years[1]}`,
    );
    const shownIds = new Set([...res.full, ...res.budget].map((p) => p.id));
    const out: Product[] = [];
    others.forEach((w) => {
      const alt = pickWires(products, vehicle, answers, modelBodies, w, frame);
      [...alt.full, ...alt.budget].forEach((p) => {
        if (shownIds.has(p.id)) return;
        shownIds.add(p.id);
        out.push(p);
      });
    });
    return out;
  }, [
    transitional,
    wiring,
    wirings,
    vehicle,
    products,
    answers,
    modelBodies,
    frame,
    res,
  ]);

  // Разметки нет — пусть работает привычный список
  if (res.fallback) return null;

  /* Настройки расходятся по кузову, а кузов неизвестен — сначала спросим.
     Иначе показали бы дорогую проводку владельцу седана */
  const question =
    bodyChoice.length > 1
      ? {
          id: 'body' as const,
          title: 'Какой у вас кузов?',
          hint: 'От кузова зависит форма штатного разъёма — проводки разные.',
          bodies: bodyChoice,
        }
      : res.question;

  const answer = (id: string, val: boolean | BodyType | null) =>
    setAnswers((a) => ({ ...a, [id]: val }));

  const asked = Object.entries(answers).filter(([, v]) => v !== undefined);

  return (
    <div className="border border-border bg-background p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center bg-foreground text-background">
          <Icon name="Cable" size={18} />
        </span>
        <div>
          <div className="font-head text-lg font-bold uppercase tracking-tight">
            Подключение
          </div>
          {vehicle && (
            <div className="text-sm text-muted-foreground">
              {vehicle.brand} {vehicle.model} {vehicle.year} г.
            </div>
          )}
        </div>
      </div>

      {asked.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {asked.map(([k, v]) => (
            <button
              key={k}
              onClick={() => setAnswers((a) => ({ ...a, [k]: undefined }))}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon name="Check" size={14} className="text-success" />
              {k === 'body'
                ? bodyTypeLabel(String(v))
                : v
                  ? 'есть'
                  : 'нет'}
              <span className="underline">изменить</span>
            </button>
          ))}
        </div>
      )}

      {question ? (
        <div className="mt-5 border border-foreground bg-card p-5">
          <div className="font-head text-base font-bold uppercase tracking-tight">
            {question.title}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {question.hint}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {question.id === 'body' ? (
              (question.bodies || []).map((b) => (
                <button
                  key={b}
                  onClick={() => answer('body', b)}
                  className="border border-foreground px-5 py-2.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                >
                  {bodyTypeLabel(b)}
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => answer(question!.id, true)}
                  className="border border-foreground px-5 py-2.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                >
                  Да, есть
                </button>
                <button
                  onClick={() => answer(question!.id, false)}
                  className="border border-foreground px-5 py-2.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                >
                  Нет
                </button>
                <button
                  onClick={() => answer(question!.id, null)}
                  className="border border-border px-5 py-2.5 font-head text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  Не знаю
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/*
            Несколько проводок и точного ответа нет — честно говорим об этом.
            Молча показать одну наугад хуже: покупатель закажет не ту деталь
            и вернётся с претензией. Лучше признать предел и предложить помощь.
          */}
          {res.pickMode === 'select' && res.full.length + res.budget.length > 1 && (
            <div className="border border-[#B45309] bg-[#B45309]/5 p-5">
              <div className="flex items-start gap-2.5">
                <Icon
                  name="TriangleAlert"
                  size={18}
                  className="mt-0.5 shrink-0 text-[#B45309]"
                />
                <div>
                  <div className="font-head text-sm font-bold uppercase tracking-tight text-[#B45309]">
                    На ваш автомобиль есть несколько вариантов проводки
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Мы, конечно, специалисты, но, увы, не всесильные — угадать,
                    какая стоит именно у вас, не получится. Ниже список всех
                    подходящих вариантов.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Точно определим по фото: пришлите нам снимок магнитолы или
                    проводов — либо сравните разъём с фотографиями ниже сами.
                  </p>
                  <a
                    href={contacts.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 bg-foreground px-4 py-2.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90"
                  >
                    <Icon name="Camera" size={15} />
                    Отправить фото — подберём точно
                  </a>
                </div>
              </div>
            </div>
          )}

          {/*
            Год на стыке поколений. Проводку показываем — ту, что вероятнее,
            — но честно говорим, что бывает и другая. Варианты прячем под
            кнопку: разворачивать их всем незачем, а тому, у кого машина
            «пограничная», они нужны под рукой.
          */}
          {transitional && (
            <div className="border border-[#B45309] bg-[#B45309]/5 p-5">
              <div className="flex items-start gap-2.5">
                <Icon
                  name="TriangleAlert"
                  size={18}
                  className="mt-0.5 shrink-0 text-[#B45309]"
                />
                <div className="min-w-0">
                  <div className="font-head text-sm font-bold uppercase tracking-tight text-[#B45309]">
                    {vehicle?.year} год — переходный
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    В этот год менялось поколение, и с завода ставили
                    проводку как старого образца, так и нового. Мы показали
                    более вероятный вариант. Если разъём не совпал —
                    посмотрите второй.
                  </p>
                  <button
                    onClick={() => setOpenTransition((v) => !v)}
                    className="mt-3 flex items-center gap-2 border border-[#B45309] px-4 py-2 font-head text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#B45309] transition-colors hover:bg-[#B45309] hover:text-background"
                  >
                    <Icon
                      name={openTransition ? 'ChevronUp' : 'ChevronDown'}
                      size={15}
                    />
                    {openTransition
                      ? 'Скрыть другие варианты'
                      : 'Показать другие варианты'}
                  </button>
                  <a
                    href={contacts.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-sm text-muted-foreground underline transition-colors hover:text-foreground"
                  >
                    <Icon name="Camera" size={15} />
                    Пришлите фото разъёма — скажем точно
                  </a>
                </div>
              </div>
            </div>
          )}

          {transitional &&
            openTransition &&
            otherPeriodWires.map((w) => (
              <WireCard
                key={`t-${w.id}`}
                wire={w}
                recommended={false}
                picked={pickedId === w.id}
                onPick={() => onPick(w)}
              />
            ))}

          {res.pickMode === 'select'
            ? /* Режим подбора: все варианты равны, ничего не прячем */
              [...res.full, ...res.budget].map((w) => (
                <WireCard
                  key={w.id}
                  wire={w}
                  recommended={false}
                  picked={pickedId === w.id}
                  onPick={() => onPick(w)}
                />
              ))
            : res.full.map((w, i) => (
                <WireCard
                  key={w.id}
                  wire={w}
                  recommended={i === 0}
                  picked={pickedId === w.id}
                  onPick={() => onPick(w)}
                  note={i === 0 ? w.wireNote || wiring?.reason : undefined}
                />
              ))}

          {/* Точный вариант известен — остальные прячем, чтобы не путать,
              но оставляем доступными: вдруг нужен вариант подешевле */}
          {res.pickMode === 'fixed' &&
            res.budget.length > 0 &&
            (!openBudget ? (
              <button
                onClick={() => setOpenBudget(true)}
                className="flex w-full items-center justify-center gap-2 border border-border px-5 py-3 font-head text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <Icon name="Wallet" size={15} />
                Другие варианты — от {formatPrice(res.budget[0].price)}
                <Icon name="ChevronDown" size={15} />
              </button>
            ) : (
              res.budget.map((w) => (
                <div key={w.id} className="space-y-3">
                  <WireCard
                    wire={w}
                    recommended={false}
                    limited
                    picked={pickedId === w.id}
                    onPick={() => setWarnFor(w.id)}
                  />
                  {warnFor === w.id && pickedId !== w.id && (
                    <div className="border border-primary bg-primary/5 p-4">
                      <div className="flex items-start gap-2">
                        <Icon
                          name="TriangleAlert"
                          size={17}
                          className="mt-0.5 shrink-0 text-primary"
                        />
                        <div>
                          <div className="font-head text-sm font-bold uppercase tracking-tight">
                            Часть функций работать не будет
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {w.wireNote ||
                              'С этой проводкой магнитола заработает, но часть штатных функций не сохранится.'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                onPick(w);
                                setWarnFor(null);
                              }}
                              className="border border-foreground px-4 py-2 font-head text-[0.7rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                            >
                              Всё равно выбрать
                            </button>
                            <button
                              onClick={() => setWarnFor(null)}
                              className="bg-foreground px-4 py-2 font-head text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-background"
                            >
                              Оставить рекомендуемый
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ))}

          {res.full.length === 0 && res.budget.length === 0 && (
            <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
              Под такое сочетание готового варианта нет — напишите нам, подберём
              вручную.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KitWiring;