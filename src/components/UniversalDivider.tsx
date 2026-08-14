import Icon from '@/components/ui/icon';

interface Props {
  /** Сколько универсальных позиций идёт ниже */
  count: number;
}

/**
 * Разделитель перед универсальными товарами в подборке по машине.
 * Выше — то, что точно встанет на авто, ниже — то, что подходит почти всем.
 */
const UniversalDivider = ({ count }: Props) => (
  <div className="col-span-full pb-1 pt-6">
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
      <span className="flex h-9 w-9 flex-none items-center justify-center border border-border bg-surface">
        <Icon name="Boxes" size={17} className="text-muted-foreground" />
      </span>
      <div>
        <div className="font-head text-[0.95rem] font-bold uppercase tracking-tight">
          Универсальные товары ({count})
        </div>
        <p className="mt-0.5 text-[0.82rem] text-muted-foreground">
          Могут тоже подойти к вашему автомобилю — уточните перед заказом.
        </p>
      </div>
    </div>
  </div>
);

export default UniversalDivider;
