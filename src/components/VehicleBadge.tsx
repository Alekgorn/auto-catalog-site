import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useVehicle } from '@/hooks/use-vehicle';

/**
 * Плашка с выбранной машиной в шапке. Показывает, что каталог отфильтрован,
 * и даёт сменить или сбросить авто с любой страницы: без неё человек
 * не понимал, действует подбор или нет.
 */
const VehicleBadge = () => {
  const navigate = useNavigate();
  const { vehicle, setVehicle } = useVehicle();

  if (!vehicle) return null;

  /** Меняем машину там же, где её выбирают — в блоке подбора на главной */
  const change = () => navigate('/#select');

  return (
    <div className="-mx-6 bg-pick px-6 text-pick-foreground md:-mx-14 md:px-14">
      <div className="flex h-11 items-center gap-3">
        <Icon name="Car" size={17} className="flex-none text-pick-accent" />

        <span className="min-w-0 flex-1 truncate text-[0.82rem]">
          <span className="hidden text-pick-muted sm:inline">
            Показываем для{' '}
          </span>
          <span className="font-head font-bold tracking-tight">
            {vehicle.brand} {vehicle.model}, {vehicle.year}
          </span>
        </span>

        <button
          onClick={change}
          className="flex-none border border-pick-border px-3 py-1 text-[0.7rem] uppercase tracking-[0.08em] text-pick-muted transition-colors hover:border-pick-foreground hover:text-pick-foreground"
        >
          Сменить
        </button>

        <button
          onClick={() => setVehicle(null)}
          aria-label="Сбросить машину"
          title="Показывать все товары"
          className="flex-none text-pick-muted transition-colors hover:text-pick-foreground"
        >
          <span className="hidden text-[0.7rem] uppercase tracking-[0.08em] sm:inline">
            Сбросить
          </span>
          <Icon name="X" size={16} className="sm:hidden" />
        </button>
      </div>
    </div>
  );
};

export default VehicleBadge;