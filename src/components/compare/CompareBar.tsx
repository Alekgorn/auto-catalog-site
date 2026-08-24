import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { productImages } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';
import { useCompare } from '@/context/CompareContext';

/**
 * Полоска сравнения внизу экрана: что отмечено и кнопка «Сравнить».
 * Появляется, как только выбран хотя бы один товар, и ведёт на таблицу.
 */
const CompareBar = () => {
  const { ids, category, remove, clear } = useCompare();
  const { products } = useCatalog();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const picked = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  // На самой странице сравнения полоска не нужна — там всё и так видно
  if (!picked.length || pathname.startsWith('/compare')) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[45] border-t-2 border-foreground bg-surface shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">
      <div className="section-pad py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex flex-none items-center gap-2 font-head text-[0.78rem] font-bold uppercase tracking-[0.08em]">
              <Icon name="Scale" size={16} className="text-primary" />
              <span className="hidden sm:inline">Сравнение</span>
            </span>

            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {picked.map((p) => (
                <div
                  key={p.id}
                  className="relative flex-none border border-border bg-surface-muted"
                  title={p.name}
                >
                  <img
                    src={productImages(p)[0]}
                    alt={p.name}
                    loading="lazy"
                    className="h-12 w-12 object-contain p-1"
                  />
                  <button
                    onClick={() => remove(p.id)}
                    aria-label={`Убрать ${p.name}`}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name="X" size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-none items-center gap-2">
            <button
              onClick={clear}
              className="flex-none border border-border px-3 py-2.5 text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Очистить
            </button>
            <button
              onClick={() => navigate('/compare')}
              disabled={picked.length < 2}
              className="flex flex-1 items-center justify-center gap-2 bg-foreground px-5 py-2.5 font-head text-[0.76rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {picked.length < 2
                ? 'Добавьте ещё товар'
                : `Сравнить ${picked.length}`}
              <Icon name="ArrowRight" size={15} />
            </button>
          </div>
        </div>

        {category && (
          <div className="mt-1.5 truncate text-[0.7rem] text-muted-foreground">
            Сравниваем в разделе «{category}»
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareBar;