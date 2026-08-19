import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useCatalog } from "@/context/CatalogContext";

/**
 * Направления ассортимента под слоганом.
 *
 * Кнопки не листаются и не переносятся на вторую строку: видимые помещаются
 * в один ряд, а всё остальное прячется за кнопкой «Что ещё есть» — она
 * всегда на месте и никогда не обрезается. По клику раскрывается панель
 * со всеми остальными категориями каталога.
 */
const HeroShortcuts = () => {
  const navigate = useNavigate();
  const { shortcuts, shortcutsHidden, categories } = useCatalog();
  const [open, setOpen] = useState(false);
  const [fits, setFits] = useState(shortcuts.length);
  const box = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);

  /**
   * Считаем, сколько кнопок влезает в одну строку. Меряем скрытой копией
   * полного ряда: видимый ряд обрезаем по этому числу, остальное уходит
   * под «Что ещё есть». Так ничего не переносится и не обрезается.
   */
  useEffect(() => {
    const measure = () => {
      const el = row.current;
      if (!el) return;
      const limit = el.clientWidth;
      const items = Array.from(el.children) as HTMLElement[];
      // Последний элемент — кнопка «Что ещё есть», ей всегда нужно место
      const more = items[items.length - 1];
      const reserve = more ? more.offsetWidth + 8 : 0;
      let used = 0;
      let n = 0;
      for (const item of items.slice(0, -1)) {
        const next = used + item.offsetWidth + (n ? 8 : 0);
        if (next + reserve > limit) break;
        used = next;
        n += 1;
      }
      setFits(Math.max(1, n));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [shortcuts.length, categories.length]);

  /* Клик мимо панели и Esc закрывают её */
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (shortcutsHidden || !shortcuts.length) return null;

  const go = (category: string, label: string) => {
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(category || label)}`);
  };

  const visible = shortcuts.slice(0, fits);
  const hiddenChips = shortcuts.slice(fits);

  /* В панель попадает всё, что не поместилось, плюс остальные категории */
  const shown = new Set(visible.map((s) => s.category).filter(Boolean));
  const rest = [
    ...hiddenChips.map((s) => ({ label: s.label, category: s.category })),
    ...categories
      .filter((c) => !shown.has(c) && !hiddenChips.some((h) => h.category === c))
      .map((c) => ({ label: c, category: c })),
  ];

  const chipClass = (filled: boolean) =>
    `flex flex-none items-center gap-2 whitespace-nowrap border px-3.5 py-2.5 text-[0.78rem] transition-colors ${
      filled
        ? "border-foreground bg-foreground text-background hover:border-primary hover:bg-primary hover:text-primary-foreground"
        : "border-border bg-surface hover:border-primary hover:text-primary"
    }`;

  return (
    <div
      ref={box}
      className="rise relative hidden pb-7 md:block"
      style={{ animationDelay: ".35s" }}
    >
      {/* Мерная копия полного ряда — невидима, нужна только для расчёта */}
      <div
        ref={row}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex h-0 gap-2 overflow-hidden opacity-0"
      >
        {shortcuts.map((s, i) => (
          <span key={`m-${i}`} className={chipClass(!s.category)}>
            <Icon name={s.icon} size={16} className="flex-none" />
            {s.label}
          </span>
        ))}
        <span className={chipClass(false)}>
          Что ещё есть
          <Icon name="ChevronDown" size={15} className="flex-none" />
        </span>
      </div>

      <div className="flex items-center gap-2">
        {visible.map((s, i) => (
          <button
            key={`${s.label}-${i}`}
            onClick={() => go(s.category, s.label)}
            className={chipClass(!s.category)}
          >
            {/^(https?:)?\//.test(s.icon) ? (
              <img
                src={s.icon}
                alt=""
                className="h-4 w-4 flex-none object-contain"
              />
            ) : (
              <Icon name={s.icon} size={16} className="flex-none" />
            )}
            {s.label}
          </button>
        ))}

        {rest.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`flex flex-none items-center gap-2 whitespace-nowrap border px-3.5 py-2.5 text-[0.78rem] transition-colors ${
              open
                ? "border-primary bg-primary text-primary-foreground"
                : "border-dashed border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            Что ещё есть
            <Icon
              name={open ? "ChevronUp" : "ChevronDown"}
              size={15}
              className="flex-none"
            />
          </button>
        )}
      </div>

      {open && rest.length > 0 && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(34rem,80vw)] border border-foreground bg-surface p-3 shadow-lg">
          <div className="mb-2 px-1 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
            Остальные разделы каталога
          </div>
          <div className="flex flex-wrap gap-2">
            {rest.map((r) => (
              <button
                key={r.label}
                onClick={() => go(r.category, r.label)}
                className="border border-border bg-background px-3 py-2 text-left text-[0.78rem] transition-colors hover:border-primary hover:text-primary"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroShortcuts;