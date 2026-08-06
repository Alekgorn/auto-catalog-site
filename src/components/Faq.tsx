import SectionHead from '@/components/SectionHead';
import Icon from '@/components/ui/icon';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ITEMS = [
  {
    q: 'Что будет с заводской гарантией на автомобиль?',
    a: 'Останется. Штатную проводку не режем: подключение идёт через переходной жгут в заводскую фишку и CAN-адаптер. Всё обратимо — при желании возвращается к стоку за полчаса.',
  },
  {
    q: 'В каталоге нет моей модели — что делать?',
    a: 'Оставьте заявку с маркой, моделью и годом. Часть позиций мы возим под заказ: срок 3–10 дней. Если под вашу машину заводского решения нет, честно скажем об этом, а не предложим «универсальное».',
  },
  {
    q: 'Какая гарантия на само оборудование?',
    a: 'От 1 года на расходные материалы до 2 лет на магнитолы, камеры и регистраторы. Срок указан в карточке каждой позиции.',
  },
  {
    q: 'Можно поставить самому?',
    a: 'Да, большинство позиций ставятся без пайки. В комплекте идут переходной жгут, рамка и схема подключения по цветам — остаётся снять панель и состыковать разъёмы.',
  },
  {
    q: 'Сохранятся ли кнопки на руле?',
    a: 'Да, если в комплекте или отдельно взят CAN-адаптер под вашу модель. Он же передаёт скорость, заднюю передачу и данные штатных парктроников на магнитолу.',
  },
  {
    q: 'Как оформить возврат?',
    a: 'Товар без следов монтажа принимаем обратно в течение 14 дней. Если позиция не подошла по нашей ошибке в подборе — обмен и доставку берём на себя.',
  },
  {
    q: 'Работаете с установщиками и СТО?',
    a: 'Да. Для сервисов и частных установщиков есть оптовые цены, расходка со склада, схемы подключения по моделям и документы для юрлица. Напишите — пришлём прайс.',
  },
];

const Faq = () => (
  <section id="faq" className="section-pad anchor-offset">
    <div className="rule" />
    <SectionHead
      index="03"
      eyebrow="FAQ и гарантия"
      title="Частые вопросы"
      note="Если ответа нет — напишите, добавим сюда."
    />

    <div className="grid grid-cols-1 gap-x-6 pb-14 md:grid-cols-12">
      <div className="md:col-span-8">
        <Accordion type="single" collapsible className="w-full">
          {ITEMS.map((item, i) => (
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

export default Faq;