import Icon from '@/components/ui/icon';
import { plural } from '@/lib/kit-filter';

interface Props {
  /** Диагонали, под которые на машину есть переходные рамки */
  sizes: number[];
  /** Сколько магнитол скрыто из-за размера */
  hidden: number;
  /** Машина покупателя строкой: «Kia Rio 2015» */
  vehicleLabel: string;
  /** Список сейчас урезан по размеру */
  filtered: boolean;
  onToggle: () => void;
}

/**
 * Подсказка о подборе магнитол по диагонали.
 *
 * В сборку комплекта такой отбор встроен давно: если на машину есть рамки
 * только под 9 дюймов, ставить десятку некуда. В обычном каталоге этого
 * не было — человек видел все магнитолы подряд и мог выбрать ту, что
 * физически не встанет в его панель.
 *
 * Разница со сборкой одна, но важная: там лишние размеры просто скрыты, а
 * здесь есть кнопка «показать все». Каталог — место, где смотрят, а не
 * только собирают комплект: покупатель может подбирать на вторую машину
 * или просто изучать ассортимент, и запирать его в отборе нельзя.
 */
const ScreenSizeNote = ({
  sizes,
  hidden,
  vehicleLabel,
  filtered,
  onToggle,
}: Props) => {
  if (!sizes.length || hidden <= 0) return null;

  const list = sizes.map((s) => String(s).replace('.', ',')).join(' и ');

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 border border-success/60 bg-success/5 px-4 py-3 text-[0.85rem] leading-snug">
      <Icon name="Filter" size={15} className="flex-none text-success" />

      <span className="min-w-0 flex-1">
        {filtered ? (
          <>
            На {vehicleLabel} встают экраны{' '}
            <b className="font-semibold">{list}&nbsp;дюймов</b> — только под
            них есть переходные рамки.{' '}
            <span className="text-muted-foreground">
              {hidden} {plural(hidden, 'магнитола', 'магнитолы', 'магнитол')}{' '}
              другого размера {plural(hidden, 'скрыта', 'скрыты', 'скрыты')}.
            </span>
          </>
        ) : (
          <>
            Показаны все магнитолы.{' '}
            <span className="text-muted-foreground">
              На {vehicleLabel} из них встают только{' '}
              <b className="font-semibold">{list}&nbsp;дюймов</b>.
            </span>
          </>
        )}
      </span>

      <button
        onClick={onToggle}
        className="flex-none border border-foreground px-3 py-1.5 text-[0.76rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
      >
        {filtered ? 'Показать все' : 'Только мой размер'}
      </button>
    </div>
  );
};

export default ScreenSizeNote;
