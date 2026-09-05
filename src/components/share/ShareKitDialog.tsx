import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';
import { Vehicle, formatPrice } from '@/data/catalog';
import { isVehicle } from '@/lib/vehicle';
import { shareText } from '@/lib/share-kit';
import { copyToClipboard } from '@/lib/clipboard';
import { usePrice } from '@/hooks/use-price';
import QuoteTab, { QuoteItem } from '@/components/share/QuoteTab';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Готовая ссылка на состав */
  url: string;
  /** Итоговая сумма: человек должен понимать, чем делится */
  total: number;
  vehicle: Vehicle | null;
  /** Состав комплекта — для списка в окне и для сметы установщика */
  items: QuoteItem[];
}

/**
 * Окно «Поделиться сборкой».
 *
 * Ссылка уносит состав целиком, поэтому получателю ничего не надо
 * собирать заново: он открывает готовый комплект под ту же машину,
 * может поменять позиции и заказать сам.
 */
const ShareKitDialog = ({ open, onClose, url, total, vehicle, items }: Props) => {
  const [copied, setCopied] = useState(false);
  /** Родное меню телефона есть не везде — кнопку рисуем только там, где есть */
  const [canSystem, setCanSystem] = useState(false);
  /** Что отправляем: ссылку на сборку или свою смету */
  const [mode, setMode] = useState<'link' | 'quote'>('link');
  /** Подсказка под кнопками — например, что сообщение уже в буфере */
  const [hint, setHint] = useState('');
  const { dealer, priceOf } = usePrice();

  const count = items.length;
  const names = items.map((i) => i.product.name);

  useEffect(() => {
    setCanSystem(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setMode('link');
    setHint('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      /* Esc закрывает только это окно: корзина под ним ловит ту же
         клавишу и иначе схлопнулась бы вместе с ним */
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const text = shareText(count, vehicle);
  const message = `${text} ${url}`;

  const copyText = copyToClipboard;

  const copy = async () => {
    const ok = await copyText(url);
    /* Не получилось — честно говорим и показываем адрес, чтобы человек
       скопировал руками. Раньше кнопка молча делала вид, что сработала */
    if (!ok) {
      setHint('Скопируйте ссылку из поля выше вручную');
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const openWindow = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  /* Telegram и ВКонтакте принимают ссылку своей страницей «поделиться»,
     у MAX такой страницы нет — ему передаём текст через буфер */
  const targets: {
    key: string;
    label: string;
    icon: string;
    run: () => void | Promise<void>;
  }[] =
    [
      {
        key: 'max',
        label: 'MAX',
        icon: 'MessageCircle',
        /*
         * У MAX нет страницы «поделиться» — адрес max.ru/share отвечает
         * ошибкой, и раньше кнопка открывала пустую вкладку. Поэтому
         * кладём готовое сообщение в буфер и открываем сам мессенджер:
         * человеку остаётся выбрать чат и вставить.
         */
        run: () => {
          /* Вкладку открываем сразу, до копирования: после await браузер
             телефона считает открытие не действием человека и блокирует */
          openWindow('https://max.ru/');
          void copyText(message).then(() =>
            setHint('Сообщение скопировано — вставьте его в чат'),
          );
        },
      },
      {
        key: 'tg',
        label: 'Telegram',
        icon: 'Send',
        run: () =>
          openWindow(
            `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
          ),
      },
      {
        key: 'vk',
        label: 'ВКонтакте',
        icon: 'Users',
        run: () =>
          openWindow(
            `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
          ),
      },
    ];

  const car = isVehicle(vehicle)
    ? `${vehicle.brand} ${vehicle.model}, ${vehicle.year} г.`
    : '';

  /*
   * Через портал в body: окно открывают из боковой корзины, а она гасит
   * нажатия по всему, что лежит внутри неё. Рядом с ней — не внутри.
   */
  return createPortal(
    <div
      /*
       * pointer-events-auto обязателен: боковая корзина на время своего
       * показа глушит нажатия по всему, что лежит вне её, — а наше окно
       * лежит как раз вне. Без этого ни одна кнопка тут не срабатывала:
       * ни копирование ссылки, ни мессенджеры.
       */
      className="pointer-events-auto fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      /* Корзина закрывается по клику мимо себя — нажатия по нашему окну
         до неё доходить не должны, иначе исчезнут оба */
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/50 backdrop-blur-[2px]"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col bg-surface shadow-panel sm:max-h-[88vh]">
        <div className="flex flex-none items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="eyebrow">Поделиться</div>
            <h2 className="mt-0.5 font-head text-lg font-bold uppercase leading-tight tracking-tight">
              {count === 1 ? 'Ваш выбор' : 'Ваша сборка'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 flex-none p-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={22} />
          </button>
        </div>

        {/* Смета — только для мастеров: обычному покупателю незачем
            снимать с подборки наше имя, а лишний выбор его путает */}
        {dealer && (
          <div className="flex flex-none gap-6 border-b border-border px-5 pt-3">
            {(
              [
                ['link', 'Ссылка'],
                ['quote', 'Смета клиенту'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`border-b-2 pb-2.5 text-[0.78rem] uppercase tracking-[0.08em] transition-colors ${
                  mode === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {dealer && mode === 'quote' ? (
          <QuoteTab
            items={items}
            vehicle={vehicle}
            dealerPriceOf={priceOf}
            hasDealer={items.some((i) => priceOf(i.product) < i.product.price)}
          />
        ) : (
          <>
          {/* Что именно уедет по ссылке: без этого человек шлёт вслепую */}
          <div className="border border-border bg-surface-muted px-4 py-3">
            {car && (
              <div className="text-[0.78rem] uppercase tracking-[0.08em] text-muted-foreground">
                {car}
              </div>
            )}
            <ul className="mt-1.5 space-y-1">
              {names.slice(0, 4).map((name, i) => (
                <li
                  key={name + i}
                  className="truncate text-[0.85rem] leading-snug"
                >
                  {name}
                </li>
              ))}
              {names.length > 4 && (
                <li className="text-[0.8rem] text-muted-foreground">
                  и ещё {names.length - 4}
                </li>
              )}
            </ul>
            <div className="mt-3 flex items-end justify-between border-t border-border pt-2.5">
              <span className="text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                Итого
              </span>
              <span className="font-head text-xl font-bold tracking-tight">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Родное меню телефона — самый привычный жест, поэтому первым */}
          {canSystem && (
            <button
              onClick={() =>
                navigator
                  .share({ title: 'Комплект', text, url })
                  .catch(() => undefined)
              }
              className="mt-4 flex w-full items-center justify-center gap-2 bg-foreground px-5 py-3.5 font-head text-[0.82rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Icon name="Share2" size={17} />
              Отправить
            </button>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {targets.map((t) => (
              <button
                key={t.key}
                onClick={t.run}
                className="flex flex-col items-center gap-1.5 border border-border px-2 py-3 text-[0.75rem] font-medium transition-colors hover:border-foreground hover:bg-surface-muted"
              >
                <Icon name={t.icon} size={20} className="text-primary" />
                {t.label}
              </button>
            ))}
          </div>

          {hint && (
            <div className="mt-2.5 flex items-center gap-2 border border-success bg-success-soft px-3 py-2 text-[0.78rem] text-success">
              <Icon name="Check" size={14} strokeWidth={3} className="flex-none" />
              {hint}
            </div>
          )}

          <div className="mt-3 flex items-stretch gap-2">
            <div className="min-w-0 flex-1 truncate border border-border px-3 py-2.5 text-[0.8rem] text-muted-foreground">
              {url}
            </div>
            <button
              onClick={copy}
              className={`flex flex-none items-center gap-2 border px-4 text-[0.75rem] font-bold uppercase tracking-[0.06em] transition-colors ${
                copied
                  ? 'border-success bg-success text-success-foreground'
                  : 'border-foreground hover:bg-foreground hover:text-background'
              }`}
            >
              <Icon name={copied ? 'Check' : 'Copy'} size={15} />
              {copied ? 'Готово' : 'Копировать'}
            </button>
          </div>

          <p className="mt-3 text-[0.78rem] leading-snug text-muted-foreground">
            По ссылке откроется этот же комплект — состав можно поменять, а
            цены будут актуальны на момент открытия.
          </p>

          {/* Скрытый текст для копирования целиком — им пользуются те,
              кто пишет сообщение руками */}
          <button
            onClick={async () => {
              const ok = await copyText(message);
              if (!ok) {
                setHint('Скопируйте ссылку из поля выше вручную');
                return;
              }
              setCopied(true);
              setTimeout(() => setCopied(false), 2200);
            }}
            className="mt-3 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="ClipboardList" size={14} />
            Скопировать с текстом
          </button>
          </>
        )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ShareKitDialog;