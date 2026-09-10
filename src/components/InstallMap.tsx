import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  /** «59.939095, 30.315868» — как копируется из Яндекс.Карт */
  coords: string;
  name: string;
  address: string;
}

/**
 * Карта места установки.
 *
 * Грузим не сразу, а по нажатию: карта тянет свои скрипты со стороны
 * Яндекса, и десяток таких на странице заметно замедлил бы её. Пока
 * человек не попросил — показываем спокойную заглушку с адресом.
 *
 * Встраиваем готовый конструктор карт, без ключа разработчика: ключ —
 * это ещё одна вещь, которая однажды протухнет и молча сломает карту
 * на всех страницах.
 */
const InstallMap = ({ coords, name, address }: Props) => {
  const [open, setOpen] = useState(false);

  /* Яндекс ждёт долготу перед широтой, а копируются они наоборот —
     на этом легко потерять точку где-то в океане */
  const parts = coords
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const [lat, lon] = parts;
  const ll = `${lon},${lat}`;

  const external = `https://yandex.ru/maps/?pt=${ll}&z=17&l=map`;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 border border-border p-4 text-left transition-colors hover:border-primary"
      >
        <Icon
          name="MapPin"
          size={18}
          className="flex-none text-primary"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-head text-[0.9rem] font-medium">
            {name || 'Показать на карте'}
          </span>
          {address && (
            <span className="mt-0.5 block text-[0.8rem] leading-snug text-muted-foreground">
              {address}
            </span>
          )}
        </span>
        <span className="flex-none text-[0.72rem] uppercase tracking-[0.08em] text-primary">
          Карта
        </span>
      </button>
    );
  }

  return (
    <div className="border border-border">
      <iframe
        src={`https://yandex.ru/map-widget/v1/?ll=${ll}&z=17&pt=${ll},pm2rdm`}
        title={`Карта: ${name || address}`}
        loading="lazy"
        className="aspect-[4/3] w-full border-0 sm:aspect-[16/9]"
        allowFullScreen
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3">
        <span className="min-w-0 text-[0.8rem] leading-snug text-muted-foreground">
          {address}
        </span>
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-none items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.08em] text-primary"
        >
          Открыть в Яндексе
          <Icon name="ArrowUpRight" size={13} />
        </a>
      </div>
    </div>
  );
};

export default InstallMap;
