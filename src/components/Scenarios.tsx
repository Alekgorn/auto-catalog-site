import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { SCENARIOS } from '@/data/scenarios';

/**
 * Сценарии использования — «живые» формулировки задач клиента.
 * Каждая плитка ведёт в поиск со своим запросом: подбор идёт по смыслу,
 * поэтому формулировки написаны так, как их говорит покупатель.
 */
const Scenarios = () => {
  const navigate = useNavigate();

  /** Открываем страницу сценария — там текст, подбор по машине и товары */
  const open = (slug: string) => navigate(`/scenario/${slug}`);

  return (
  <section id="scenarios" className="anchor-offset py-10 md:py-12">
    <div className="flex flex-col gap-2 pb-7 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 flex-none items-center justify-center bg-foreground text-[0.72rem] font-bold text-background">
            2
          </span>
          <span className="eyebrow">С чем пришли</span>
        </div>
        <h2 className="mt-2 font-head text-2xl font-bold uppercase leading-tight tracking-tight md:text-3xl">
          Выберите свою задачу
        </h2>
      </div>
      <p className="max-w-[28em] text-[0.88rem] leading-relaxed text-muted-foreground">
        Не разбираетесь в моделях и артикулах — не нужно. Скажите, что хотите
        получить, а подбор мы возьмём на себя.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {SCENARIOS.map((s) => (
        <button
          key={s.slug}
          type="button"
          onClick={() => open(s.slug)}
          className="group flex h-full flex-col border border-border bg-surface p-5 text-left transition-colors hover:border-primary"
        >
          <span className="flex h-16 w-16 flex-none items-center justify-center border border-border bg-background transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon name={s.icon} fallback="CircleAlert" size={32} />
          </span>

          <span className="mt-4 block font-head text-[1.02rem] font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
            «{s.title}»
          </span>

          <span className="mt-2 block flex-1 text-[0.85rem] leading-relaxed text-muted-foreground">
            {s.text}
          </span>

          <span className="mt-4 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground transition-colors group-hover:text-primary">
            Смотреть
            <Icon
              name="ArrowRight"
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </button>
      ))}
    </div>
  </section>
  );
};

export default Scenarios;