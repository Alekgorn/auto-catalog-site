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
  <section className="section-pad flex min-h-[min(calc(100vh-76px),900px)] flex-col">
    <div className="rule" />

    <div className="grid flex-1 grid-cols-1 gap-x-6 md:grid-cols-12 md:grid-rules">
      <div className="flex min-h-0 flex-col pb-10 pt-10 md:col-span-7 md:pb-0 md:pr-8 md:pt-14">
        <div className="eyebrow rise ml-0 md:ml-4" style={{ animationDelay: '.05s' }}>
          Дополнительное оборудование
        </div>
        <h1
          className="rise ml-0 mt-5 font-head text-[13vw] font-bold uppercase leading-[1.04] tracking-[-0.035em] sm:text-6xl md:ml-3 lg:text-[72px]"
          style={{ animationDelay: '.15s' }}
        >
          Каталог
          <br />
          по вашей
          <br />
          <span className="text-primary">модели</span>
        </h1>
        <p
          className="rise ml-0 mt-6 max-w-[24em] text-[1.06em] leading-relaxed text-muted-foreground md:ml-4 md:max-w-[20em]"
          style={{ animationDelay: '.25s' }}
        >
          Фаркопы, багажники, пороги, защита картера. Укажите&nbsp;машину — в&nbsp;списке
          останется только&nbsp;то, что&nbsp;встаёт на&nbsp;
          <b className="font-medium text-foreground">штатные точки крепления</b>.
        </p>
      </div>

      <div className="relative flex h-[420px] flex-col pb-16 pl-0 pt-6 md:col-span-5 md:h-[560px] md:pb-20 md:pl-5 md:pt-8">
        <MountPlan />
        <p className="absolute bottom-3 left-0 max-w-[17em] text-[0.78rem] leading-snug text-muted-foreground md:left-5">
          Красным — штатные точки. Кузов не&nbsp;сверлим, заводскую гарантию
          не&nbsp;трогаем.
        </p>
      </div>
    </div>

    <div className="rule" />

    <VehicleSelector {...props} />

    <div className="rule-hair" />

    <div className="grid grid-cols-1 gap-x-6 py-4 text-[0.72rem] uppercase tracking-[0.12em] text-muted-foreground md:grid-cols-12">
      <div className="md:col-span-6">
        Розница · отправка со&nbsp;склада в&nbsp;день заказа
      </div>
      <div className="md:col-span-6 md:text-right">
        Крепёж и&nbsp;инструкция в&nbsp;комплекте
      </div>
    </div>
  </section>
);

export default Hero;