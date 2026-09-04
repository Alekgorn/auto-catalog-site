import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useCatalog } from '@/context/CatalogContext';

/**
 * «Уже ставили на такую машину» — витрина, показанная в карточке товара.
 *
 * На главной витрина отвечает «разберётесь ли вы вообще». Здесь вопрос
 * острее и конкретнее: человек держит в руках одну позицию и не знает,
 * что к ней нужно докупить. Готовый комплект отвечает на это без единого
 * продающего слова — и заодно поднимает чек с рамки до полного набора.
 *
 * Показываем только комплекты, где есть ровно этот товар: «похожие»
 * подборки здесь были бы обманом.
 */
const ProductKits = ({ id }: { id: string }) => {
  const { showcase, products } = useCatalog();

  const kits = useMemo(() => {
    const byId: Record<string, (typeof products)[number]> = {};
    products.forEach((p) => (byId[p.id] = p));

    return showcase
      .filter((k) => k.ids.includes(id) && k.title.trim())
      .map((kit) => {
        const items = kit.ids.map((x) => byId[x]).filter(Boolean);
        return {
          ...kit,
          items,
          total: items.reduce((s, p) => s + (p.price || 0), 0),
        };
      })
      /* Комплект из одной позиции — это и есть открытый товар, показывать
         его как «решение» бессмысленно */
      .filter((k) => k.items.length > 1)
      .slice(0, 3);
  }, [showcase, products, id]);

  if (!kits.length) return null;

  return (
    <section className="section-pad">
      <div className="rule" />
      <div className="py-10">
        <div className="eyebrow">Наши работы</div>
        <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em] sm:text-3xl">
          Уже ставили на такую машину
        </h2>
        <p className="mt-3 max-w-[44em] text-muted-foreground">
          Комплекты с этим товаром, которые мы собирали клиентам. Внутри —
          точный состав и цены.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {kits.map((kit, i) => (
          <Link
            key={i}
            to={kit.href?.slice(kit.href.indexOf('/sborka')) || '#'}
            className="group flex flex-col border border-border p-5 transition-colors hover:border-primary"
          >
            <div className="font-head text-base font-bold uppercase tracking-tight">
              {kit.title}
            </div>

            <div className="mt-2 flex-1 text-[0.85rem] leading-relaxed text-muted-foreground">
              {kit.note || `${kit.items.length} позиции в комплекте`}
            </div>

            <div className="mt-3 font-head text-lg font-bold tracking-tight">
              {kit.total.toLocaleString('ru-RU')} ₽
            </div>

            {kit.term && (
              <div className="mt-1 text-[0.8rem] text-muted-foreground">
                {kit.term}
              </div>
            )}

            <span className="mt-3 inline-flex items-center gap-2 font-head text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-primary">
              Посмотреть состав
              <Icon
                name="ArrowRight"
                size={13}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ProductKits;
