import { useState } from 'react';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import { formatPrice } from '@/data/catalog';

interface Props {
  onRequest: () => void;
}

const ROWS = [
  { group: 'Фаркопы', from: 14900, install: 4500, term: '1–2 дня' },
  { group: 'Багажные системы', from: 7600, install: 2500, term: 'в день обращения' },
  { group: 'Пороги и подножки', from: 15800, install: 3800, term: '1 день' },
  { group: 'Защита кузова и картера', from: 2600, install: 2000, term: 'в день обращения' },
  { group: 'Салон и багажник', from: 3900, install: 1200, term: 'в день обращения' },
  { group: 'Электроника', from: 4800, install: 3500, term: '1–2 дня' },
];

const PROMOS = [
  {
    title: 'Комплект «Дача»',
    old: 24100,
    now: 19900,
    text: 'Рейлинги + поперечины + брызговики. Ставим за один визит.',
    until: 'до 31 августа',
  },
  {
    title: 'Фаркоп + розетка',
    old: 19700,
    now: 16400,
    text: 'Съёмный шар и блок согласования с проводкой. Установка в цене.',
    until: 'до конца месяца',
  },
  {
    title: 'Защита картера −20%',
    old: 8100,
    now: 6700,
    text: 'Сталь 2 мм на штатные точки подрамника, крепёж в комплекте.',
    until: 'пока есть на складе',
  },
];

const Prices = ({ onRequest }: Props) => {
  const [tab, setTab] = useState<'price' | 'promo'>('price');

  return (
    <section id="prices" className="section-pad anchor-offset">
      <div className="rule" />
      <SectionHead
        index="03"
        eyebrow="Цены и акции"
        title="Стоимость без сюрпризов"
        note="В цене товар, крепёж и инструкция. Установка считается отдельно и не меняется после того, как машина уже в цеху."
      />

      <div className="flex gap-8 border-b border-border pb-4">
        {(
          [
            ['price', 'Прайс по группам'],
            ['promo', 'Действующие акции'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 pb-2 text-[0.8rem] uppercase tracking-[0.1em] transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'price' ? (
        <div className="animate-fade-in py-8">
          <div className="hidden grid-cols-12 gap-x-6 pb-3 text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground md:grid">
            <div className="col-span-5">Группа</div>
            <div className="col-span-2 text-right">Товар от</div>
            <div className="col-span-2 text-right">Установка от</div>
            <div className="col-span-3 text-right">Срок</div>
          </div>
          {ROWS.map((r) => (
            <div
              key={r.group}
              className="grid grid-cols-2 gap-x-6 gap-y-1 border-t border-border py-4 md:grid-cols-12"
            >
              <div className="col-span-2 font-head text-lg font-medium tracking-tight md:col-span-5">
                {r.group}
              </div>
              <div className="text-muted-foreground md:col-span-2 md:text-right">
                <span className="md:hidden">Товар от </span>
                <span className="text-foreground">{formatPrice(r.from)}</span>
              </div>
              <div className="text-right text-muted-foreground md:col-span-2">
                <span className="md:hidden">Установка от </span>
                <span className="text-foreground">{formatPrice(r.install)}</span>
              </div>
              <div className="col-span-2 text-[0.85rem] text-muted-foreground md:col-span-3 md:text-right">
                {r.term}
              </div>
            </div>
          ))}
          <div className="border-t border-foreground pt-4 text-[0.85rem] text-muted-foreground">
            Точная цена зависит от модели и года выпуска — она видна в карточке после
            подбора.
          </div>
        </div>
      ) : (
        <div className="grid animate-fade-in grid-cols-1 gap-x-6 gap-y-10 py-10 md:grid-cols-3">
          {PROMOS.map((p) => (
            <div key={p.title} className="flex flex-col border-t border-foreground pt-5">
              <div className="eyebrow text-primary">{p.until}</div>
              <h3 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-tight">
                {p.title}
              </h3>
              <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-muted-foreground">
                {p.text}
              </p>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-head text-3xl font-bold tracking-tight text-primary">
                  {formatPrice(p.now)}
                </span>
                <span className="text-muted-foreground line-through">
                  {formatPrice(p.old)}
                </span>
              </div>
              <button
                onClick={onRequest}
                className="mt-5 flex items-center justify-between border border-foreground px-5 py-4 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Забронировать цену
                <Icon name="ArrowRight" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Prices;
