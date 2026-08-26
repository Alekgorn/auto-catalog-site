import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';

interface Props {
  /** Ссылка на снимок; пусто — просмотр закрыт */
  src: string | null;
  onClose: () => void;
}

/**
 * Снимок во весь экран при редактировании товара.
 *
 * В карточках админки фото стоят миниатюрами 96×96 — по ним не понять,
 * что именно на снимке: схема разъёма, фото в салоне или дубль соседнего
 * кадра. Клик по миниатюре открывает оригинал целиком, не уводя из формы.
 */
const ImageZoom = ({ src, onClose }: Props) => {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      /* Esc закрывает только фото: окно редактора остаётся открытым,
         иначе одно нажатие теряло бы несохранённую правку */
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      onClose();
    };
    /*
     * Слушаем на окне и на перехвате: редактор товара ловит Esc на
     * документе и подписался раньше нас. Окно в цепочке перехвата стоит
     * выше документа, поэтому наш обработчик срабатывает первым и
     * останавливает нажатие до того, как редактор его увидит.
     */
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [src, onClose]);

  if (!src) return null;

  /*
   * Через портал в body: редактор товара живёт внутри модалки, а у неё
   * есть собственный transform. Внутри такого родителя position:fixed
   * считается от окна модалки, и просмотр занял бы не весь экран.
   */
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      /* По этой метке окно редактора узнаёт свой просмотр и не считает
         клик по нему поводом закрыться (см. keepOpenOnZoom) */
      data-image-zoom=""
      onClick={onClose}
      /*
       * Нажатие не должно доходить до окна редактора: оно считает любой
       * клик за своими границами поводом закрыться, и вместе с фото
       * захлопывался весь товар с несохранёнными правками.
       */
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      /* Открытая модалка гасит нажатия по всему, что вне её окна —
         возвращаем их себе, иначе кнопка «Закрыть» не нажимается */
      className="pointer-events-auto fixed inset-0 z-[120] flex cursor-zoom-out flex-col bg-foreground/95 p-4 animate-fade-in"
    >
      <div className="flex flex-none justify-end">
        <button
          onClick={onClose}
          aria-label="Закрыть просмотр"
          className="flex items-center gap-2 p-1 text-background/80 transition-colors hover:text-background"
        >
          <span className="text-[0.78rem] uppercase tracking-[0.08em]">
            Закрыть
          </span>
          <Icon name="X" size={22} />
        </button>
      </div>

      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="min-h-0 flex-1 cursor-default object-contain"
      />

      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-3 flex flex-none items-center justify-center gap-2 text-[0.75rem] uppercase tracking-[0.08em] text-background/70 transition-colors hover:text-background"
      >
        <Icon name="ExternalLink" size={14} />
        Открыть оригинал в новой вкладке
      </a>
    </div>,
    document.body,
  );
};

/**
 * Пропсы для окна, внутри которого открывают просмотр фото.
 *
 * Модалка закрывается по клику мимо себя, а просмотр рисуется рядом с ней,
 * а не внутри — поэтому любое нажатие по фото читалось как «клик снаружи»,
 * и вместе с фото захлопывался товар с несохранёнными правками. Здесь мы
 * узнаём свой просмотр по метке и оставляем окно открытым.
 */
export const keepOpenOnZoom = {
  onPointerDownOutside: (e: { target: EventTarget | null; preventDefault: () => void }) => {
    const el = e.target as HTMLElement | null;
    if (el?.closest?.('[data-image-zoom]')) e.preventDefault();
  },
  onInteractOutside: (e: { target: EventTarget | null; preventDefault: () => void }) => {
    const el = e.target as HTMLElement | null;
    if (el?.closest?.('[data-image-zoom]')) e.preventDefault();
  },
  onEscapeKeyDown: (e: Event) => {
    /* Просмотр открыт — Esc относится к нему, а не к форме товара */
    if (document.querySelector('[data-image-zoom]')) e.preventDefault();
  },
};

export default ImageZoom;