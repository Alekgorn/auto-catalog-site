import Icon from '@/components/ui/icon';
import { BODY_TYPES } from '@/data/catalog';
import {
  AdminProduct,
  SetField,
  WIRE_TECH,
  WIRE_KEEPS,
  WIRE_LEVELS,
  WHEEL_SIDES,
  WireTechValue,
  WireLevel,
  label,
  field,
} from './product-types';

interface Props {
  form: AdminProduct;
  set: SetField;
}

const TECH_OPTS: { id: WireTechValue; label: string }[] = [
  { id: 'yes', label: 'Да' },
  { id: 'no', label: 'Нет' },
  { id: 'any', label: 'Неважно' },
];

/**
 * Вкладка «Подключение» — только для проводок и переходников.
 *
 * Здесь два блока, и они отвечают на разные вопросы. «С чем работает» —
 * фильтр: если проводка не рассчитана на машину со штатным усилителем, а
 * усилитель есть, покупатель этот товар вообще не увидит. «Что останется
 * работать» — наоборот, товар показываем, но честно пишем, что теряется.
 *
 * Смысл разделения простой: дешёвый переходник не «неправильный» — он
 * рабочий, просто без климата. Спрятать его нельзя (кому-то климат не
 * нужен), выдать за равноценный — тоже: человек купит, потеряет функцию
 * и вернётся недовольным.
 */
const ProductWiringTab = ({ form, set }: Props) => {
  const tech = form.wireTech || {};
  const keeps = form.wireKeeps || {};

  const setTech = (id: string, val: WireTechValue) => {
    const next = { ...tech };
    if (next[id] === val) delete next[id];
    else next[id] = val;
    set('wireTech', next);
  };

  const setKeep = (id: string, val: boolean) => {
    const next = { ...keeps };
    if (id in next && next[id] === val) delete next[id];
    else next[id] = val;
    set('wireKeeps', next);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-2 border border-border bg-secondary/40 p-4">
        <Icon
          name="Info"
          size={16}
          className="mt-0.5 shrink-0 text-muted-foreground"
        />
        <p className="text-sm text-muted-foreground">
          Заполняется у проводок и рамок. Первый блок решает,{' '}
          <b>кому товар не показывать</b>. Второй — <b>что написать тому</b>,
          кому показали.
        </p>
      </div>

      {/* Комплект «рамка + проводка». Ставится у рамки: покупателю,
          выбравшему её, шаг с проводкой показывать нельзя — он купит
          вторую и вернётся с претензией */}
      <label className="flex cursor-pointer items-start gap-3 border border-border p-4 transition-colors hover:border-foreground">
        <input
          type="checkbox"
          checked={!!form.wireIncluded}
          onChange={(e) => set('wireIncluded', e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none accent-primary"
        />
        <span>
          <span className="font-head text-sm font-bold uppercase tracking-tight">
            Проводка уже в комплекте
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            Для рамок, которые продаются вместе с проводкой. При выборе
            такой рамки шаг «Подключение» пропускается — покупателю не
            предложат купить то, что у него уже есть в коробке.
          </span>
        </span>
      </label>

      <div>
        <div className="font-head text-sm font-bold uppercase tracking-tight">
          С чем работает
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Для каких машин эта проводка. «Неважно» — параметр не влияет на
          совместимость, покупателя об этом не спросим.
        </p>
        <div className="mt-4 space-y-2">
          {WIRE_TECH.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2"
            >
              <span className="text-sm">{t.label}</span>
              <div className="flex gap-1">
                {TECH_OPTS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setTech(t.id, o.id)}
                    className={`px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                      tech[t.id] === o.id
                        ? 'bg-foreground text-background'
                        : 'border border-border hover:border-foreground'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="font-head text-sm font-bold uppercase tracking-tight">
          Кузов
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Отмечайте, только если проводка встаёт не на все кузова. Ничего не
          отмечено — подходит любому. У машин кузова уже размечены, поэтому
          покупателя спросим сами и только когда это решает.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {BODY_TYPES.map((b) => {
            const on = (form.wireBodies || []).includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  const cur = form.wireBodies || [];
                  set(
                    'wireBodies',
                    on ? cur.filter((x) => x !== b.id) : [...cur, b.id],
                  );
                }}
                className={`px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                  on
                    ? 'bg-foreground text-background'
                    : 'border border-border hover:border-foreground'
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
        {(form.wireBodies || []).length === 0 && (
          <p className="mt-2 text-sm text-success">
            Сейчас: подходит на любой кузов
          </p>
        )}
      </div>

      <div>
        <div className="font-head text-sm font-bold uppercase tracking-tight">
          Сторона руля
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Отмечайте, только если товар подходит не всем. Ничего не выбрано —
          подходит и левому, и правому.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WHEEL_SIDES.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() =>
                set('wireWheel', form.wireWheel === w.id ? '' : w.id)
              }
              className={`px-4 py-2 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                form.wireWheel === w.id
                  ? 'bg-foreground text-background'
                  : 'border border-border hover:border-foreground'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        {!form.wireWheel && (
          <p className="mt-2 text-sm text-success">Сейчас: подходит любому</p>
        )}
      </div>

      <div>
        <div className="font-head text-sm font-bold uppercase tracking-tight">
          Что останется работать
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Что получит клиент после установки. Отсюда берётся пометка
          «сохраняет климат» на сайте.
        </p>

        <div className="mt-4">
          <span className={label}>Уровень совместимости</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {WIRE_LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() =>
                  set('wireLevel', form.wireLevel === l.id ? '' : (l.id as WireLevel))
                }
                className={`px-4 py-2 text-left transition-colors ${
                  form.wireLevel === l.id
                    ? 'bg-foreground text-background'
                    : 'border border-border hover:border-foreground'
                }`}
              >
                <span className="font-head text-[0.72rem] font-semibold uppercase tracking-[0.06em]">
                  {l.label}
                </span>
                <span
                  className={`block text-[0.7rem] ${
                    form.wireLevel === l.id
                      ? 'text-background/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  {l.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {WIRE_KEEPS.map((k) => (
            <div
              key={k.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2"
            >
              <span className="text-sm">{k.label}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setKeep(k.id, true)}
                  className={`px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    keeps[k.id] === true
                      ? 'bg-success text-success-foreground'
                      : 'border border-border hover:border-foreground'
                  }`}
                >
                  Сохраняет
                </button>
                <button
                  type="button"
                  onClick={() => setKeep(k.id, false)}
                  className={`px-3 py-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    keeps[k.id] === false
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border hover:border-foreground'
                  }`}
                >
                  Теряется
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>Описание совместимости</span>
        <p className="mb-2 text-sm text-muted-foreground">
          Этот текст увидит покупатель. Пишите по-человечески: «магнитола
          заработает, но климат с экрана пропадёт».
        </p>
        <textarea
          value={form.wireNote || ''}
          onChange={(e) => set('wireNote', e.target.value)}
          rows={3}
          maxLength={600}
          className={`${field} resize-y`}
          placeholder="CAN-интерфейс сохраняет штатное управление климатом и кнопки на руле."
        />
      </div>
    </div>
  );
};

export default ProductWiringTab;