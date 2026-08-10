import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useDealer } from '@/context/DealerContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Приводим ввод к виду +7 (999) 123-45-67 */
const formatPhone = (raw: string): string => {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11);

  const rest = digits.slice(1);
  let out = '+7';
  if (rest.length) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 4) out += `) ${rest.slice(3, 6)}`;
  if (rest.length >= 7) out += `-${rest.slice(6, 8)}`;
  if (rest.length >= 9) out += `-${rest.slice(8, 10)}`;
  return out;
};

const digitsOf = (value: string) => value.replace(/\D/g, '');

/**
 * Вход для дилеров: оставляем номер телефона.
 * Заявку обрабатывает менеджер — после подтверждения дилер видит свои цены.
 */
const DealerDialog = ({ open, onOpenChange }: Props) => {
  const { active, dealer, login, logout } = useDealer();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSent(false);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onOpenChange]);

  if (!open) return null;

  const valid = digitsOf(phone).length === 11;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    const message = await login(phone);
    setBusy(false);
    if (message) setError(message);
    else setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        aria-label="Закрыть"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
      />

      <div className="relative z-10 w-full max-w-[440px] animate-fade-in border-2 border-foreground bg-background p-6 sm:p-8">
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Закрыть"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-primary"
        >
          <Icon name="X" size={20} />
        </button>

        {active && !sent ? (
          <div className="py-2 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center border border-foreground bg-primary text-primary-foreground">
              <Icon name="BadgePercent" fallback="Tag" size={26} />
            </span>
            <h2 className="mt-5 font-head text-xl font-bold uppercase tracking-tight">
              Дилерский режим включён
            </h2>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
              {dealer?.name ? `${dealer.name}. ` : ''}Во всём каталоге показаны
              дилерские цены.
            </p>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-6 w-full bg-foreground py-3.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Перейти к покупкам
            </button>
            <button
              onClick={() => {
                logout();
                setPhone('');
                onOpenChange(false);
              }}
              className="mt-3 w-full border border-border py-3 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Выйти из режима
            </button>
          </div>
        ) : sent ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center border border-foreground bg-primary text-primary-foreground">
              <Icon name="Check" size={28} />
            </span>
            <h2 className="mt-5 font-head text-xl font-bold uppercase tracking-tight">
              Дилерский режим включён
            </h2>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
              {dealer?.name ? `${dealer.name}, добро пожаловать. ` : ''}
              Теперь в каталоге показаны ваши цены.
            </p>
            <button
              onClick={() => onOpenChange(false)}
              className="mt-6 w-full bg-foreground py-3.5 font-head text-[0.8rem] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center border border-foreground bg-primary text-primary-foreground">
              <Icon name="BadgePercent" fallback="Tag" size={24} />
            </span>

            <h2 className="mt-5 font-head text-2xl font-bold uppercase leading-tight tracking-tight">
              Вход для дилеров
            </h2>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
              Введите номер телефона, привязанный к вашей учётной записи — в
              каталоге включатся дилерские цены.
            </p>

            <form onSubmit={submit} className="mt-6">
              <label className="eyebrow mb-2 block" htmlFor="dealer-phone">
                Телефон
              </label>
              <input
                id="dealer-phone"
                ref={inputRef}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="+7 (___) ___-__-__"
                className="w-full border-2 border-foreground bg-surface px-4 py-3.5 font-head text-lg font-medium tracking-tight outline-none transition-colors focus:border-primary"
              />

              {error && (
                <p className="mt-3 flex items-start gap-2 text-[0.85rem] leading-relaxed text-primary">
                  <Icon name="CircleAlert" size={16} className="mt-0.5 flex-none" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!valid || busy}
                className="mt-6 flex w-full items-center justify-between bg-primary px-5 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? 'Проверяем…' : 'Войти'}
                <Icon name={busy ? 'Loader' : 'ArrowRight'} size={18} />
              </button>

              <p className="mt-3 text-[0.75rem] leading-relaxed text-muted-foreground">
                Нет доступа? Позвоните нам — подключим вашу компанию к дилерским
                ценам.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DealerDialog;
