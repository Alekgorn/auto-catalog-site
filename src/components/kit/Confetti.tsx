import { useEffect, useRef } from 'react';

interface Props {
  /** Каждое новое значение запускает новый залп */
  fire: number;
  /** Сколько миллисекунд идёт салют */
  duration?: number;
}

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  spin: number;
  angle: number;
}

/** Фирменные цвета плюс пара праздничных */
const COLORS = ['#dc2626', '#111111', '#16a34a', '#f59e0b', '#ffffff'];

/**
 * Салют по экрану — короткий праздник в момент, когда комплект собран.
 * Рисуем на canvas: не тормозит и не мешает кликать (pointer-events: none).
 */
const Confetti = ({ fire, duration = 2600 }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fire) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Уважаем настройку «меньше движения» в системе
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const pieces: Piece[] = [];
    // Два залпа по краям — как хлопушки на сцене
    [0.15, 0.85].forEach((side) => {
      for (let i = 0; i < 70; i += 1) {
        const angle = (Math.PI / 180) * (side < 0.5 ? -55 : -125);
        const speed = 9 + Math.random() * 9;
        pieces.push({
          x: w * side,
          y: h * 0.72,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
          vy: Math.sin(angle) * speed - Math.random() * 4,
          size: 5 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          spin: (Math.random() - 0.5) * 0.3,
          angle: Math.random() * Math.PI,
        });
      }
    });

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const passed = now - start;
      ctx.clearRect(0, 0, w, h);

      pieces.forEach((p) => {
        p.vy += 0.28;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        // К концу залпа плавно растворяемся
        ctx.globalAlpha = Math.max(0, 1 - passed / duration);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (passed < duration) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire, duration]);

  if (!fire) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[95]"
    />
  );
};

export default Confetti;
