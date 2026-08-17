import Icon from '@/components/ui/icon';
import { useCatalog } from '@/context/CatalogContext';
import { maxHref, maxPhone, tgHref } from '@/lib/site-settings';

interface Props {
  /** Компактный вид — для узких мест вроде панели фильтра */
  compact?: boolean;
  /** Рядом уже есть пояснение — не повторяем его над кнопками */
  hideHint?: boolean;
  /** Одна кнопка вместо двух — для тесных панелей */
  inline?: boolean;
  /** Кнопки стоят на тёмной плашке подбора */
  onDark?: boolean;
}

/**
 * Отправка фото торпедо нам в мессенджер. По снимку менеджер определяет
 * комплектацию машины и подбирает оборудование вручную — точнее,
 * чем любой автоматический подбор по марке и году.
 */
const PhotoToMessenger = ({ compact, hideHint, inline, onDark }: Props) => {
  const { contacts } = useCatalog();

  const tg = tgHref(contacts.telegram);
  const max = maxHref(contacts.max);
  // В MAX нельзя открыть чат по одному номеру — тогда показываем номер,
  // чтобы человек нашёл нас в приложении по нему
  const maxNumber = maxPhone(contacts.max);

  if (!tg && !max && !maxNumber) return null;

  /* Тесная панель: ведём в первый доступный мессенджер одной кнопкой */
  if (inline) {
    if (!tg && !max) return null;
    return (
      <a
        href={tg || max}
        target="_blank"
        rel="noopener noreferrer"
        title="Пришлите фото торпедо — подберём по комплектации"
        className="flex flex-none items-center gap-2 border border-foreground px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
      >
        <Icon name="Camera" size={16} className="flex-none" />
        Фото нам
      </a>
    );
  }

  /* На графитовой плашке чёрная рамка не видна — берём светлую */
  const btn = onDark
    ? 'border-pick-border text-pick-foreground hover:border-white hover:bg-white hover:text-pick'
    : 'border-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground';

  const links = (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'sm:flex-nowrap'}`}>
      {tg && (
        <a
          href={tg}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-1 items-center justify-center gap-2 border px-4 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.04em] transition-colors ${btn}`}
        >
          <Icon name="Send" size={16} className="flex-none" />
          Telegram
        </a>
      )}
      {max ? (
        <a
          href={max}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-1 items-center justify-center gap-2 border px-4 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.04em] transition-colors ${btn}`}
        >
          <Icon name="MessageCircle" size={16} className="flex-none" />
          MAX
        </a>
      ) : (
        maxNumber && (
          <span
            title="Найдите нас в MAX по этому номеру"
            className={`flex flex-1 items-center justify-center gap-2 border px-4 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.04em] ${
              onDark
                ? 'border-pick-border text-pick-muted'
                : 'border-border text-muted-foreground'
            }`}
          >
            <Icon name="MessageCircle" size={16} className="flex-none" />
            MAX: {maxNumber}
          </span>
        )
      )}
    </div>
  );

  if (compact) {
    return (
      <div>
        {!hideHint && (
          <div
            className={`mb-2 flex items-center gap-2 text-[0.8rem] ${
              onDark ? 'text-pick-muted' : 'text-muted-foreground'
            }`}
          >
            <Icon name="Camera" size={15} className="flex-none text-primary" />
            Не знаете, что подойдёт? Пришлите фото торпедо
          </div>
        )}
        {links}
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface px-5 py-5">
      <div className="flex items-center gap-2 font-head text-[0.95rem] font-bold uppercase tracking-tight">
        <Icon name="Camera" size={18} className="flex-none text-primary" />
        Не знаете свою комплектацию?
      </div>
      <p className="mt-2 max-w-[38em] text-[0.85rem] leading-relaxed text-muted-foreground">
        Сфотографируйте торпедо и штатную магнитолу и пришлите нам — определим
        комплектацию и подберём оборудование, которое точно встанет.
      </p>
      <div className="mt-4">{links}</div>
    </div>
  );
};

export default PhotoToMessenger;