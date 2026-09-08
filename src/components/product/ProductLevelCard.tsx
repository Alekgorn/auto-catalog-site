import Icon from '@/components/ui/icon';
import { ProductLevel } from '@/data/catalog';

interface Props {
  level: ProductLevel;
}

/**
 * Класс магнитолы на странице товара.
 *
 * Стоит сразу под галереей: покупатель смотрит на фото и не понимает,
 * почему одна модель стоит вдвое дороже другой такой же с виду. Класс
 * отвечает на это раньше, чем взгляд уйдёт к цене.
 *
 * Содержание берётся из справочника в админке — здесь только показ.
 */
const ProductLevelCard = ({ level }: Props) => {
  const rows = [...level.specs, ...level.extra].filter(
    ([k, v]) => k.trim() || v.trim(),
  );

  return (
    <div className="mt-6 border border-foreground">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-foreground px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon
            name="Layers"
            size={15}
            className="flex-none text-background"
          />
          <span className="font-head text-[0.95rem] font-bold uppercase tracking-tight text-background">
            {level.title}
          </span>
        </div>
        {level.series && (
          <span className="font-head text-[0.72rem] font-bold uppercase tracking-[0.06em] text-background/70">
            {level.series}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        {level.summary && (
          <p className="text-[0.87rem] leading-relaxed text-muted-foreground">
            {level.summary}
          </p>
        )}

        {level.suits && (
          <p className="mt-3 flex items-start gap-2 text-[0.85rem] leading-snug">
            <Icon
              name="Check"
              size={15}
              strokeWidth={3}
              className="mt-0.5 flex-none text-primary"
            />
            <span>
              <span className="font-medium">Подходит: </span>
              <span className="text-muted-foreground">{level.suits}</span>
            </span>
          </p>
        )}

        {rows.length > 0 && (
          <dl className="mt-4 border-t border-border pt-1 text-[0.84rem]">
            {rows.map(([k, v], i) => (
              <div
                key={`${k}-${i}`}
                className="flex justify-between gap-5 border-b border-border py-2.5 last:border-0"
              >
                <dt className="flex-none text-muted-foreground">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};

export default ProductLevelCard;
