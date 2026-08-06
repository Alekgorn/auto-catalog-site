import MountPlan from '@/components/MountPlan';
import VehicleSelector from '@/components/VehicleSelector';

interface Props {
  brand: string;
  model: string;
  year: string;
  onBrand: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onSubmit: () => void;
}

const Hero = (props: Props) => (
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
          Магнитолы
          <br />
          и камеры
          <br />
          <span className="text-primary">под вашу</span> модель
        </h1>
        <p
          className="rise ml-0 mt-5 max-w-[26em] leading-relaxed text-muted-foreground md:ml-4"
          style={{ animationDelay: '.25s' }}
        >
          Android-магнитолы, переходники и рамки, камеры заднего вида. Укажите
          машину — останется только то, что встаёт{' '}
          <b className="font-medium text-foreground">в штатные разъёмы</b>.
        </p>
      </div>

      <div className="relative flex h-[240px] flex-col py-4 md:col-span-6 md:h-[320px] md:py-6 md:pl-4">
        <MountPlan />
      </div>
    </div>

    <div className="rule" />

    <VehicleSelector {...props} />

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

export default Hero;