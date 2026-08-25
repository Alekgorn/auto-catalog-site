import { useEffect, useState } from 'react';
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
  /** Ссылка одной строкой — открывает то же окно выбора мессенджера */
  asLink?: boolean;
  /**
   * Широкая кнопка во всю ширину — для блока гарантий под фото товара.
   * Свой текст: там речь о конкретном товаре, а не о подборе вообще.
   */
  asCard?: boolean;
  /** Кнопки стоят на тёмной плашке подбора */
  onDark?: boolean;
}

/**
 * Отправка фото торпедо нам в мессенджер. По снимку менеджер определяет
 * комплектацию машины и подбирает оборудование вручную — точнее,
 * чем любой автоматический подбор по марке и году.
 */
const PhotoToMessenger = ({
  compact,
  hideHint,
  inline,
  asLink,
  asCard,
  onDark,
}: Props) => {
  const { contacts } = useCatalog();
  /* Окно выбора мессенджера — для тесной кнопки «Фото нам» */
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const tg = tgHref(contacts.telegram);
  const max = maxHref(contacts.max);
  // В MAX нельзя открыть чат по одному номеру — тогда показываем номер,
  // чтобы человек нашёл нас в приложении по нему
  const maxNumber = maxPhone(contacts.max);

  if (!tg && !max && !maxNumber) return null;

  /* Окно выбора мессенджера — одно на все режимы компонента */
  const dialog = open ? (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
            <button
              aria-label="Закрыть"
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-foreground/60"
            />

            <div className="relative w-full max-w-[30em] border-2 border-foreground bg-background">
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="flex items-center gap-2 font-head text-[1.05rem] font-bold uppercase tracking-tight">
                  <Icon
                    name="Camera"
                    size={18}
                    className="flex-none text-primary"
                  />
                  Пришлите фото
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Закрыть"
                  className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="px-5 py-5">
                <p className="text-[0.88rem] leading-relaxed text-muted-foreground">
                  Сфотографируйте торпедо и штатную магнитолу и пришлите нам в
                  удобный мессенджер — определим комплектацию и подберём
                  оборудование, которое точно встанет.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {tg && (
                    <a
                      href={tg}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-3.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Icon name="Send" size={17} />
                      Telegram
                    </a>
                  )}
                  {max && (
                    <a
                      href={max}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="flex flex-1 items-center justify-center gap-2 border border-foreground px-5 py-3.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
                    >
                      <Icon name="MessageCircle" size={17} />
                      MAX
                    </a>
                  )}
                </div>

                {maxNumber && (
                  <p className="mt-2 text-center text-[0.75rem] text-muted-foreground">
                    MAX: найдите нас по номеру {maxNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
  ) : null;

  /*
   * Одной строкой: подчёркнутая ссылка вместо блока с кнопками.
   * Нужна там, где рядом уже есть главное действие — например
   * в шаге подбора, чтобы не спорить с ним за внимание.
   */
  if (asCard) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 flex w-full items-center gap-2 border border-border px-3.5 py-3 text-left text-[0.83rem] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="Camera" size={16} className="flex-none text-primary" />
          <span className="min-w-0 flex-1 leading-snug">
            Не уверены, что подойдёт? Пришлите фото панели — подберём
          </span>
          <Icon name="ArrowRight" size={14} className="flex-none" />
        </button>
        {dialog}
      </>
    );
  }

  if (asLink) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 border-b font-medium transition-colors ${
            onDark
              ? 'border-pick-accent/50 text-pick-foreground hover:border-pick-accent hover:text-pick-accent'
              : 'border-primary/40 text-foreground hover:border-primary hover:text-primary'
          }`}
        >
          Пришлите фото торпедо — подберём сами
          <Icon name="ArrowRight" size={14} className="flex-none" />
        </button>
        {dialog}
      </>
    );
  }

  /*
   * Тесная панель: кнопка открывает окно выбора мессенджера.
   * Раньше она молча уводила в Telegram — тем, у кого его нет,
   * деваться было некуда.
   */
  if (inline) {
    if (!tg && !max && !maxNumber) return null;
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          title="Пришлите фото торпедо — подберём по комплектации"
          className="flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap border border-foreground px-4 py-3 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary sm:flex-none"
        >
          <Icon name="Camera" size={16} className="flex-none" />
          Фото нам
        </button>

        {dialog}
      </>
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