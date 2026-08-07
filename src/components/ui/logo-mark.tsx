interface Props {
  className?: string;
}

/**
 * Фирменный знак: три контакта штатного разъёма в рамке колодки.
 * Читается и как разъём, и как буква «Ш» — первая буква названия.
 */
const LogoMark = ({ className = '' }: Props) => (
  <svg
    viewBox="0 0 34 32"
    fill="none"
    aria-hidden="true"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* корпус колодки */}
    <rect x="1.6" y="4" width="30.8" height="24" rx="2.4" className="fill-primary" />
    {/* три контакта — силуэт буквы «Ш» */}
    <rect x="6.6" y="9" width="4.6" height="14.2" rx="0.8" className="fill-background" />
    <rect x="14.7" y="9" width="4.6" height="14.2" rx="0.8" className="fill-background" />
    <rect x="22.8" y="9" width="4.6" height="14.2" rx="0.8" className="fill-background" />
    {/* перемычка снизу — замыкает «Ш» */}
    <rect x="6.6" y="19.4" width="20.8" height="3.8" rx="0.8" className="fill-background" />
  </svg>
);

export default LogoMark;
