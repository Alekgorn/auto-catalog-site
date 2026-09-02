import Icon from '@/components/ui/icon';
import { Vehicle } from '@/data/catalog';

interface Props {
  /** Сколько универсальных позиций идёт ниже */
  count: number;
  /** Машина покупателя — подставляем в подпись, чтобы снять сомнения */
  vehicle?: Vehicle | null;
}

/**
 * Разделитель перед товарами, которые подходят любой машине.
 * Выше — подобранное под конкретное авто, ниже — то, что не зависит от модели:
 * регистраторы, камеры, шумоизоляция, расходка.
 *
 * Раньше здесь стояло «могут тоже подойти — уточните перед заказом».
 * Эта осторожность шла от старого способа определять универсальность:
 * он был догадкой по доле марок, и утверждать наверняка было нельзя.
 * Теперь тип подбора задан у товара явно, поэтому говорим прямо.
 */
const UniversalDivider = ({ count, vehicle }: Props) => (
  <div className="col-span-full pb-1 pt-6">
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
      <span className="flex h-9 w-9 flex-none items-center justify-center border border-border bg-surface">
        <Icon name="Check" size={17} className="text-muted-foreground" />
      </span>
      <div>
        {/* Мельче и тусклее заголовка раздела: это подпись внутри него,
            а не название категории — иначе они спорят за внимание */}
        <div className="font-head text-[0.85rem] font-bold uppercase tracking-tight text-muted-foreground">
          Подходит любой машине ({count})
        </div>
        <p className="mt-0.5 text-[0.82rem] text-muted-foreground">
          {vehicle
            ? `Не зависят от марки и года. Если у товара стоит пометка о размере — на ваш ${vehicle.brand} ${vehicle.model} он не встанет.`
            : 'Не зависит от марки и года выпуска.'}
        </p>
      </div>
    </div>
  </div>
);

export default UniversalDivider;