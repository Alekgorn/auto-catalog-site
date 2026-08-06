interface Props {
  className?: string;
}

/** Signature-элемент: схема штатных точек крепления, вид сверху. */
const MountPlan = ({ className = '' }: Props) => (
  <svg
    viewBox="0 0 320 470"
    preserveAspectRatio="xMidYMid meet"
    aria-label="Схема точек крепления оборудования на автомобиле"
    className={`block h-full w-full overflow-visible ${className}`}
  >
    <g
      fill="none"
      stroke="var(--hero-x-diagram)"
      strokeWidth={1.25}
    >
      <path d="M120 44 C104 44 96 58 94 78 L88 150 C86 172 86 300 88 322 L94 400 C97 424 106 436 122 436 L198 436 C214 436 223 424 226 400 L232 322 C234 300 234 172 232 150 L226 78 C224 58 216 44 200 44 Z" />
    </g>
    <g fill="none" stroke="var(--hero-x-diagram)" strokeWidth={1} opacity={0.55}>
      <path d="M104 118 L216 118 M104 168 L216 168 M104 356 L216 356" />
      <path d="M112 168 L112 356 M208 168 L208 356 M160 168 L160 356" />
      <rect x="76" y="128" width="14" height="52" />
      <rect x="230" y="128" width="14" height="52" />
      <rect x="76" y="318" width="14" height="52" />
      <rect x="230" y="318" width="14" height="52" />
    </g>

    <g className="pt" style={{ animationDelay: '.45s' }}>
      <path
        d="M160 30 L160 12 L292 12"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="160" cy="30" r="4.5" fill="var(--hero-accent)" />
      <text
        x="196"
        y="8"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Защита картера
      </text>
    </g>
    <g className="pt" style={{ animationDelay: '.6s' }}>
      <path
        d="M112 168 L112 148 L36 148"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="112" cy="168" r="4.5" fill="var(--hero-accent)" />
      <circle cx="208" cy="168" r="4.5" fill="var(--hero-accent)" />
      <text
        x="0"
        y="142"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Рейлинги
      </text>
    </g>
    <g className="pt" style={{ animationDelay: '.75s' }}>
      <path d="M88 262 L44 262" fill="none" stroke="var(--hero-accent)" strokeWidth={1} />
      <circle cx="88" cy="262" r="4.5" fill="var(--hero-accent)" />
      <circle cx="232" cy="262" r="4.5" fill="var(--hero-accent)" />
      <text
        x="0"
        y="257"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Пороги
      </text>
    </g>
    <g className="pt" style={{ animationDelay: '.9s' }}>
      <path
        d="M160 450 L160 464 L292 464"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="160" cy="450" r="4.5" fill="var(--hero-accent)" />
      <text
        x="246"
        y="460"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Фаркоп
      </text>
    </g>
  </svg>
);

export default MountPlan;
