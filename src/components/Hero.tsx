import Icon from '@/components/ui/icon';
import MountPlan from '@/components/MountPlan';
import VehicleSelector from '@/components/VehicleSelector';
import Scenarios from '@/components/Scenarios';
import { useCatalog } from '@/context/CatalogContext';

/** Открывает каталог с отмеченной категорией. Пустая — весь каталог */
const goToCategory = (category: string) => {
  window.dispatchEvent(
    new CustomEvent('catalog:filter-category', { detail: category }),
  );
  document
    .getElementById('catalog')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

interface Props {
  brand: string;
  model: string;
  year: string;
  onBrand: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onSubmit: () => void;
}

const Hero = (props: Props) => {
  const { shortcuts, shortcutsHidden } = useCatalog();

  return (
  <section className="section-pad flex flex-col">
    <div className="rule" />

    <div className="grid grid-cols-1 items-center gap-x-6 md:grid-cols-12">
      <div className="flex min-h-0 flex-col pb-6 pt-8 md:col-span-6 md:pb-8 md:pr-8">
        <div className="eyebrow rise ml-0 md:ml-4" style={{ animationDelay: '.05s' }}>
          Автоэлектроника для вашей машины
        </div>
        <h1
          className="rise ml-0 mt-4 font-head text-[11vw] font-bold uppercase leading-[1.04] tracking-[-0.035em] sm:text-5xl md:ml-3 lg:text-[58px]"
          style={{ animationDelay: '.15s' }}
        >
          Всё для
          <br />
          <span className="text-primary">вашего</span>
          <br />
          автомобиля
        </h1>
        <p
          className="rise ml-0 mt-5 max-w-[26em] leading-relaxed text-muted-foreground md:ml-4"
          style={{ animationDelay: '.25s' }}
        >
          Автоэлектроника, аксессуары и оборудование{' '}
          <b className="font-medium text-foreground">с подбором по модели</b>.
        </p>

        {!shortcutsHidden && shortcuts.length > 0 && (
        <div
          className="rise ml-0 mt-7 flex flex-wrap gap-2 md:ml-4"
          style={{ animationDelay: '.35s' }}
        >
          {shortcuts.map((s, i) => (
            <button
              key={`${s.label}-${i}`}
              onClick={() => goToCategory(s.category)}
              className={`flex items-center gap-2 border px-3.5 py-2.5 text-[0.78rem] transition-colors ${
                s.category
                  ? 'border-border bg-surface hover:border-primary hover:text-primary'
                  : 'border-foreground bg-foreground text-background hover:border-primary hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {/^(https?:)?\//.test(s.icon) ? (
                <img src={s.icon} alt="" className="h-4 w-4 flex-none object-contain" />
              ) : (
                <Icon name={s.icon} size={16} className="flex-none" />
              )}
              {s.label}
            </button>
          ))}
        </div>
        )}
      </div>

      <div className="relative flex h-[240px] flex-col py-4 md:col-span-6 md:h-[320px] md:py-6 md:pl-4">
        <MountPlan />
      </div>
    </div>

    <div className="rule" />

    <VehicleSelector {...props} />

    <div className="rule-hair" />

    <Scenarios />

    <div className="rule-hair" />

    <div className="grid grid-cols-1 gap-x-6 py-4 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground md:grid-cols-12">
      <div className="md:col-span-6">
        Розница и&nbsp;опт · отправка со&nbsp;склада в&nbsp;день заказа
      </div>
      <div className="md:col-span-6 md:text-right">
        Переходники и&nbsp;схема подключения в&nbsp;комплекте
      </div>
    </div>
  </section>
  );
};

export default Hero;