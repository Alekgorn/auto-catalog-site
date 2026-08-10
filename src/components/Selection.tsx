import SectionHead from '@/components/SectionHead';
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

const STEPS = [
  {
    n: '01',
    title: 'Марка и модель',
    text: 'Указываете машину — каталог сразу отсекает всё, что к ней не встаёт.',
  },
  {
    n: '02',
    title: 'Год выпуска',
    text: 'Внутри одной модели кузов меняется: год уточняет точки крепления.',
  },
  {
    n: '03',
    title: 'Список позиций',
    text: 'У каждой карточки отметка совместимости, тип разъёма и артикул.',
  },
];

const Selection = (selector: Props) => (
  <section id="select" className="section-pad anchor-offset bg-surface">
    <div className="rule" />
    <SectionHead
      index="02"
      eyebrow="Подбор по марке и модели"
      title="Три поля — и лишнего нет"
      note="Мы не показываем «универсальное». Каждая позиция привязана к конкретному штатному разъёму и рамке: если в списке нет — значит, к вашей машине без переходника это не встанет."
    />

    <div className="grid grid-cols-1 gap-x-6 gap-y-8 pb-12 md:grid-cols-12">
      {STEPS.map((s) => (
        <div key={s.n} className="border-t border-foreground pt-4 md:col-span-4">
          <div className="font-head text-[0.72rem] font-medium tracking-[0.16em] text-primary">
            {s.n}
          </div>
          <h3 className="mt-3 font-head text-xl font-medium tracking-tight">
            {s.title}
          </h3>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
            {s.text}
          </p>
        </div>
      ))}
    </div>

    <div className="rule" />
    <VehicleSelector {...selector} buttonLabel="Подобрать" idPrefix="sel2" />
    <div className="rule-hair" />
    <div className="h-6" />
  </section>
);

export default Selection;