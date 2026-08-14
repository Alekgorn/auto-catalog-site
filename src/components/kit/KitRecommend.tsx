import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Product, Vehicle, matchVehicle } from '@/data/catalog';
import ProductCard from '@/components/ProductCard';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  products: Product[];
  vehicle: Vehicle | null;
  /** Что уже выбрано: раздел → id товара */
  picks: Record<string, string>;
  onPick: (product: Product) => void;
  /** Основные шаги собраны — только тогда есть смысл советовать */
  ready: boolean;
}

/** Разделы, которые дополняют магнитолу */
const GROUPS = [
  {
    category: 'Камеры кругового обзора',
    title: 'Камеры',
    text: 'Выводятся на экран магнитолы — парковка без нервов.',
    icon: 'Aperture',
  },
  {
    category: 'Видеорегистраторы',
    title: 'Видеорегистраторы',
    text: 'Пишут дорогу и питаются от той же проводки.',
    icon: 'Video',
  },
];

const SHOW = 3;

/**
 * «Рекомендуем к вашей сборке» — камеры и регистраторы к уже выбранной
 * магнитоле. Показываем по три позиции, остальное за кнопкой.
 */
const KitRecommend = ({ products, vehicle, picks, onPick, ready }: Props) => {
  const { brands } = useCatalog();
  const [openAll, setOpenAll] = useState<Record<string, boolean>>({});

  const groups = useMemo(
    () =>
      GROUPS.map((g) => {
        let list = products.filter((p) => p.category === g.category);
        if (vehicle) {
          list = list.filter(
            (p) => matchVehicle(p, vehicle, brands.length) !== null,
          );
        }
        return {
          ...g,
          list: [...list].sort((a, b) => a.price - b.price),
        };
      }).filter((g) => g.list.length > 0),
    [products, vehicle, brands.length],
  );

  if (!ready || !groups.length) return null;

  return (
    <>
      <div className="rule" />
      <section id="kit-recommend" className="scroll-mt-24 py-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 flex-none items-center justify-center border border-foreground bg-foreground text-background">
            <Icon name="Sparkles" size={24} />
          </span>
          <div>
            <h2 className="font-head text-[1.25rem] font-bold uppercase tracking-tight">
              Рекомендуем к вашей сборке
            </h2>
            <p className="mt-1.5 max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
              Магнитола уже есть — добавьте камеру и регистратор. Ставятся
              заодно, за один визит, и работают с тем же экраном.
            </p>
          </div>
        </div>

        {groups.map((g) => {
          const all = !!openAll[g.category];
          const shown = all ? g.list : g.list.slice(0, SHOW);

          return (
            <div key={g.category} className="mt-7">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2.5">
                  <Icon
                    name={g.icon}
                    fallback="Package"
                    size={19}
                    className="text-primary"
                  />
                  <h3 className="font-head text-[1.05rem] font-bold tracking-tight">
                    {g.title}
                  </h3>
                </div>
                <p className="text-[0.84rem] text-muted-foreground">{g.text}</p>

                {g.list.length > SHOW && (
                  <button
                    onClick={() =>
                      setOpenAll((prev) => ({
                        ...prev,
                        [g.category]: !prev[g.category],
                      }))
                    }
                    className="flex flex-none items-center gap-1.5 border border-foreground px-3.5 py-2 font-head text-[0.72rem] font-bold uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name={all ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    {all
                      ? 'Свернуть'
                      : `Показать все (+${g.list.length - SHOW})`}
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {shown.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    vehicle={vehicle}
                    picked={picks[p.category] === p.id}
                    onPick={onPick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
};

export default KitRecommend;
