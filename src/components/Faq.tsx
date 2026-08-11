import SectionHead from '@/components/SectionHead';
import Icon from '@/components/ui/icon';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCatalog } from '@/context/CatalogContext';



const Faq = () => {
  const { faq } = useCatalog();

  return (
  <section id="faq" className="section-pad anchor-offset">
    <div className="rule" />
    <SectionHead
      index="05"
      eyebrow="FAQ и гарантия"
      title="Частые вопросы"
      note="Если ответа нет — напишите, добавим сюда."
    />

    <div className="grid grid-cols-1 gap-x-6 pb-14 md:grid-cols-12">
      <div className="md:col-span-8">
        <Accordion type="single" collapsible className="w-full">
          {faq.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`i-${i}`}
              className="border-t border-foreground border-b-0"
            >
              <AccordionTrigger className="py-5 text-left font-head text-lg font-medium tracking-tight hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="max-w-[46em] pb-6 text-[0.95rem] leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <aside className="mt-10 border-t border-foreground pt-5 md:col-span-3 md:col-start-10 md:mt-0">
        <Icon name="BadgeCheck" size={24} className="text-primary" />
        <h3 className="mt-4 font-head text-xl font-medium tracking-tight">
          Гарантия коротко
        </h3>
        <ul className="mt-4 space-y-3 text-[0.9rem] text-muted-foreground">
          <li className="border-b border-border pb-3">
            <span className="text-foreground">2 года</span> на магнитолы и камеры
          </li>
          <li className="border-b border-border pb-3">
            <span className="text-foreground">1 год</span> на работы по установке
          </li>
          <li className="border-b border-border pb-3">
            <span className="text-foreground">14 дней</span> на возврат без следов монтажа
          </li>
        </ul>
      </aside>
    </div>
    </section>
  );
};

export default Faq;
