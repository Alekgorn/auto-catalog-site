import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { formatPrice } from '@/data/catalog';

/** Что сохраняет проводка — то, ради чего человек и переплачивает */
interface Keeps {
  label: string;
  ok: boolean;
}

interface WireView {
  name: string;
  price: number;
  /** FULL — сохраняет всё нужное, BASIC — часть функций теряется */
  level: 'full' | 'basic';
  keeps: Keeps[];
  /** Текст от админа: почему этот вариант такой, какой есть */
  note: string;
}

const CIVIC_FULL: WireView = {
  name: 'Переходник Андроид магнитолы для Honda Civic 2006–2011 хэтчбэк',
  price: 7907,
  level: 'full',
  keeps: [
    { label: 'Климат-контроль на экране', ok: true },
    { label: 'Кнопки на руле', ok: true },
    { label: 'Штатная камера', ok: true },
  ],
  note: 'Этот интерфейс сохраняет штатное управление климатом. Более дешёвые переходники позволяют запустить магнитолу, но климат на экране работать не будет.',
};

const CIVIC_BASIC: WireView = {
  name: 'Переходник Андроид магнитолы для Honda 2005–2010',
  price: 650,
  level: 'basic',
  keeps: [
    { label: 'Климат-контроль на экране', ok: false },
    { label: 'Кнопки на руле', ok: true },
  ],
  note: 'Магнитола будет работать, но штатное управление климатом не сохранится.',
};

const RIO_FULL: WireView = {
  name: 'Комплект проводов для Kia Rio 2012–2017 с камерой',
  price: 2390,
  level: 'full',
  keeps: [
    { label: 'Штатная камера заднего вида', ok: true },
    { label: 'Кнопки на руле', ok: true },
  ],
  note: 'Сохраняет штатную камеру — картинка выводится на новую магнитолу.',
};

/** Заголовок блока — одинаковый на всех состояниях */
const Head = () => (
  <div className="flex items-center gap-3">
    <span className="flex h-9 w-9 items-center justify-center bg-foreground text-background">
      <Icon name="Cable" size={18} />
    </span>
    <div>
      <div className="font-head text-lg font-bold uppercase tracking-tight">
        Подключение
      </div>
      <div className="text-sm text-muted-foreground">
        Шаг 3 из 3 — последний
      </div>
    </div>
  </div>
);

/** Карточка варианта: цена, что сохраняется, кнопка */
const WireCard = ({
  wire,
  recommended,
  onPick,
  picked,
}: {
  wire: WireView;
  recommended?: boolean;
  onPick: () => void;
  picked: boolean;
}) => {
  const full = wire.level === 'full';
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

      <div className="mt-3 font-medium leading-snug">{wire.name}</div>

      <ul className="mt-3 space-y-1.5">
        {wire.keeps.map((k) => (
          <li key={k.label} className="flex items-start gap-2 text-sm">
            <Icon
              name={k.ok ? 'Check' : 'X'}
              size={15}
              className={`mt-0.5 shrink-0 ${
                k.ok ? 'text-success' : 'text-primary'
              }`}
            />
            <span className={k.ok ? '' : 'text-muted-foreground line-through'}>
              {k.label}
            </span>
          </li>
        ))}
      </ul>

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

      {!full && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
          {wire.note}
        </p>
      )}
    </div>
  );
};

/** Состояние 1: машина размечена как «Фиксированная» — вопросов нет */
export const MockFixed = () => {
  const [picked, setPicked] = useState(false);
  const [openBudget, setOpenBudget] = useState(false);
  const [warn, setWarn] = useState(false);
  const [pickedBudget, setPickedBudget] = useState(false);

  return (
    <div className="border border-border bg-background p-6">
      <Head />
      <p className="mt-4 text-sm text-muted-foreground">
        Для Honda Civic 2006 подключение известно точно — подбираем сами.
      </p>

      <div className="mt-5 space-y-4">
        <WireCard
          wire={CIVIC_FULL}
          recommended
          picked={picked}
          onPick={() => {
            setPicked(true);
            setPickedBudget(false);
          }}
        />

        {!openBudget ? (
          <button
            onClick={() => setOpenBudget(true)}
            className="flex w-full items-center justify-center gap-2 border border-border px-5 py-3 font-head text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Icon name="Wallet" size={15} />
            Есть вариант дешевле — за 650 ₽
            <Icon name="ChevronDown" size={15} />
          </button>
        ) : (
          <div className="space-y-3">
            <WireCard
              wire={CIVIC_BASIC}
              picked={pickedBudget}
              onPick={() => setWarn(true)}
            />
            {warn && !pickedBudget && (
              <div className="border border-primary bg-primary/5 p-4">
                <div className="flex items-start gap-2">
                  <Icon
                    name="TriangleAlert"
                    size={17}
                    className="mt-0.5 shrink-0 text-primary"
                  />
                  <div>
                    <div className="font-head text-sm font-bold uppercase tracking-tight">
                      Климат-контроль работать не будет
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      На Honda Civic 2006 управление климатом выводится через
                      CAN-интерфейс. С этим переходником магнитола заработает,
                      но климат с экрана пропадёт.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setPickedBudget(true);
                          setPicked(false);
                          setWarn(false);
                        }}
                        className="border border-foreground px-4 py-2 font-head text-[0.7rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                      >
                        Всё равно выбрать
                      </button>
                      <button
                        onClick={() => setWarn(false)}
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
        )}
      </div>
    </div>
  );
};

/** Состояние 2: машина в режиме «Подбор» — один уточняющий вопрос */
export const MockAsk = () => {
  const [answer, setAnswer] = useState<'yes' | 'no' | 'idk' | null>(null);
  const [picked, setPicked] = useState(false);

  return (
    <div className="border border-border bg-background p-6">
      <Head />

      {!answer ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            На Kia Rio 2016 встречаются два варианта подключения. Один вопрос —
            и подберём точно.
          </p>
          <div className="mt-5 border border-foreground bg-card p-5">
            <div className="font-head text-base font-bold uppercase tracking-tight">
              На машине есть штатная камера заднего вида?
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Камера в ручке багажника или под эмблемой, картинка выводится на
              штатный экран при задней передаче.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: 'yes' as const, label: 'Да, есть' },
                { id: 'no' as const, label: 'Нет' },
                { id: 'idk' as const, label: 'Не знаю' },
              ].map((o) => (
                <button
                  key={o.id}
                  onClick={() => setAnswer(o.id)}
                  className="border border-foreground px-5 py-2.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : answer === 'idk' ? (
        <div className="mt-5 border border-border bg-card p-5">
          <div className="flex items-start gap-2">
            <Icon
              name="Camera"
              size={18}
              className="mt-0.5 shrink-0 text-primary"
            />
            <div>
              <div className="font-head text-base font-bold uppercase tracking-tight">
                Ничего страшного — определим по фото
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Пришлите фото задней двери и панели — посмотрим сами и скажем,
                какая проводка нужна. Обычно отвечаем в течение часа.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="bg-primary px-5 py-2.5 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-primary-foreground">
                  Отправить фото
                </button>
                <button
                  onClick={() => setAnswer(null)}
                  className="border border-border px-5 py-2.5 font-head text-[0.72rem] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  Ответить на вопрос
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => {
              setAnswer(null);
              setPicked(false);
            }}
            className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon name="Check" size={14} className="text-success" />
            Штатная камера: {answer === 'yes' ? 'есть' : 'нет'}
            <span className="underline">изменить</span>
          </button>
          <div className="mt-4">
            <WireCard
              wire={RIO_FULL}
              recommended
              picked={picked}
              onPick={() => setPicked(true)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MockFixed;