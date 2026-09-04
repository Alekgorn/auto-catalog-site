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
import PhotoViewer from '@/components/PhotoViewer';
import {
  pickWires,
  WireAnswers,
  KEEP_LABELS,
  VehicleWiring,
  findWiring,
  wiringBodyChoice,
  bodyFromFrame,
} from '@/lib/wire-pick';

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

/** Карточка варианта: цена, что сохраняется, кнопка выбора */
const WireCard = ({
  wire,
  recommended,
  picked,
  onPick,
}: {
  wire: Product;
  recommended: boolean;
  picked: boolean;
  onPick: () => void;
}) => {
  const [zoom, setZoom] = useState<number | null>(null);
  const photos = productImages(wire);
  const full = wire.wireLevel === 'full';
  const keeps = wire.wireKeeps || {};
  const rows = Object.keys(KEEP_LABELS).filter((k) => k in keeps);

  return (
    <div
      className={`border p-5 ${
        recommended ? 'border-foreground bg-card' : 'border-border bg-card/60'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {recommended && (
          <span className="bg-foreground px-2 py-1 font-head text-[0.65rem] font-bold uppercase tracking-[0.08em] text-background">
            Рекомендуем
          </span>
        )}
        <span
          className={`flex items-center gap-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] ${
            full ? 'text-success' : 'text-[#B45309]'
          }`}
        >
          <Icon name={full ? 'CircleCheck' : 'TriangleAlert'} size={14} />
          {full ? 'Полная совместимость' : 'Базовое подключение'}
        </span>
      </div>

      <div className="mt-3 flex gap-4">
        {/* Проводки различаются разъёмами — по снимку это видно быстрее,
            чем по названию. Клик открывает фото во весь экран. */}
        <button
          type="button"
          onClick={() => setZoom(0)}
          aria-label={`Посмотреть фото: ${wire.name}`}
          className="group relative h-24 w-24 flex-none overflow-hidden border border-border bg-surface-muted"
        >
          <img
            src={photos[0]}
            alt={wire.name}
            loading="lazy"
            decoding="async"
            width={200}
            height={200}
            className="h-full w-full object-contain p-1 transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center bg-background/85 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name="Maximize2" size={13} />
          </span>
        </button>
        <div className="min-w-0 flex-1 font-medium leading-snug">
          {wire.name}
        </div>
      </div>

      <PhotoViewer
        images={photos}
        alt={wire.name}
        index={zoom}
        onClose={() => setZoom(null)}
      />

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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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

      {!full && wire.wireNote && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
          {wire.wireNote}
        </p>
      )}
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
  const [answers, setAnswers] = useState<WireAnswers>({});
  const [openBudget, setOpenBudget] = useState(false);
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
          {res.full.map((w, i) => (
            <div key={w.id} className="space-y-2">
              <WireCard
                wire={w}
                recommended={i === 0}
                picked={pickedId === w.id}
                onPick={() => onPick(w)}
              />
              {/* Почему именно эта проводка — иначе цена выглядит
                  прихотью продавца, а не необходимостью */}
              {i === 0 && (w.wireNote || wiring?.reason) && (
                <div className="flex items-start gap-2 border-l-2 border-foreground bg-secondary/40 px-4 py-3">
                  <Icon
                    name="Info"
                    size={16}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">
                    {w.wireNote || wiring?.reason}
                  </p>
                </div>
              )}
            </div>
          ))}

          {res.budget.length > 0 &&
            (!openBudget && res.full.length > 0 ? (
              <button
                onClick={() => setOpenBudget(true)}
                className="flex w-full items-center justify-center gap-2 border border-border px-5 py-3 font-head text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <Icon name="Wallet" size={15} />
                Есть вариант дешевле — за {formatPrice(res.budget[0].price)}
                <Icon name="ChevronDown" size={15} />
              </button>
            ) : (
              res.budget.map((w) => (
                <div key={w.id} className="space-y-3">
                  <WireCard
                    wire={w}
                    recommended={res.full.length === 0}
                    picked={pickedId === w.id}
                    onPick={() =>
                      res.full.length ? setWarnFor(w.id) : onPick(w)
                    }
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
