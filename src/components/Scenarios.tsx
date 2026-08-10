import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

/**
 * Сценарии использования — «живые» формулировки задач клиента.
 * Каждая плитка ведёт в поиск со своим запросом: подбор идёт по смыслу,
 * поэтому формулировки написаны так, как их говорит покупатель.
 */
const SCENARIOS: {
  icon: string;
  title: string;
  text: string;
  /** Запрос, который уйдёт в умный поиск */
  query: string;
}[] = [
  {
    icon: 'MonitorSmartphone',
    title: 'Хочу экран, но денег в обрез',
    text: 'Недорогая магнитола с экраном — без лишних наворотов, но всё работает.',
      query: 'недорогая магнитола с экраном подешевле',
  },
  {
    icon: 'Sparkles',
    title: 'Хочу экран, как в Тесле',
    text: 'Премиум-магнитола с большим QLED-экраном, DSP и кучей функций.',
      query: 'премиум магнитола большой экран DSP',
  },
  {
    icon: 'ParkingCircle',
    title: 'Боюсь задеть бордюр',
    text: 'Камера заднего и переднего вида, парктроники — чтобы парковаться без нервов.',
      query: 'камера заднего вида и парктроники',
  },
  {
    icon: 'ScanEye',
    title: 'Хочу видеть машину сверху',
    text: 'Система 360° — полный контроль вокруг авто.',
      query: 'камера кругового обзора 360',
  },
  {
    icon: 'Wrench',
    title: 'Штатная магнитола сломалась, хочу починить',
    text: 'Восстановим проводку — и всё заработает как новое.',
      query: 'штатный разъем восстановление проводки',
  },
  {
    icon: 'Video',
    title: 'Хочу записывать всё на дороге',
    text: 'Видеорегистратор — чтобы каждый момент был под защитой.',
      query: 'видеорегистратор',
  },
  {
    icon: 'VolumeX',
    title: 'Надоел шум в салоне',
    text: 'Шумоизоляция дверей, арок и пола — станет тише, чем в библиотеке.',
      query: 'шумоизоляция дверей арок и пола',
  },
  {
    icon: 'LayoutGrid',
    title: 'Вот пристали, покажите всё по моей машине',
    text: 'Ничего не скрывая — покажем всё, что подходит.',
      query: 'все оборудование',
  },
];

const Scenarios = () => {
  const navigate = useNavigate();

  const open = (query: string) =>
    navigate(`/search?q=${encodeURIComponent(query)}`);

  return (
  <section id="scenarios" className="anchor-offset py-10 md:py-12">
    <div className="flex flex-col gap-2 pb-7 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="eyebrow">С чем пришли</div>
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
          key={s.title}
          type="button"
          onClick={() => open(s.query)}
          className="group flex h-full flex-col border border-border bg-surface p-5 text-left transition-colors hover:border-primary"
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center border border-border bg-background transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon name={s.icon} fallback="CircleAlert" size={21} />
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