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

const Selection = (selector: Props) => (
  <section id="select" className="section-pad anchor-offset bg-surface">
    <div className="rule" />
    <SectionHead
      index="03"
      eyebrow="Подбор по марке и модели"
      title="Три поля — и лишнего нет"
      note="Мы не показываем «универсальное». Каждая позиция привязана к конкретному штатному разъёму и рамке: если в списке нет — значит, к вашей машине без переходника это не встанет."
    />

    <div className="rule" />
    <VehicleSelector {...selector} buttonLabel="Подобрать" idPrefix="sel2" />
    <div className="rule-hair" />
    <div className="h-6" />
  </section>
);

export default Selection;