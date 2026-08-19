import Icon from "@/components/ui/icon";

interface Props {
  password: string;
  onPasswordChange: (value: string) => void;
  loginError: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

/** Экран входа в админку по паролю. */
const AdminLogin = ({ password, onPasswordChange, loginError, onSubmit }: Props) => (
  <div className="flex min-h-screen items-center justify-center section-pad">
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm border border-foreground"
    >
      <div className="border-b border-foreground bg-primary px-6 py-5 text-primary-foreground">
        <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
          Штатно
        </div>
        <div className="mt-1 font-head text-xl font-bold uppercase tracking-tight">
          Управление каталогом
        </div>
      </div>
      <div className="px-6 py-7">
        <label className="eyebrow" htmlFor="pwd">
          Пароль
        </label>
        <input
          id="pwd"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="w-full border-b border-border bg-transparent py-3 font-head text-lg font-medium outline-none transition-colors focus:border-primary"
          placeholder="••••••••"
        />
        {loginError && (
          <div className="mt-3 text-[0.8rem] text-primary">{loginError}</div>
        )}
        <button
          type="submit"
          className="mt-7 flex w-full items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase text-background transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Войти
          <Icon name="ArrowRight" size={18} />
        </button>
      </div>
    </form>
  </div>
);

export default AdminLogin;
