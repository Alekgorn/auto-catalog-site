import Icon from '@/components/ui/icon';
import { AdminInstall } from '@/components/admin/InstallEditor';

interface Props {
  installs: AdminInstall[];
  onCreate: () => void;
  onEdit: (install: AdminInstall) => void;
  onRemove: (install: AdminInstall) => void;
}

/**
 * Вкладка «Установки»: список выполненных работ.
 *
 * Показываем результат («стало») превьюшкой — по нему работу узнаёшь
 * быстрее, чем по названию машины.
 */
const AdminInstallsTab = ({ installs, onCreate, onEdit, onRemove }: Props) => (
  <div className="py-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
        Выполненные работы с фото «было/стало». Каждая установка появляется
        на страницах товаров, что в ней стояли, и в ленте на главной. Один
        раз заполнили — показывается везде.
      </p>
      <button
        onClick={onCreate}
        className="flex flex-none items-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Icon name="Plus" size={16} />
        Добавить установку
      </button>
    </div>

    {installs.length === 0 ? (
      <div className="mt-8 border border-border p-6">
        <div className="flex items-center gap-3">
          <Icon name="Camera" size={18} className="text-primary" />
          <span className="font-head text-[1rem] font-medium">
            Пока ни одной установки
          </span>
        </div>
        <p className="mt-2 max-w-[42em] text-[0.85rem] leading-relaxed text-muted-foreground">
          Добавьте первую: марка и модель машины, фото «было» и «стало»,
          отметьте использованные товары. Фотографии установленного
          оборудования убеждают сильнее любого описания — человек видит,
          как это будет выглядеть у него.
        </p>
      </div>
    ) : (
      <div className="mt-6 border-t border-foreground">
        {installs.map((it) => (
          <div
            key={it.id}
            className="flex flex-wrap items-center gap-4 border-b border-border py-4"
          >
            {it.afterImage ? (
              <img
                src={it.afterImage}
                alt=""
                className="h-16 w-20 flex-none border border-border bg-card object-cover"
              />
            ) : (
              <div className="flex h-16 w-20 flex-none items-center justify-center border border-border bg-card">
                <Icon
                  name="Image"
                  size={20}
                  className="text-muted-foreground/40"
                />
              </div>
            )}

            <div className="min-w-[200px] flex-1">
              <div className="font-head text-[1rem] font-medium leading-tight">
                {it.title || `${it.brand} ${it.model} ${it.year || ''}`.trim()}
              </div>
              <div className="mt-1 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground">
                {it.beforeImage ? 'Есть «было»' : 'Только результат'}
                {it.gallery?.length ? ` · фото ${it.gallery.length}` : ''}
                {it.video ? ' · видео' : ''}
                {it.productIds?.length
                  ? ` · товаров ${it.productIds.length}`
                  : ' · товары не отмечены'}
              </div>
            </div>

            <span
              className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.1em] ${
                it.isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground'
              }`}
            >
              {it.isActive ? 'На сайте' : 'Скрыта'}
            </span>

            <button
              onClick={() => onEdit(it)}
              className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
            >
              Изменить
            </button>
            <button
              onClick={() => onRemove(it)}
              aria-label="Удалить"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name="Trash2" size={17} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default AdminInstallsTab;
