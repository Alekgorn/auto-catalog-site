import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import ProductCard from '@/components/ProductCard';
import {
  Product,
  Vehicle,
  BodyType,
  formatPrice,
  bodyTypeLabel,
} from '@/data/catalog';
import {
  pickWires,
  WireAnswers,
  VehicleWiring,
  findWiring,
  wiringBodyChoice,
  bodyFromFrame,
  transitionalYear,
  matchingWirings,
} from '@/lib/wire-pick';
import { useCatalog } from '@/context/CatalogContext';

/** Сколько карточек добавляет «Показать ещё» — два ряда сетки */
const STEP_MORE = 10;

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
  const { contacts, wireFeatures } = useCatalog();
  const [answers, setAnswers] = useState<WireAnswers>({});
  const [openBudget, setOpenBudget] = useState(false);
  /* Сколько вариантов показываем сразу. Ряд в каталоге — пять карточек,
     берём два ряда: столько влезает без прокрутки на ноутбуке */
  const [shown, setShown] = useState(STEP_MORE);
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
    () =>
      pickWires(
        products,
        vehicle,
        answers,
        modelBodies,
        wiring,
        frame,
        wireFeatures,
      ),
    [products, vehicle, answers, modelBodies, wiring, frame, wireFeatures],
  );

  /* Что показываем в основной сетке. В режиме «рекомендуем» остальные
     варианты уезжают под кнопку, в обычном — идут общим списком */
  const mainList = useMemo(
    () =>
      res.pickMode === 'fixed' ? res.full : [...res.full, ...res.budget],
    [res],
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
      const alt = pickWires(
        products,
        vehicle,
        answers,
        modelBodies,
        w,
        frame,
        wireFeatures,
      );
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

          {transitional && openTransition && otherPeriodWires.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {otherPeriodWires.map((w) => (
                <ProductCard
                  key={`t-${w.id}`}
                  product={w}
                  vehicle={vehicle}
                  picked={pickedId === w.id}
                  onPick={() => onPick(w)}
                  showWireFeatures
                />
              ))}
            </div>
          )}

          {/* Сетка как в каталоге: проводка — такой же товар, и выбивать
              её из общего строя незачем. Признаки подключения показываем
              прямо в карточке, ради них и была крупная вёрстка */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {mainList.slice(0, shown).map((w, i) => (
              <ProductCard
                key={w.id}
                product={w}
                vehicle={vehicle}
                picked={pickedId === w.id}
                onPick={() => onPick(w)}
                recommended={res.pickMode === 'fixed' && i === 0}
                showWireFeatures
              />
            ))}

            {shown < mainList.length && (
              <button
                onClick={() => setShown((n) => n + STEP_MORE)}
                className="group flex min-h-[13rem] flex-col items-center justify-center gap-2 border border-dashed border-foreground bg-surface px-3 py-6 text-center transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Icon name="Plus" size={22} className="flex-none" />
                <span className="font-head text-[0.8rem] font-bold uppercase tracking-[0.06em]">
                  Показать ещё
                </span>
                <span className="text-[0.78rem] text-muted-foreground transition-colors group-hover:text-primary-foreground/80">
                  ещё {mainList.length - shown}
                </span>
              </button>
            )}
          </div>

          {/* Пояснение админа к рекомендованной проводке. В карточке для
              него места нет, а прочитать его надо: оно объясняет цену */}
          {res.pickMode === 'fixed' &&
            (res.full[0]?.wireNote || wiring?.reason) && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {res.full[0]?.wireNote || wiring?.reason}
              </p>
            )}

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
                {res.budget[0].price < res.full[0].price
                  ? `Дешевле, но без части функций — от ${formatPrice(res.budget[0].price)}`
                  : 'Другие подходящие варианты'}
                <Icon name="ChevronDown" size={15} />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {res.budget.map((w) => (
                  <ProductCard
                    key={w.id}
                    product={w}
                    vehicle={vehicle}
                    picked={pickedId === w.id}
                    /* Сразу не выбираем: сначала честно предупреждаем,
                       что часть функций не заработает */
                    onPick={() => setWarnFor(w.id)}
                    showWireFeatures
                  />
                ))}
              </div>
            ))}

          {/* Предупреждение о неполном варианте. Стоит под сеткой: в
              карточке каталога места для него нет, а сказать надо до
              того, как человек положит товар в комплект */}
          {warnFor && pickedId !== warnFor && (
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
                    {res.budget.find((w) => w.id === warnFor)?.wireNote ||
                      'Магнитола заработает, но не всё из того, что вы отметили: сверьтесь со списком в карточке.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const w = res.budget.find((x) => x.id === warnFor);
                        if (w) onPick(w);
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