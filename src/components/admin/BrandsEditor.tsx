import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { compareNames } from '@/lib/slug';
import { BODY_TYPES, BodyType } from '@/data/catalog';

export interface AdminBrand {
  name: string;
  models: string[];
  /** Тип кузова каждой модели: { "Rio": ["sedan", "hatchback"] } */
  modelBodies?: Record<string, BodyType[]>;
}

interface Props {
  brands: AdminBrand[];
  onSave: (brands: AdminBrand[]) => void;
}

const BrandsEditor = ({ brands, onSave }: Props) => {
  const [list, setList] = useState<AdminBrand[]>(brands);
  /** Какая марка раскрыта на кузовах — открыт всегда один список */
  const [openBodies, setOpenBodies] = useState<number | null>(null);
  /** У какой марки раскрыт список кузовов */
  /** У какой марки раскрыт подбор проводки */

  useEffect(() => {
    setList(brands);
  }, [brands]);

  const update = (i: number, next: AdminBrand) =>
    setList((l) => l.map((b, idx) => (idx === i ? next : b)));

  /** Сколько моделей марки уже с кузовом — счётчик у кнопки */
  const bodiesCount = (b: AdminBrand) =>
    Object.values(b.modelBodies ?? {}).filter((v) => v?.length).length;

  /* Кузов модели: щёлкнули по типу — включили или выключили. Пустой
     список убираем целиком, чтобы в справочнике не копился мусор */
  const toggleBody = (idx: number, model: string, kind: BodyType) =>
    setList((l) =>
      l.map((b, i) => {
        if (i !== idx) return b;
        const now = b.modelBodies?.[model] ?? [];
        const next = now.includes(kind)
          ? now.filter((x) => x !== kind)
          : [...now, kind];
        const bodies = { ...(b.modelBodies ?? {}) };
        if (next.length) bodies[model] = next;
        else delete bodies[model];
        return { ...b, modelBodies: bodies };
      }),
    );

  return (
    <div className="py-6">
      {/* Своя выгрузка в Excel отсюда убрана: она дублировала общий
          импорт-экспорт в «Настройках», который выгружает и марки, и
          модели, и товары одним файлом. Две кнопки с разными файлами на
          одну задачу — прямой путь загрузить не тот файл и затереть
          список марок целиком. */}
      <p className="max-w-[40em] py-2 text-muted-foreground">
        Марки и модели используются в подборе на сайте и при отметке
        совместимости товаров. Модели указывайте через запятую. Загрузить
        списком из Excel можно в «Настройках» — там же, где выгрузка всего
        каталога.
      </p>

      <div className="mt-8 border-t border-foreground">
        {list.map((b, i) => (
          <div key={i} className="grid grid-cols-1 gap-4 border-b border-border py-5 md:grid-cols-12">
            <div className="md:col-span-3">
              <span className="eyebrow mb-1 block">Марка</span>
              <input
                value={b.name}
                onChange={(e) => update(i, { ...b, name: e.target.value })}
                className="w-full border-b border-border bg-transparent py-2 font-head text-lg font-medium outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="md:col-span-8">
              <span className="eyebrow mb-1 block">Модели</span>
              <input
                value={b.models.join(', ')}
                onChange={(e) =>
                  update(i, {
                    ...b,
                    models: e.target.value.split(',').map((m) => m.trim()),
                  })
                }
                className="w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <button
                onClick={() => setList((l) => l.filter((_, idx) => idx !== i))}
                aria-label="Удалить марку"
                className="pb-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="Trash2" size={18} />
              </button>
            </div>

            {/* Кузова моделей. Нужны там, где от кузова зависит панель:
                у Civic до 2011 хэтчбек и седан — это разные разъёмы, и
                подбор обязан спросить об этом покупателя */}
            <div className="md:col-span-12">
              <button
                onClick={() => setOpenBodies(openBodies === i ? null : i)}
                className="mt-1 flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon
                  name={openBodies === i ? 'ChevronDown' : 'ChevronRight'}
                  size={13}
                />
                Кузова моделей
                {bodiesCount(b) > 0 && (
                  <span className="text-success">· {bodiesCount(b)}</span>
                )}
              </button>

              {openBodies === i && (
                <div className="mt-3 border-l-2 border-border pl-4">
                  {b.models.filter(Boolean).length === 0 ? (
                    <p className="text-[0.82rem] text-muted-foreground">
                      Сначала добавьте модели этой марки.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {b.models.filter(Boolean).map((m) => (
                        <div
                          key={m}
                          className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
                        >
                          <span className="min-w-[9rem] text-[0.85rem]">
                            {m}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {BODY_TYPES.map((t) => {
                              const on = (b.modelBodies?.[m] ?? []).includes(
                                t.id,
                              );
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => toggleBody(i, m, t.id)}
                                  className={`border px-2.5 py-1 text-[0.72rem] transition-colors ${
                                    on
                                      ? 'border-foreground bg-foreground text-background'
                                      : 'border-border text-muted-foreground hover:border-foreground'
                                  }`}
                                >
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <p className="pt-1 text-[0.75rem] text-muted-foreground">
                        Ничего не отмечено — подбор считает, что кузов не
                        важен, и вопрос о нём не задаёт.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() =>
            setList((l) =>
              [...l]
                .sort((a, b) => compareNames(a.name, b.name))
                .map((b) => ({
                  ...b,
                  models: [...b.models].sort(compareNames),
                })),
            )
          }
          title="Расставить марки и модели по алфавиту"
          className="flex items-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="ArrowDownAZ" fallback="ArrowDown" size={16} />
          По алфавиту
        </button>
        <button
          onClick={() => setList((l) => [...l, { name: '', models: [] }])}
          className="flex items-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Plus" size={16} />
          Добавить марку
        </button>
        <button
          onClick={() =>
            onSave(
              // Сохраняем сразу по алфавиту — так работает прокрутка по буквам
              list
                .filter((b) => b.name.trim())
                .map((b) => {
                  const models = b.models
                    .map((m) => m.trim())
                    .filter(Boolean)
                    .sort(compareNames);
                  // Кузова держим только у оставшихся моделей: иначе после
                  // удаления модели в справочнике копился мусор
                  const bodies: Record<string, BodyType[]> = {};
                  models.forEach((m) => {
                    const kinds = b.modelBodies?.[m];
                    if (kinds?.length) bodies[m] = kinds;
                  });
                  return { name: b.name.trim(), models, modelBodies: bodies };
                })
                .sort((a, b) => compareNames(a.name, b.name)),
            )
          }
          className="flex items-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Icon name="Check" size={16} />
          Сохранить марки
        </button>
      </div>
    </div>
  );
};

export default BrandsEditor;