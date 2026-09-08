import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { ProductLevel } from '@/data/catalog';

interface Props {
  level: ProductLevel;
}

/**
 * Класс магнитолы — строкой под названием товара.
 *
 * Покупатель смотрит на две похожие с виду модели и не понимает, почему
 * одна вдвое дороже. Класс отвечает на это рядом с названием, до того
 * как взгляд уйдёт к цене.
 *
 * Подробности спрятаны под раскрытие: здесь важен сам факт уровня, а
 * характеристики есть ниже в таблице — дублировать их незачем.
 */
const ProductLevelCard = ({ level }: Props) => {
  const [open, setOpen] = useState(false);
  const hasDetails = !!(level.summary.trim() || level.suits.trim());

  return (
    <div className="mt-3">
      <button
        onClick={() => hasDetails && setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-left ${
          hasDetails ? 'group' : 'cursor-default'
        }`}
      >
        <span className="text-[0.8rem] uppercase tracking-[0.12em] text-muted-foreground">
          Класс магнитолы:
        </span>
        <span className="font-head text-[0.85rem] font-bold uppercase tracking-[0.06em] text-foreground transition-colors group-hover:text-primary">
          {level.title}
        </span>
        {level.series && (
          <span className="border border-border px-1.5 py-0.5 font-head text-[0.68rem] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            {level.series}
          </span>
        )}
        {hasDetails && (
          <Icon
            name={open ? 'ChevronUp' : 'ChevronDown'}
            size={14}
            className="flex-none text-muted-foreground transition-colors group-hover:text-primary"
          />
        )}
      </button>

      {open && (
        <div className="mt-2 border-l-2 border-primary pl-3">
          {level.summary && (
            <p className="text-[0.85rem] leading-relaxed text-muted-foreground">
              {level.summary}
            </p>
          )}
          {level.suits && (
            <p className="mt-1.5 text-[0.85rem] leading-snug">
              <span className="font-medium">Подходит: </span>
              <span className="text-muted-foreground">{level.suits}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductLevelCard;
