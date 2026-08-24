import Icon from '@/components/ui/icon';
import { BODY_TYPES, BodyType } from '@/data/catalog';

interface Props {
  models: string[];
  /** Что уже проставлено: { "Rio": ["sedan", "hatchback"] } */
  bodies: Record<string, BodyType[]>;
  onChange: (next: Record<string, BodyType[]>) => void;
}

/**
 * Типы кузова у моделей одной марки.
 *
 * Модель может выпускаться в нескольких кузовах сразу — Rio бывает и седаном,
 * и хэтчбеком. Поэтому это набор отметок, а не выбор одного значения:
 * покупателю с Rio должны подойти комплекты и для седана, и для хэтчбека.
 */
const BrandBodiesEditor = ({ models, bodies, onChange }: Props) => {
  const toggle = (model: string, type: BodyType) => {
    const current = bodies[model] ?? [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    const out = { ...bodies };
    if (next.length) out[model] = next;
    else delete out[model];
    onChange(out);
  };

  /** Поставить всем незаполненным моделям один и тот же кузов */
  const fillEmpty = (type: BodyType) => {
    const out = { ...bodies };
    models.forEach((m) => {
      if (!out[m]?.length) out[m] = [type];
    });
    onChange(out);
  };

  const filled = models.filter((m) => bodies[m]?.length).length;

  if (!models.length) {
    return (
      <p className="text-[0.8rem] text-muted-foreground">
        Сначала добавьте модели этой марки.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="max-w-[40em] text-[0.8rem] leading-relaxed text-muted-foreground">
          Кузов нужен, чтобы подбирать товары под размер машины — например
          комплекты шумоизоляции. Если модель выпускалась в нескольких кузовах,
          отметьте все: покупателю подойдут материалы для каждого из них.
        </p>
        <span className="text-[0.78rem] text-muted-foreground">
          Заполнено {filled} из {models.length}
        </span>
      </div>

      {filled < models.length && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
            Пустым сразу
          </span>
          {BODY_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => fillEmpty(t.id)}
              className="border border-border px-2.5 py-1 text-[0.75rem] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {models.map((m) => {
          const on = bodies[m] ?? [];
          return (
            <div
              key={m}
              className="grid grid-cols-1 gap-2 border-t border-border pt-3 md:grid-cols-12 md:items-baseline"
            >
              <div className="flex items-center gap-2 md:col-span-3">
                {!on.length && (
                  <Icon
                    name="CircleAlert"
                    size={14}
                    className="shrink-0 text-primary"
                  />
                )}
                <span className="text-[0.9rem] font-medium">{m}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 md:col-span-9">
                {BODY_TYPES.map((t) => {
                  const active = on.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(m, t.id)}
                      className={`border px-2.5 py-1 text-[0.78rem] transition-colors ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrandBodiesEditor;
