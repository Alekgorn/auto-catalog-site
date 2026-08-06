import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';

const INSTALL = [
  {
    icon: 'Wrench',
    title: 'Свой цех',
    text: 'Два поста, подъёмник, штатный крепёж. Записываем на конкретное время, машина не стоит в очереди.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Без сверления кузова',
    text: 'Ставим только на заводские точки. Заводская гарантия автомобиля остаётся в силе.',
  },
  {
    icon: 'Clock',
    title: 'От 20 минут до 4 часов',
    text: 'Срок указан в карточке каждой позиции — вы знаете его до записи, а не после.',
  },
];

const DELIVERY = [
  {
    icon: 'Package',
    title: 'Самовывоз',
    text: 'Со склада в день заказа, если позиция в наличии.',
    price: 'бесплатно',
  },
  {
    icon: 'Truck',
    title: 'Курьер по городу',
    text: 'На следующий день, интервал 3 часа.',
    price: 'от 400 ₽',
  },
  {
    icon: 'MapPin',
    title: 'Транспортная по России',
    text: 'СДЭК, Деловые линии, Почта. Габарит считаем при оформлении.',
    price: 'от 900 ₽',
  },
];

const Install = () => (
  <section id="install" className="section-pad anchor-offset bg-surface">
    <div className="rule" />
    <SectionHead
      index="04"
      eyebrow="Установка и доставка"
      title="Поставим или отправим"
      note="Можно забрать коробку с крепежом и инструкцией и собрать самому, а можно приехать к нам — тогда ответственность за посадку на штатные точки на нас."
    />

    <div className="grid grid-cols-1 gap-x-6 gap-y-8 pb-12 md:grid-cols-12">
      {INSTALL.map((i) => (
        <div key={i.title} className="border-t border-foreground pt-5 md:col-span-4">
          <Icon name={i.icon} size={22} className="text-primary" />
          <h3 className="mt-4 font-head text-xl font-medium tracking-tight">{i.title}</h3>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted-foreground">
            {i.text}
          </p>
        </div>
      ))}
    </div>

    <div className="rule-hair" />

    <div className="grid grid-cols-1 gap-x-6 gap-y-0 py-8 md:grid-cols-12">
      <div className="md:col-span-3">
        <div className="eyebrow">Доставка</div>
      </div>
      <div className="md:col-span-9">
        {DELIVERY.map((d) => (
          <div
            key={d.title}
            className="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-border py-5 md:grid-cols-9 md:items-baseline"
          >
            <div className="flex items-center gap-3 md:col-span-3">
              <Icon name={d.icon} size={18} className="text-primary" />
              <span className="font-head text-lg font-medium tracking-tight">
                {d.title}
              </span>
            </div>
            <p className="text-[0.92rem] text-muted-foreground md:col-span-4">{d.text}</p>
            <div className="font-head text-lg font-medium tracking-tight md:col-span-2 md:text-right">
              {d.price}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="h-6" />
  </section>
);

export default Install;
