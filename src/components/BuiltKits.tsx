import { Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import { useCatalog } from '@/context/CatalogContext';

/*
 * В составе показываем не название товара и не полное имя раздела:
 * «Переходные рамки для магнитол» не влезает в подпись и обрывается
 * многоточием. Человеку тут важен сам факт «рамка есть», а подробности
 * он увидит, открыв комплект.
 */
const SHORT: [RegExp, string][] = [
  [/магнитол[аы]|головн/i, 'Магнитола'],
  [/рамк/i, 'Рамка'],
  [/переходник|жгут|проводк|разъем|разъём/i, 'Проводка'],
  [/камер/i, 'Камера'],
  [/регистратор/i, 'Регистратор'],
  [/парктрон/i, 'Парктроник'],
  [/шумоизол|виброизол/i, 'Шумоизоляция'],
  [/антенн/i, 'Антенна'],
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
 * Состав показан формулой из фотографий: магнитола + рамка + проводка =
 * цена. Списком названий комплект читается как перечень, а картинками —
 * сразу видно, что именно человек получит в коробке.
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

      <div className="space-y-4 pb-10">
        {cards.map((kit, i) => (
          <Link
            key={i}
            to={kit.href?.slice(kit.href.indexOf('/sborka')) || '#'}
            className="group block border border-border p-5 transition-colors hover:border-primary sm:p-6"
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div className="font-head text-lg font-bold uppercase tracking-tight">
                {kit.title}
              </div>
              {/* Пояснение продавца: из одних названий товаров не видно,
                  почему собрано именно так */}
              {kit.note && (
                <div className="text-[0.9rem] text-muted-foreground">
                  {kit.note}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-start gap-x-2 gap-y-4 sm:gap-x-3">
              {kit.items.map((p, idx) => (
                <Fragment key={p.id}>
                  {idx > 0 && (
                    <span className="self-center pt-2 font-head text-xl font-bold text-muted-foreground sm:text-2xl">
                      +
                    </span>
                  )}
                  <div className="w-[68px] sm:w-[104px]">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        loading="lazy"
                        className="aspect-square w-full border border-border bg-surface object-contain p-1"
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center border border-border bg-surface">
                        <Icon
                          name="Package"
                          size={22}
                          className="text-muted-foreground/40"
                        />
                      </div>
                    )}
                    <div className="mt-1.5 font-head text-[0.7rem] font-semibold uppercase tracking-[0.04em]">
                      {shortName(p.category)}
                    </div>
                    <div className="text-[0.75rem] text-muted-foreground">
                      {p.price.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </Fragment>
              ))}

              <span className="self-center pt-2 font-head text-xl font-bold text-muted-foreground sm:text-2xl">
                =
              </span>

              <div className="self-center pt-2">
                <div className="font-head text-2xl font-bold tracking-tight">
                  {kit.total.toLocaleString('ru-RU')} ₽
                </div>
                {/* Срок называем здесь, до оплаты. Неприятен не сам заказ
                    под поставку, а когда о нём узнают после платежа */}
                {kit.term && (
                  <div className="text-[0.8rem] text-muted-foreground">
                    {kit.term}
                  </div>
                )}
                <span className="mt-1 inline-flex items-center gap-2 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-primary">
                  Посмотреть комплект
                  <Icon
                    name="ArrowRight"
                    size={13}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
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
