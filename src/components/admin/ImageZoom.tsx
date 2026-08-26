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
      /* Esc закрывает только фото: окно редактора остаётся открытым,
         иначе одно нажатие теряло бы несохранённую правку */
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
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
      onClick={onClose}
      className="fixed inset-0 z-[120] flex cursor-zoom-out flex-col bg-foreground/95 p-4 animate-fade-in"
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

export default ImageZoom;