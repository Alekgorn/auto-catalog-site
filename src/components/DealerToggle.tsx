import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useDealer } from '@/context/DealerContext';

/**
 * Плавающая кнопка в дилерском режиме.
 *
 * Позволяет на время спрятать дилерские цены — например, когда экран видит
 * клиент. Повторное нажатие возвращает их обратно.
 */
const DealerToggle = () => {
  const { loggedIn, hidden, toggleHidden, onlyInStock, toggleOnlyInStock } =
    useDealer();
  const [hint, setHint] = useState(false);

  if (!loggedIn) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2">
      {/*
        Фильтр наличия прячет часть каталога. Легко забыть, что он включён,
        и решить, будто товар кончился — поэтому напоминаем об этом плашкой
        и даём выключить в одно нажатие
      */}
      {onlyInStock && (
        <button
          onClick={toggleOnlyInStock}
          title="Показать весь каталог"
          className="flex items-center gap-2 border-2 border-primary bg-background px-3 py-2 text-[0.75rem] font-bold uppercase tracking-[0.06em] shadow-card-hover transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Icon name="PackageCheck" size={15} />
          Только в наличии
          <Icon name="X" size={14} />
        </button>
      )}

      {hint && (
        <div className="max-w-[220px] border border-foreground bg-surface px-3 py-2 text-[0.78rem] leading-snug shadow-card-hover">
          {hidden
            ? 'Показаны розничные цены. Нажмите, чтобы вернуть дилерские.'
            : 'Показаны дилерские цены. Нажмите, чтобы скрыть их от клиента.'}
        </div>
      )}

      <button
        onClick={toggleHidden}
        onMouseEnter={() => setHint(true)}
        onMouseLeave={() => setHint(false)}
        aria-label={
          hidden ? 'Показать дилерские цены' : 'Скрыть дилерские цены'
        }
        title={hidden ? 'Показать дилерские цены' : 'Скрыть дилерские цены'}
        className={`flex h-14 w-14 items-center justify-center border-2 shadow-card-hover transition-colors ${
          hidden
            ? 'border-foreground bg-background text-foreground hover:border-primary hover:text-primary'
            : 'border-primary bg-primary text-primary-foreground hover:bg-foreground hover:border-foreground'
        }`}
      >
        <Icon name={hidden ? 'EyeOff' : 'Eye'} size={24} />
      </button>
    </div>
  );
};

export default DealerToggle;