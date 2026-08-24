import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Vehicle } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { maxHref, maxPhone, tgHref } from '@/lib/site-settings';

interface Props {
  /** Машина покупателя — называем её прямо, чтобы не было сомнений */
  vehicle: Vehicle;
}

/**
 * Заглушка поверх шагов сборки, когда под машину нет переходных рамок.
 *
 * Без рамки магнитоле некуда встать, и комплект не соберётся ни при каком
 * выборе. Раньше человек листал магнитолы, доходил до второго шага и упирался
 * в пустоту — время потрачено, ответа нет. Теперь говорим сразу и даём три
 * выхода: написать нам, посмотреть остальное для этой машины, сменить авто.
 */
const KitNoFrames = ({ vehicle }: Props) => {
  const { contacts } = useCatalog();
  const tg = tgHref(contacts.telegram);
  const max = maxHref(contacts.max);
  const maxNumber = maxPhone(contacts.max);
  const car = `${vehicle.brand} ${vehicle.model} ${vehicle.year} г.`;

  return (
    <div className="border-2 border-foreground bg-background p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center border border-border bg-surface">
          <Icon name="CircleAlert" size={20} className="text-primary" />
        </span>
        <div className="min-w-0">
          <div className="font-head text-[1.15rem] font-bold uppercase leading-tight tracking-tight sm:text-[1.35rem]">
            На {car} готового решения пока нет
          </div>
          <p className="mt-2 max-w-[42em] text-[0.9rem] leading-relaxed text-muted-foreground">
            Переходной рамки под эту машину у нас в каталоге нет, а без неё
            магнитоле некуда встать — собрать комплект не получится.
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <p className="max-w-[42em] text-[0.9rem] leading-relaxed">
          Напишите нам — разберёмся с вашей панелью и поможем: подскажем решение,
          привезём рамку под заказ или подберём вариант установки.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {tg && (
            <a
              href={tg}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-foreground px-5 py-3.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Icon name="Send" size={17} />
              Написать в Telegram
            </a>
          )}
          {max && (
            <a
              href={max}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-foreground px-5 py-3.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
            >
              <Icon name="MessageCircle" size={17} />
              Написать в MAX
            </a>
          )}
        </div>

        {maxNumber && (
          <p className="mt-2 text-[0.75rem] text-muted-foreground">
            MAX: найдите нас по номеру {maxNumber}
          </p>
        )}

        {contacts.phone && (
          <p className="mt-3 text-[0.85rem] text-muted-foreground">
            Или позвоните:{' '}
            <a
              href={`tel:${contacts.phone.replace(/[^+\d]/g, '')}`}
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {contacts.phone}
            </a>
            {contacts.hours && (
              <span className="block text-[0.78rem]">{contacts.hours}</span>
            )}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
        <Link
          to="/scenario/vse-po-mashine"
          className="flex items-center gap-2 border border-foreground px-5 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
        >
          Что ещё подойдёт на {vehicle.brand} {vehicle.model}
          <Icon name="ArrowRight" size={15} />
        </Link>
      </div>
    </div>
  );
};

export default KitNoFrames;
