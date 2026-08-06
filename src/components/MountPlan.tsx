interface Props {
  className?: string;
}

/** Signature-элемент: объёмный силуэт автомобиля с точками установки электроники. */
const MountPlan = ({ className = '' }: Props) => (
  <svg
    viewBox="0 0 420 300"
    preserveAspectRatio="xMidYMid meet"
    aria-label="Схема мест установки автоэлектроники в автомобиле"
    className={`block h-full w-full overflow-visible ${className}`}
  >
    <defs>
      <linearGradient id="mp-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--hero-x-diagram)" stopOpacity="0.14" />
        <stop offset="55%" stopColor="var(--hero-x-diagram)" stopOpacity="0.08" />
        <stop offset="100%" stopColor="var(--hero-x-diagram)" stopOpacity="0.04" />
      </linearGradient>
      <linearGradient id="mp-glass" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0%" stopColor="var(--hero-x-diagram)" stopOpacity="0.2" />
        <stop offset="100%" stopColor="var(--hero-x-diagram)" stopOpacity="0.07" />
      </linearGradient>
      <linearGradient id="mp-hood" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0%" stopColor="var(--hero-x-diagram)" stopOpacity="0.1" />
        <stop offset="100%" stopColor="var(--hero-x-diagram)" stopOpacity="0.03" />
      </linearGradient>
      <radialGradient id="mp-shadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="var(--hero-x-diagram)" stopOpacity="0.16" />
        <stop offset="100%" stopColor="var(--hero-x-diagram)" stopOpacity="0" />
      </radialGradient>
    </defs>

    <ellipse cx="212" cy="248" rx="150" ry="20" fill="url(#mp-shadow)" />

    <g stroke="var(--hero-x-diagram)" strokeLinejoin="round" strokeLinecap="round">
      {/* кузов */}
      <path
        d="M78 214 C70 214 64 208 64 199 L64 178 C64 166 70 158 82 154 L112 143 L146 106 C154 97 165 92 178 92 L268 92 C282 92 294 98 302 109 L326 143 L352 152 C364 156 370 165 370 177 L370 199 C370 208 364 214 356 214 Z"
        fill="url(#mp-body)"
        strokeWidth={1.4}
        strokeOpacity={0.5}
      />
      {/* крыша и стёкла */}
      <path
        d="M156 141 L180 110 C185 104 191 101 199 101 L262 101 C270 101 277 104 282 111 L305 141 Z"
        fill="url(#mp-glass)"
        strokeWidth={1.1}
        strokeOpacity={0.4}
      />
      <path d="M228 101 L228 141" strokeWidth={1} strokeOpacity={0.3} fill="none" />
      {/* капот и багажник */}
      <path
        d="M64 178 L112 172 L112 143"
        fill="url(#mp-hood)"
        strokeWidth={1}
        strokeOpacity={0.32}
      />
      <path d="M326 143 L326 172 L370 178" fill="none" strokeWidth={1} strokeOpacity={0.32} />
      <path d="M112 172 L326 172" fill="none" strokeWidth={1} strokeOpacity={0.28} />
      {/* двери */}
      <path d="M170 172 L170 205 M262 172 L262 205" fill="none" strokeWidth={0.9} strokeOpacity={0.22} />
      {/* колёса */}
      <path
        d="M118 214 C118 200 128 190 142 190 C156 190 166 200 166 214"
        fill="none"
        strokeWidth={1.4}
        strokeOpacity={0.45}
      />
      <path
        d="M272 214 C272 200 282 190 296 190 C310 190 320 200 320 214"
        fill="none"
        strokeWidth={1.4}
        strokeOpacity={0.45}
      />
      {/* оптика */}
      <path d="M66 184 L88 182" fill="none" strokeWidth={2} strokeOpacity={0.28} />
      <path d="M348 182 L368 184" fill="none" strokeWidth={2} strokeOpacity={0.28} />
    </g>

    {/* сноски */}
    <g className="pt" style={{ animationDelay: '.45s' }}>
      <path
        d="M214 128 L214 54 L332 54"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="214" cy="128" r="4" fill="var(--hero-accent)" />
      <text
        x="238"
        y="48"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Android-магнитола
      </text>
    </g>

    <g className="pt" style={{ animationDelay: '.6s' }}>
      <path
        d="M352 178 L392 178 L392 204"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="352" cy="178" r="4" fill="var(--hero-accent)" />
      <text
        x="322"
        y="222"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Камера заднего вида
      </text>
    </g>

    <g className="pt" style={{ animationDelay: '.75s' }}>
      <path
        d="M198 112 L150 26 L30 26"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="198" cy="112" r="4" fill="var(--hero-accent)" />
      <text
        x="0"
        y="20"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Видеорегистратор
      </text>
    </g>

    <g className="pt" style={{ animationDelay: '.9s' }}>
      <path
        d="M76 188 L34 188 L34 210"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="76" cy="188" r="4" fill="var(--hero-accent)" />
      <text
        x="0"
        y="228"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Парктроники
      </text>
    </g>

    <g className="pt" style={{ animationDelay: '1s' }}>
      <path
        d="M180 158 L180 276 L292 276"
        fill="none"
        stroke="var(--hero-accent)"
        strokeWidth={1}
      />
      <circle cx="180" cy="158" r="4" fill="var(--hero-accent)" />
      <text
        x="196"
        y="292"
        className="fill-foreground text-[11px] uppercase tracking-[0.09em]"
      >
        Переходная рамка и жгут
      </text>
    </g>
  </svg>
);

export default MountPlan;