import Icon from "@/components/ui/icon";
import { AdminGuide } from "@/components/admin/GuideEditor";

interface Props {
  guides: AdminGuide[];
  onCreate: () => void;
  onEdit: (guide: AdminGuide) => void;
  onRemove: (guide: AdminGuide) => void;
}

/** Вкладка «Инструкции»: список гайдов с превью, статусом и действиями. */
const AdminGuidesTab = ({ guides, onCreate, onEdit, onRemove }: Props) => (
  <>
    <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[42em] text-muted-foreground">
        Технические описания установки с фото. Каждую инструкцию можно
        привязать к товарам — она покажется прямо в карточке товара.
      </p>
      <button
        onClick={onCreate}
        className="flex flex-none items-center justify-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Icon name="Plus" size={16} />
        Новая инструкция
      </button>
    </div>

    {guides.length === 0 ? (
      <div className="py-20 text-center text-muted-foreground">
        Инструкций пока нет
      </div>
    ) : (
      <div className="border-t border-foreground">
        {guides.map((g) => (
          <div
            key={g.id}
            className="flex flex-wrap items-center gap-4 border-b border-border py-4"
          >
            {g.cover ? (
              <img
                src={g.cover}
                alt=""
                className="h-14 w-20 flex-none bg-card object-cover"
              />
            ) : (
              <div className="flex h-14 w-20 flex-none items-center justify-center bg-card text-muted-foreground">
                <Icon name="BookOpen" size={18} />
              </div>
            )}
            <div className="min-w-[200px] flex-1">
              <div className="font-head text-[1rem] font-medium leading-tight">
                {g.title}
              </div>
              <div className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                {g.blocks?.length ?? 0} блоков · {g.productIds?.length ?? 0}{" "}
                товаров
              </div>
            </div>
            <span
              className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.1em] ${
                g.isActive
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {g.isActive ? "На сайте" : "Скрыта"}
            </span>
            <button
              onClick={() => onEdit(g)}
              className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
            >
              Изменить
            </button>
            <button
              onClick={() => onRemove(g)}
              aria-label="Удалить"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name="Trash2" size={17} />
            </button>
          </div>
        ))}
      </div>
    )}
  </>
);

export default AdminGuidesTab;
