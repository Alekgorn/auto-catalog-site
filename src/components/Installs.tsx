import { useMemo } from 'react';
import SectionHead from '@/components/SectionHead';
import InstallCard from '@/components/InstallCard';
import { useCatalog } from '@/context/CatalogContext';

/** Сколько работ показываем в ленте сразу */
const SHOWN = 6;

/**
 * Лента выполненных работ на главной.
 *
 * Отвечает на вопрос, который человек задаёт себе на самом деле: не
 * «сколько стоит комплект», а «как это будет выглядеть в моей машине».
 * Опись коробки на этот вопрос не отвечает, фотография установленной
 * панели — отвечает сразу.
 *
 * Пара «было/стало» переключается на месте, а не лежит двумя кадрами
 * рядом: разница читается, только когда картинка меняется в той же
 * рамке. Поэтому и снимать их просим с одной точки.
 */
const Installs = () => {
  const { installs, products } = useCatalog();

  const list = useMemo(
    () => (installs ?? []).slice(0, SHOWN),
    [installs],
  );

  if (!list.length) return null;

  const nameOf = (slug: string) =>
    products.find((p) => p.id === slug)?.name ?? null;

  return (
    <section id="installs" className="section-pad anchor-offset">
      <div className="rule" />
      <SectionHead
        index="03"
        eyebrow="Выполненные работы"
        title="Что можно поставить в вашу машину"
        note="Реальные установки: как выглядела панель до работы и что получилось. Оборудование из каждой — в каталоге, подойдёт и на вашу машину."
      />

      {/* Пока работ мало, сетка из трёх колонок смотрится пустой:
          одна карточка и два зияющих места. Раскладываем по числу
          записей, а с четырёх переходим на обычную сетку */}
      <div
        className={`grid gap-5 pb-10 ${
          list.length === 1
            ? 'grid-cols-1 sm:max-w-[26rem]'
            : list.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {list.map((it) => (
          <InstallCard key={it.slug} install={it} nameOf={nameOf} />
        ))}
      </div>
    </section>
  );
};

export default Installs;
