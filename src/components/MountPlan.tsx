import { useNavigate } from "react-router-dom";
import { HeroHotspot } from "@/lib/site-settings";

interface Props {
  className?: string;
  /** Подписи и ссылки точек — задаются в админке */
  hotspots: HeroHotspot[];
}

/** Геометрия точек: якорь на кузове, линия-выноска и место подписи. */
const SLOTS: Record<
  string,
  { dot: [number, number]; line: string; x: number; y: number; anchor: string }
> = {
  dvr: {
    dot: [198, 112],
    line: "M198 112 L150 30 L34 30",
    x: 30,
    y: 24,
    anchor: "start",
  },
  headunit: {
    dot: [214, 128],
    line: "M214 128 L214 58 L330 58",
    x: 334,
    y: 52,
    anchor: "start",
  },
  camera: {
    dot: [352, 178],
    line: "M352 178 L400 178 L400 236",
    x: 402,
    y: 252,
    anchor: "end",
  },
  parking: {
    dot: [76, 188],
    line: "M76 188 L32 188 L32 212",
    x: 32,
    y: 230,
    anchor: "start",
  },
  frame: {
    dot: [180, 158],
    line: "M180 158 L180 278 L286 278",
    x: 290,
    y: 284,
    anchor: "start",
  },
};

/**
 * Signature-элемент: силуэт автомобиля с активными точками установки.
 * Каждая подпись — ссылка в свой раздел, адрес задаётся в админке.
 * Наведение подсвечивает и слегка увеличивает точку, наведение на кузов —
 * всю схему целиком.
 */
const MountPlan = ({ className = "", hotspots }: Props) => {
  const navigate = useNavigate();

  const open = (href: string) => {
    if (!href) return;
    if (/^https?:\/\//.test(href)) {
      window.open(href, "_blank", "noopener");
      return;
    }
    navigate(href);
  };

  const car = hotspots.find((h) => h.key === "car");
  const points = hotspots.filter((h) => h.key !== "car" && SLOTS[h.key]);

  return (
    <svg
      viewBox="0 0 420 300"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Схема мест установки автоэлектроники в автомобиле"
      className={`mount-plan block h-full w-full overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id="mp-body" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.2"
          />
          <stop
            offset="55%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.12"
          />
          <stop
            offset="100%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.06"
          />
        </linearGradient>
        <linearGradient id="mp-glass" x1="0" y1="0" x2="0.4" y2="1">
          <stop
            offset="0%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.26"
          />
          <stop
            offset="100%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.1"
          />
        </linearGradient>
        <linearGradient id="mp-hood" x1="0" y1="0" x2="0.2" y2="1">
          <stop
            offset="0%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.14"
          />
          <stop
            offset="100%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.05"
          />
        </linearGradient>
        <radialGradient id="mp-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop
            offset="0%"
            stopColor="var(--hero-x-diagram)"
            stopOpacity="0.18"
          />
          <stop offset="100%" stopColor="var(--hero-x-diagram)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="212" cy="248" rx="150" ry="20" fill="url(#mp-shadow)" />

      {/* Кузов — тоже ссылка: клик ведёт на общий подбор */}
      <g
        className={car?.href ? "mp-car cursor-pointer" : ""}
        onClick={() => car && open(car.href)}
        role={car?.href ? "link" : undefined}
        tabIndex={car?.href ? 0 : undefined}
        aria-label={car?.label}
        onKeyDown={(e) => {
          if (car && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            open(car.href);
          }
        }}
      >
        <g
          stroke="var(--hero-x-diagram)"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path
            d="M78 214 C70 214 64 208 64 199 L64 178 C64 166 70 158 82 154 L112 143 L146 106 C154 97 165 92 178 92 L268 92 C282 92 294 98 302 109 L326 143 L352 152 C364 156 370 165 370 177 L370 199 C370 208 364 214 356 214 Z"
            fill="url(#mp-body)"
            strokeWidth={1.6}
            strokeOpacity={0.65}
          />
          <path
            d="M156 141 L180 110 C185 104 191 101 199 101 L262 101 C270 101 277 104 282 111 L305 141 Z"
            fill="url(#mp-glass)"
            strokeWidth={1.2}
            strokeOpacity={0.5}
          />
          <path
            d="M228 101 L228 141"
            strokeWidth={1}
            strokeOpacity={0.36}
            fill="none"
          />
          <path
            d="M64 178 L112 172 L112 143"
            fill="url(#mp-hood)"
            strokeWidth={1.1}
            strokeOpacity={0.4}
          />
          <path
            d="M326 143 L326 172 L370 178"
            fill="none"
            strokeWidth={1.1}
            strokeOpacity={0.4}
          />
          <path
            d="M112 172 L326 172"
            fill="none"
            strokeWidth={1}
            strokeOpacity={0.34}
          />
          <path
            d="M170 172 L170 205 M262 172 L262 205"
            fill="none"
            strokeWidth={0.9}
            strokeOpacity={0.26}
          />
          <path
            d="M118 214 C118 200 128 190 142 190 C156 190 166 200 166 214"
            fill="none"
            strokeWidth={1.6}
            strokeOpacity={0.55}
          />
          <path
            d="M272 214 C272 200 282 190 296 190 C310 190 320 200 320 214"
            fill="none"
            strokeWidth={1.6}
            strokeOpacity={0.55}
          />
          <path
            d="M66 184 L88 182"
            fill="none"
            strokeWidth={2.2}
            strokeOpacity={0.34}
          />
          <path
            d="M348 182 L368 184"
            fill="none"
            strokeWidth={2.2}
            strokeOpacity={0.34}
          />
        </g>
      </g>

      {points.map((h, i) => {
        const slot = SLOTS[h.key];
        return (
          <g
            key={h.key}
            className="mp-spot pt cursor-pointer"
            style={{ animationDelay: `${0.45 + i * 0.15}s` }}
            onClick={() => open(h.href)}
            role="link"
            tabIndex={0}
            aria-label={h.label}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(h.href);
              }
            }}
          >
            <path
              d={slot.line}
              fill="none"
              stroke="var(--hero-accent)"
              strokeWidth={1.2}
              className="mp-line"
            />
            <circle
              cx={slot.dot[0]}
              cy={slot.dot[1]}
              r={5}
              fill="var(--hero-accent)"
              className="mp-dot"
            />
            <text
              x={slot.x}
              y={slot.y}
              textAnchor={slot.anchor as "start" | "end"}
              className="mp-label fill-foreground text-[13px] font-semibold uppercase tracking-[0.06em]"
            >
              {h.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default MountPlan;