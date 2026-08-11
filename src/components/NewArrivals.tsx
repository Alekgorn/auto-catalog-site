import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import ProductCard from '@/components/ProductCard';
import { Vehicle } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';

/**
 * Восемь товаров, добавленных последними.
 * Показывает, что каталог живой и пополняется.
 */
const NewArrivals = ({ vehicle }: { vehicle: Vehicle | null }) => {
  const { products } = useCatalog();

  const items = useMemo(() => {
    const time = (v?: string | null) => (v ? new Date(v).getTime() : 0);
    const dated = products.filter((p) => time(p.createdAt) > 0);
    const list = dated.length ? dated : products;
    return [...list]
      .sort((a, b) => time(b.createdAt) - time(a.createdAt))
      .slice(0, 8);
  }, [products]);

  if (items.length < 4) return null;

  return (
    <section id="new" className="section-pad anchor-offset">
      <div className="rule" />
      <SectionHead
        index="04"
        eyebrow="Новое в каталоге"
        title="Только что привезли"
        note="Последние поступления на склад. Совместимость с вашей машиной проверяется так же, как и по всему каталогу — подберите авто, и мы отметим, что подходит."
      />

      <div className="grid grid-cols-2 gap-3 pb-10 sm:gap-6 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} vehicle={vehicle} />
        ))}
      </div>

      <div className="pb-12">
        <Link
          to="/#catalog"
          className="inline-flex items-center gap-2 border border-foreground px-6 py-4 font-head text-[0.85rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          Весь каталог
          <Icon name="ArrowRight" size={16} />
        </Link>
      </div>
    </section>
  );
};

export default NewArrivals;
