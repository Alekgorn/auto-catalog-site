import Icon from '@/components/ui/icon';
import { HeroHotspot, HOTSPOT_SLOTS } from '@/lib/site-settings';

interface Props {
  value: HeroHotspot[];
  onChange: (list: HeroHotspot[]) => void;
}

const input =
  'w-full border-b border-border bg-transparent py-2 text-[0.9rem] outline-none transition-colors focus:border-primary';

/**
 * Подписи и ссылки активных точек на схеме автомобиля в первом экране.
 * Места на схеме фиксированы, меняются только текст и адрес перехода.
 */
const HotspotsEditor = ({ value, onChange }: Props) => {
  const at = (key: string) =>
    value.find((h) => h.key === key) ?? { key, label: '', href: '' };

  const setAt = (key: string, patch: Partial<HeroHotspot>) => {
    const exists = value.some((h) => h.key === key);
    onChange(
      exists
        ? value.map((h) => (h.key === key ? { ...h, ...patch } : h))
        : [...value, { ...at(key), ...patch }],
    );
  };

  return (
    <div>
      <div className="eyebrow">Схема автомобиля</div>
      <h3 className="mt-3 font-head text-xl font-bold uppercase tracking-tight">
        Активные точки на машине
      </h3>
      <p className="mt-3 max-w-[40em] text-muted-foreground">
        Подписи на схеме в первом экране — кликабельные. Укажите текст и адрес,
        куда ведёт каждая. Адрес можно взять любой: раздел сайта вида
        <span className="text-foreground"> /search?q=Парктроники</span> или
        полную ссылку на другой сайт. Пустой адрес — точка станет обычной
        подписью без перехода.
      </p>

      <div className="mt-6 space-y-4">
        {HOTSPOT_SLOTS.map((slot) => {
          const h = at(slot.key);
          return (
            <div key={slot.key} className="border border-border p-4">
              <div className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                <Icon name="MapPin" size={14} className="flex-none" />
                {slot.title}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="eyebrow">Подпись на схеме</span>
                  <input
                    value={h.label}
                    placeholder="Android-магнитола"
                    onChange={(e) => setAt(slot.key, { label: e.target.value })}
                    className={input}
                  />
                </label>

                <label className="block">
                  <span className="eyebrow">Ссылка</span>
                  <input
                    value={h.href}
                    placeholder="/search?q=Парктроники"
                    onChange={(e) => setAt(slot.key, { href: e.target.value })}
                    className={input}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotspotsEditor;
