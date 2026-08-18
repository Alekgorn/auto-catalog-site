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
    <div className="-mx-6 border-b-2 border-pick-accent bg-pick px-6 text-pick-foreground md:-mx-14 md:px-14">
      <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
        {/* Красный бейдж с машиной — якорь для глаза: сразу видно,
            что выдача сейчас сужена, а не показана целиком */}
        <span className="flex flex-none items-center gap-1.5 bg-pick-accent px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-white">
          <Icon name="Car" size={15} className="flex-none" />
          Ваше авто
        </span>

        <span className="min-w-0 flex-1 truncate text-[0.9rem]">
          <span className="hidden text-pick-muted sm:inline">
            Показываем только для{' '}
          </span>
          <span className="font-head text-[1.02rem] font-bold uppercase tracking-tight text-white">
            {vehicle.brand} {vehicle.model}, {vehicle.year}
          </span>
        </span>

        <div className="flex flex-none items-center gap-2">
          <button
            onClick={change}
            className="border border-pick-border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] text-white transition-colors hover:border-pick-accent hover:bg-pick-accent"
          >
            Сменить авто
          </button>

          <button
            onClick={() => setVehicle(null)}
            aria-label="Сбросить фильтр"
            title="Показывать все товары"
            className="flex items-center gap-1.5 border border-pick-border px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.08em] text-pick-muted transition-colors hover:border-pick-foreground hover:text-pick-foreground"
          >
            <Icon name="X" size={14} className="flex-none" />
            <span className="hidden sm:inline">Сбросить фильтр</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleBadge;