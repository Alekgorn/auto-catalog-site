import Icon from '@/components/ui/icon';
import { SCENARIOS } from '@/data/scenarios';
import {
  ScenarioOverride,
  LOCKED_CATEGORIES,
  DEFAULT_SCENARIOS,
} from '@/lib/scenario-settings';

interface Props {
  value: ScenarioOverride[];
  onChange: (list: ScenarioOverride[]) => void;
  categories: string[];
}

const input =
  'w-full border-b border-border bg-transparent py-2 text-[0.9rem] outline-none transition-colors focus:border-primary';

/**
 * Карточки «С чем пришли» на главной.
 *
 * Правится то, что видит покупатель: заголовок, подпись, кнопка, иконка,
 * порядок и разделы каталога. Логика сборки комплекта остаётся в коде —
 * её нельзя вынести в поля, не превратив админку в среду разработки.
 *
 * Сценарий не удаляется, а скрывается: страница остаётся живой по своему
 * адресу, и ссылки на неё из переписки не превращаются в «не найдено».
 */
const ScenariosEditor = ({ value, onChange, categories }: Props) => {
  const list = value.length ? value : DEFAULT_SCENARIOS;

  const setAt = (i: number, patch: Partial<ScenarioOverride>) =>
    onChange(list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const toggleCategory = (i: number, name: string) => {
    const cur = list[i].categories ?? [];
    setAt(i, {
      categories: cur.includes(name)
        ? cur.filter((c) => c !== name)
        : [...cur, name],
    });
  };

  const shown = list.filter((s) => !s.hidden).length;

  return (
    <div>
      <div className="eyebrow">Главная страница</div>
      <h3 className="mt-3 font-head text-xl font-bold uppercase tracking-tight">
        Карточки «С чем пришли»
      </h3>
      <p className="mt-3 max-w-[46em] text-muted-foreground">
        Заголовки, подписи и порядок плиток на главной. Показывается{' '}
        {shown} из {list.length} — скрытые остаются доступными по прямой
        ссылке, но с главной уходят. Первой ставьте ту, на которой
        зарабатываете, даже если заходов больше на другую.
      </p>

      <div className="mt-6 space-y-5">
        {list.map((s, i) => {
          const base = SCENARIOS.find((x) => x.slug === s.slug);
          const locked = LOCKED_CATEGORIES.includes(s.slug);
          const picked = s.categories ?? [];

          return (
            <div
              key={s.slug}
              className={`border p-4 ${
                s.hidden ? 'border-dashed border-border opacity-60' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center bg-foreground text-background">
                  <Icon name={s.icon || base?.icon || 'LayoutGrid'} size={17} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                    {s.slug}
                  </div>
                  <input
                    value={s.title ?? ''}
                    placeholder={base?.title ?? 'Заголовок карточки'}
                    onChange={(e) => setAt(i, { title: e.target.value })}
                    className={`${input} font-head font-bold`}
                  />
                </div>

                <div className="flex flex-none gap-1">
                  <button
                    onClick={() => setAt(i, { hidden: !s.hidden })}
                    title={s.hidden ? 'Вернуть на главную' : 'Убрать с главной'}
                    className="border border-border p-2 transition-colors hover:border-primary"
                  >
                    <Icon name={s.hidden ? 'EyeOff' : 'Eye'} size={15} />
                  </button>
                  <button
                    onClick={() => move(i, -1)}
                    className="border border-border p-2 transition-colors hover:border-primary"
                    title="Выше"
                  >
                    <Icon name="ChevronUp" size={15} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className="border border-border p-2 transition-colors hover:border-primary"
                    title="Ниже"
                  >
                    <Icon name="ChevronDown" size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <span className="eyebrow">Подпись на карточке</span>
                <textarea
                  value={s.text ?? ''}
                  placeholder={base?.text ?? ''}
                  rows={2}
                  onChange={(e) => setAt(i, { text: e.target.value })}
                  className={`${input} resize-none`}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="eyebrow">Надпись на кнопке</span>
                  <input
                    value={s.cta ?? ''}
                    placeholder={base?.cta ?? 'Смотреть'}
                    onChange={(e) => setAt(i, { cta: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="eyebrow">Иконка</span>
                  <input
                    value={s.icon ?? ''}
                    placeholder={base?.icon ?? 'LayoutGrid'}
                    onChange={(e) => setAt(i, { icon: e.target.value })}
                    className={input}
                  />
                </label>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <span className="eyebrow">Разделы каталога</span>

                {locked ? (
                  /* Подбор магнитолы идёт по шагам: рамка ищется под
                     диагональ экрана, проводка — под ответы о камере.
                     Подмена разделов рвёт эту цепочку молча */
                  <p className="mt-2 flex items-start gap-2 text-[0.85rem] text-muted-foreground">
                    <Icon
                      name="Lock"
                      size={14}
                      className="mt-0.5 flex-none"
                    />
                    Здесь свой пошаговый подбор: рамка ищется под диагональ
                    магнитолы, проводка — под ответы о камере и усилителе.
                    Разделы заданы этой логикой и не меняются.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-[0.85rem] text-muted-foreground">
                      {picked.length
                        ? `Выбрано ${picked.length} — товары берутся только отсюда.`
                        : 'Ничего не выбрано — работает подбор по смыслу запроса.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map((c) => {
                        const on = picked.includes(c);
                        return (
                          <button
                            key={c}
                            onClick={() => toggleCategory(i, c)}
                            className={`border px-3 py-1.5 text-[0.8rem] transition-colors ${
                              on
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border text-muted-foreground hover:border-primary'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                    {picked.length > 0 && (
                      <button
                        onClick={() => setAt(i, { categories: [] })}
                        className="mt-3 text-[0.8rem] text-muted-foreground underline"
                      >
                        Сбросить выбор
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScenariosEditor;
