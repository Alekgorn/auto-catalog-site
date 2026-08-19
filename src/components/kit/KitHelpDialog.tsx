import { useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Product, Vehicle, formatPrice } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { maxHref, maxPhone, tgHref } from '@/lib/site-settings';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Машина покупателя — упоминаем её в тексте, если известна */
  vehicle: Vehicle | null;
  /**
   * Проверенный «универсальный» вариант проводки для этой машины.
   * Если подходящего нет — кнопку добавления не показываем.
   */
  fallback: Product | null;
  /** Положить вариант в сборку */
  onTake: (product: Product) => void;
  /** О чём разговор: проводка или переходная рамка */
  topic?: 'wiring' | 'frame';
}

/** Тексты окна под конкретный шаг — разговор о рамке и о разъёмах разный */
const TOPICS = {
  wiring: {
    title: 'Поможем с проводкой',
    text: 'Разъёмы отличаются даже внутри одной модели — зависит от комплектации и года. Напишите нам: попросим фото штатной фишки и назовём точный переходник. Это бесплатно и занимает пару минут.',
    note: 'Проверенный вариант',
  },
  frame: {
    title: 'Поможем с рамкой',
    text: 'Панели различаются даже у одной модели — из-за рестайлинга и комплектации. Напишите нам: попросим фото штатного места и скажем, какая рамка встанет ровно, без щелей и подрезки.',
    note: 'Проверенный вариант',
  },
} as const;

/**
 * Помощь на шаге проводки: покупатель не разбирается в разъёмах.
 * Даём два выхода — живая консультация или готовый универсальный вариант.
 */
const KitHelpDialog = ({
  open,
  onClose,
  vehicle,
  fallback,
  onTake,
  topic = 'wiring',
}: Props) => {
  const copy = TOPICS[topic];
  /* Контакты берём из админки — там же, где их меняет владелец сайта */
  const { contacts } = useCatalog();
  const tg = tgHref(contacts.telegram);
  const max = maxHref(contacts.max);
  const maxNumber = maxPhone(contacts.max);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const car = vehicle
    ? `${vehicle.brand} ${vehicle.model}, ${vehicle.year} г.`
    : '';
  /** В середине фразы точка на конце мешает */
  const carInline = car.replace(/\.$/, '');

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/60"
      />

      <div className="relative w-full max-w-[34em] border-2 border-foreground bg-background">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
          <div>
            <div className="font-head text-[1.15rem] font-bold uppercase tracking-tight">
              {copy.title}
            </div>
            <p className="mt-1 text-[0.8rem] text-muted-foreground">
              {car ? `Ваш автомобиль: ${car}` : 'Подскажем, что подойдёт'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-7">
          <p className="text-[0.88rem] leading-relaxed text-muted-foreground">
            {copy.text}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {tg && (
              <a
                href={tg}
                target="_blank"
                rel="noopener noreferrer"
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

          {fallback && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                  или сразу в сборку
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="border border-border bg-surface p-4">
                <div className="text-[0.85rem] font-medium leading-snug">
                  {fallback.name}
                </div>
                <div className="mt-1 font-head text-[1.15rem] font-bold">
                  {formatPrice(fallback.price)}
                </div>
                <p className="mt-2 text-[0.8rem] leading-relaxed text-muted-foreground">
                  Проверенный вариант{carInline ? ` для ${carInline}` : ''}. Подойдёт в
                  большинстве комплектаций — а если разъём окажется другим,
                  поменяем без вопросов.
                </p>
                <button
                  onClick={() => {
                    onTake(fallback);
                    onClose();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-foreground px-5 py-3 font-head text-[0.78rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon name="Plus" size={16} />
                  Добавить и продолжить
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KitHelpDialog;