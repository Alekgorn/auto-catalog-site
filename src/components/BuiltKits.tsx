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
              {/* «Магнитола на» + «Toyota FJ Cruiser 2013» — одной строкой.
                  Отдельной подписью это читалось так, будто собрали саму
                  машину, а не комплект для неё */}
              <div className="font-head text-xl font-bold uppercase tracking-tight">
                {[kit.kitName, kit.title].filter(Boolean).join(' ')}
              </div>
              {/* Пояснение продавца: из одних названий товаров не видно,
                  почему собрано именно так */}
              {kit.note && (
                <div className="text-[0.9rem] text-muted-foreground">
                  {kit.note}
                </div>
              )}
            </div>

            {/* Компьютер: формула из полноразмерных плиток — как в
                каталоге, с названием товара. Три позиции и цена занимают
                строку целиком, фото читается без прищуривания */}
            <div className="mt-5 hidden items-stretch gap-x-3 lg:flex">
              {kit.items.map((p, idx) => (
                <Fragment key={p.id}>
                  {idx > 0 && (
                    <span className="flex w-7 flex-none items-center justify-center self-center font-head text-4xl font-bold leading-none text-foreground xl:w-9 xl:text-5xl">
                      +
                    </span>
                  )}
                  <div className="min-w-0 flex-1 border border-border p-3 [max-width:248px]">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        loading="lazy"
                        className="aspect-square w-full bg-surface object-contain p-2"
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-surface">
                        <Icon
                          name="Package"
                          size={34}
                          className="text-muted-foreground/40"
                        />
                      </div>
                    )}
                    <div className="mt-3 font-head text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-primary">
                      {shortName(p.category)}
                    </div>
                    <h3 className="mt-1.5 line-clamp-2 font-head text-[0.95rem] font-bold leading-snug tracking-tight">
                      {p.name}
                    </h3>
                    <div className="mt-2 font-head text-[1.05rem] font-bold">
                      {p.price.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </Fragment>
              ))}

              <span className="flex w-7 flex-none items-center justify-center self-center font-head text-4xl font-bold leading-none text-foreground xl:w-9 xl:text-5xl">
                =
              </span>

              {/* Цена не сжимается и не переносится: перенос строки под
                  плитки выглядел обрывом формулы на полуслове */}
              <div className="w-[210px] flex-none self-center">
                <div className="font-head text-3xl font-bold tracking-tight xl:text-4xl">
                  {kit.total.toLocaleString('ru-RU')} ₽
                </div>
                {kit.term && (
                  <div className="mt-1 text-[0.85rem] text-muted-foreground">
                    {kit.term}
                  </div>
                )}
                <span className="mt-2 inline-flex items-center gap-2 whitespace-nowrap font-head text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-primary">
                  Посмотреть комплект
                  <Icon
                    name="ArrowRight"
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </div>
            </div>

            {/* Телефон: формула из трёх плиток растянулась бы на несколько
                экранов. Одно фото и список — то же содержание, но читается
                одним взглядом */}
            <div className="mt-4 flex gap-4 lg:hidden">
              {kit.items[0]?.images?.[0] ? (
                <img
                  src={kit.items[0].images[0]}
                  alt={kit.title}
                  loading="lazy"
                  className="aspect-square w-[112px] flex-none border border-border bg-surface object-contain p-2"
                />
              ) : (
                <div className="flex aspect-square w-[112px] flex-none items-center justify-center border border-border bg-surface">
                  <Icon
                    name="Package"
                    size={24}
                    className="text-muted-foreground/40"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <ul className="space-y-1">
                  {kit.items.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-baseline justify-between gap-3 text-[0.85rem]"
                    >
                      <span className="text-muted-foreground">
                        {shortName(p.category)}
                      </span>
                      <span className="flex-none">
                        {p.price.toLocaleString('ru-RU')} ₽
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-2">
                  <span className="font-head text-[0.8rem] font-bold uppercase tracking-tight">
                    Итого
                  </span>
                  <span className="font-head text-xl font-bold tracking-tight">
                    {kit.total.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                {kit.term && (
                  <div className="mt-1 text-[0.8rem] text-muted-foreground">
                    {kit.term}
                  </div>
                )}
                <span className="mt-2 inline-flex items-center gap-2 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-primary">
                  Посмотреть комплект
                  <Icon name="ArrowRight" size={13} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="pb-12">
        <Link
          to="/catalog"
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
