import Icon from "@/components/ui/icon";

interface Props {
  onResetCache: () => void;
  onLogout: () => void;
}

/** Верхняя панель админки: лого, сброс кеша сайта, ссылка на сайт, выход. */
const AdminHeader = ({ onResetCache, onLogout }: Props) => (
  <header className="sticky top-0 z-40 border-b border-foreground bg-background section-pad">
    <div className="flex h-[76px] items-center justify-between gap-6">
      <div className="flex items-center gap-3 font-head text-xl font-bold uppercase tracking-[-0.02em]">
        <span className="block h-4 w-4 flex-none bg-primary" />
        Админка
      </div>
      <div className="flex items-center gap-6">
        <button
          onClick={onResetCache}
          title="Убрать сохранённую копию каталога и открыть сайт заново"
          className="flex items-center gap-2 border border-foreground px-4 py-2 text-[0.78rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="RefreshCw" size={15} />
          Обновить сайт
        </button>
        <a
          href="/"
          className="text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
        >
          На сайт
        </a>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
        >
          <Icon name="LogOut" size={15} />
          Выйти
        </button>
      </div>
    </div>
  </header>
);

export default AdminHeader;
