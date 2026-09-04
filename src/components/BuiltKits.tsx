import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import { useCatalog } from '@/context/CatalogContext';

/*
 * В составе показываем не название товара и не полное имя раздела:
 * «Переходные рамки для магнитол» не влезает в карточку и обрывается
 * многоточием. Человеку тут важен сам факт «рамка есть», а подробности
 * он увидит, открыв комплект.
 */
const SHORT: [RegExp, string][] = [
  [/магнитол[аы]|головн/i, 'Магнитола'],
  [/рамк/i, 'Рамка'],
  [/переходник|жгут|проводк|разъем|разъём/i, 'Проводка'],
  [/камер/i, 'Камера'],
  [/регистратор/i, 'Видеорегистратор'],
  [/парктрон/i, 'Парктроник'],
  [/шумоизол|виброизол/i, 'Шумоизоляция'],
  [/антенн/i, 'Антенный переходник'],
];

const shortName = (category: string): string => {
  const hit = SHORT.find(([re]) => re.test(category));
  return hit ? hit[1] : category;
};

/**
 * Витрина «Что мы уже собрали».
 *
 * Отвечает на вопрос, который у человека в голове на самом деле: не
 * «сколько стоит», а «разберётесь ли вы с моей машиной». Поэтому здесь
 * не новинки склада, а решённые задачи — включая простые, из пары
 * позиций: по ним посетитель за рамкой узнаёт свой случай.
 *
 * Цены считаем по каталогу на лету. Хранить их в карточке значило бы
 * однажды показать вчерашнюю стоимость и разбираться с этим при заказе.
 */
const BuiltKits = () => {
  const { showcase, products } = useCatalog();

  const cards = useMemo(() => {
    const byId: Record<string, (typeof products)[number]> = {};
    products.forEach((p) => (byId[p.id] = p));

    return showcase
      .map((kit) => {
        const items = kit.ids.map((id) => byId[id]).filter(Boolean);
        return {
          ...kit,
          items,
          total: items.reduce((s, p) => s + (p.price || 0), 0),
          image: kit.image || items[0]?.images?.[0] || '',
        };
      })
      /* Карточка без состава — недоделанная: цена собралась бы нулевой */
      .filter((k) => k.items.length > 0 && k.title.trim());
  }, [showcase, products]);

  if (!cards.length) return null;

  return (
    <section id="kits" className="section-pad anchor-offset">
      <div className="rule" />
      <SectionHead
        index="03"
        eyebrow="Наши работы"
        title="Что мы уже собрали"
        note="Комплекты, которые мы подобрали для клиентов. Нажмите на любой — увидите точный состав с ценами и сможете поменять его под свою машину."
      />

      <div className="grid grid-cols-1 gap-5 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((kit, i) => (
          <Link
            key={i}
            to={kit.href?.slice(kit.href.indexOf('/sborka')) || '#'}
            className="group flex flex-col border border-border transition-colors hover:border-primary"
          >
            {kit.image ? (
              <img
                src={kit.image}
                alt={kit.title}
                loading="lazy"
                className="aspect-[4/3] w-full bg-surface object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface">
                <Icon
                  name="Car"
                  size={40}
                  className="text-muted-foreground/40"
                />
              </div>
            )}

            <div className="flex flex-1 flex-col p-5">
              <div className="font-head text-lg font-bold uppercase tracking-tight">
                {kit.title}
              </div>

              <ul className="mt-3 flex-1 space-y-1.5">
                {kit.items.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start gap-2 text-[0.85rem] leading-snug text-muted-foreground"
                  >
                    <Icon
                      name="Check"
                      size={14}
                      className="mt-0.5 flex-none text-primary"
                    />
                    <span className="line-clamp-1">
                      {shortName(p.category)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 font-head text-xl font-bold tracking-tight">
                {kit.total.toLocaleString('ru-RU')} ₽
              </div>

              {/* Срок называем здесь, до оплаты. Неприятен не сам заказ
                  под поставку, а когда о нём узнают после платежа */}
              {kit.term && (
                <div className="mt-1 text-[0.8rem] text-muted-foreground">
                  {kit.term}
                </div>
              )}

              <span className="mt-4 inline-flex items-center gap-2 font-head text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-primary">
                Посмотреть комплект
                <Icon
                  name="ArrowRight"
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="pb-12">
        <Link
          to="/scenario/vse-po-mashine"
          className="inline-flex items-center gap-2 border border-foreground px-6 py-4 font-head text-[0.85rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          Подобрать на свою машину
          <Icon name="ArrowRight" size={16} />
        </Link>
      </div>
    </section>
  );
};

export default BuiltKits;
