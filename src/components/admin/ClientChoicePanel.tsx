import { useState } from 'react';
import MissingFitPanel from '@/components/admin/MissingFitPanel';
import VehiclePicksPanel from '@/components/admin/VehiclePicksPanel';

type Section = 'missing' | 'picks' | 'dealers';

interface Props {
  /** Сколько машин без решения — цифра на вкладке */
  onCount?: (n: number) => void;
}

/**
 * Выбор клиента и дилера — всё про спрос в одном разделе.
 *
 * Раньше «Нет решения» стояло отдельной вкладкой и отвечало на половину
 * вопроса: какие машины мы не закрыли. Вторая половина — какие вообще
 * выбирают, включая те, где всё нашлось, — не собиралась нигде.
 */
const ClientChoicePanel = ({ onCount }: Props) => {
  const [section, setSection] = useState<Section>('missing');

  const TABS: { id: Section; label: string }[] = [
    { id: 'missing', label: 'Нет решения' },
    { id: 'picks', label: 'Подбор по авто' },
    { id: 'dealers', label: 'Дилеры' },
  ];

  return (
    <div className="py-6">
      <div className="flex flex-wrap gap-x-7 gap-y-2 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`border-b-2 pb-1.5 text-[0.8rem] uppercase tracking-[0.1em] transition-colors ${
              section === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === 'missing' && <MissingFitPanel onCount={onCount} />}
      {section === 'picks' && <VehiclePicksPanel />}

      {/* Дилерская часть ждёт своей очереди: заказы в базе есть, а вот
          корзины — что складывали, но не заказали — пока нигде не
          сохраняются, это отдельная работа */}
      {section === 'dealers' && (
        <div className="py-10">
          <p className="max-w-[44em] text-[0.87rem] leading-relaxed text-muted-foreground">
            Здесь будут комплекты, которые собирали дилеры, и товары, что
            они выбирали. Пока раздел не подключён: оформленные заказы
            дилеров видны во вкладке «Заказы», а вот собранные корзины без
            заказа сейчас нигде не сохраняются — их сбор нужно настроить
            отдельно.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientChoicePanel;
