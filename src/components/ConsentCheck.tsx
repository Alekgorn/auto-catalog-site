import { Link } from 'react-router-dom';

/**
 * Согласие на обработку персональных данных.
 *
 * Раньше под кнопкой стояла строка «нажимая кнопку, вы соглашаетесь» —
 * так называемое молчаливое согласие. Закон 152-ФЗ требует согласия
 * конкретного и осознанного, а Роскомнадзор считает галочку, которую
 * человек ставит сам, единственным надёжным его подтверждением.
 *
 * Один компонент на все формы: и вид, и текст должны совпадать везде.
 */
interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  /** Показать ошибку, если отправляли без галочки */
  error?: boolean;
  /** Свой отступ сверху — формы устроены по-разному */
  className?: string;
  /** Уникальная часть id: на странице бывает несколько форм сразу */
  id: string;
}

const ConsentCheck = ({ checked, onChange, error, className = '', id }: Props) => (
  <div className={className}>
    <label
      htmlFor={`consent-${id}`}
      className="flex cursor-pointer items-start gap-3 text-[0.78rem] leading-relaxed text-muted-foreground"
    >
      <input
        id={`consent-${id}`}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-primary"
      />
      <span>
        Согласен на{' '}
        <Link
          to="/privacy"
          target="_blank"
          className="underline underline-offset-2 transition-colors hover:text-primary"
        >
          обработку персональных данных
        </Link>{' '}
        и принимаю условия{' '}
        <Link
          to="/oferta"
          target="_blank"
          className="underline underline-offset-2 transition-colors hover:text-primary"
        >
          публичной оферты
        </Link>
        .
      </span>
    </label>
    {error && (
      <div className="mt-2 text-[0.8rem] text-primary">
        Без согласия мы не можем принять заявку
      </div>
    )}
  </div>
);

export default ConsentCheck;
