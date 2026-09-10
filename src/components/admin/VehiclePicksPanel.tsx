import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';

interface PickRow {
  id: number;
  brand: string;
  model: string;
  year: number;
  /** Где выбирали: главная, сценарий, каталог */
  place: string;
  scenario: string;
  hits: number;
  firstAt: string | null;
  lastAt: string | null;
}

const PLACES: { id: string; label: string }[] = [
  { id: '', label: 'Везде' },
  { id: 'home', label: 'Главная' },
  { id: 'scenario', label: 'Сценарии' },
  { id: 'catalog', label: 'Каталог' },
];

const PLACE_TITLES: Record<string, string> = {
  home: 'Главная',
  scenario: 'Сценарий',
  catalog: 'Каталог',
  search: 'Поиск',
};

const fmtDate = (iso: string | null): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

/**
 * Что люди выбирают в подборе по машине.
 *
 * Записываем только доведённый до конца выбор — марка, модель и год.
 * Промежуточные шаги не считаем: на каждое движение в выпадающем списке
 * уходил бы вызов функции, а это тысячи обращений в сутки на ровном месте.
 *
 * Копим счётчиком, а не событиями: одна строка на машину и место выбора.
 * Поэтому список остаётся коротким даже через годы, а вопрос «какие авто
 * ищут чаще» — это обычная сортировка по числу.
 *
 * Данные начинают копиться с момента запуска: раньше выборы нигде не
 * сохранялись, и восстановить прошлое неоткуда.
 */
const VehiclePicksPanel = () => {
  const [rows, setRows] = useState<PickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState('');
  /** Свернуть до марок — когда моделей уже много и нужен общий срез */
  const [byBrand, setByBrand] = useState(false);

  useEffect(() => {
    adminFetch('?action=vehicle-picks')
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d.items) ? d.items : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(
    () => (place ? rows.filter((r) => r.place === place) : rows),
    [rows, place],
  );

  /** Сводка по маркам: сколько раз выбирали марку целиком */
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    list.forEach((r) => map.set(r.brand, (map.get(r.brand) ?? 0) + r.hits));
    return [...map.entries()]
      .map(([name, hits]) => ({ name, hits }))
      .sort((a, b) => b.hits - a.hits);
  }, [list]);

  const total = useMemo(
    () => list.reduce((s, r) => s + r.hits, 0),
    [list],
  );

  const placeCount = (id: string) =>
    (id ? rows.filter((r) => r.place === id) : rows).reduce(
      (s, r) => s + r.hits,
      0,
    );

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Загружаем…
      </div>
    );
  }

  return (
    <div className="py-6">
      <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
        Какие машины выбирают в подборе — на главной, внутри сценариев и в
        каталоге. Считается только доведённый до конца выбор: марка, модель
        и год. Повторы копятся в счётчик, поэтому сверху то, что ищут чаще.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 border border-border p-6">
          <div className="flex items-center gap-3">
            <Icon name="ChartNoAxesColumn" fallback="Info" size={18} className="text-primary" />
            <span className="font-head text-[1rem] font-medium">
              Пока пусто — данные начали копиться только что
            </span>
          </div>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted-foreground">
            Раньше выборы нигде не сохранялись, поэтому за прошлые месяцы
            показать нечего. Первые записи появятся, как только посетители
            начнут подбирать по машине.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="font-head text-[1.5rem] font-bold leading-none">
              {total}
            </span>
            <span className="text-[0.85rem] text-muted-foreground">
              подборов, разных машин {list.length}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
            <div className="flex flex-wrap gap-x-7 gap-y-2">
              {PLACES.map((p) => (
                <button
                  key={p.id || 'all'}
                  onClick={() => setPlace(p.id)}
                  className={`border-b-2 pb-1.5 text-[0.78rem] uppercase tracking-[0.08em] transition-colors ${
                    place === p.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label} ({placeCount(p.id)})
                </button>
              ))}
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={byBrand}
                onChange={(e) => setByBrand(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[0.82rem] text-muted-foreground">
                Свернуть до марок
              </span>
            </label>
          </div>

          {byBrand ? (
            <div className="mt-2">
              {brands.map((b) => (
                <div
                  key={b.name}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3"
                >
                  <span className="font-head text-[0.95rem] font-medium">
                    {b.name}
                  </span>
                  <span className="font-head text-[1rem] font-bold">
                    {b.hits}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2">
              {list.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[0.9rem]">
                      {r.brand} {r.model}
                      {r.year ? ` ${r.year}` : ''}
                    </span>
                    <div className="mt-0.5 text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
                      {PLACE_TITLES[r.place] ?? r.place}
                      {r.scenario ? ` · ${r.scenario}` : ''}
                      {r.lastAt ? ` · ${fmtDate(r.lastAt)}` : ''}
                    </div>
                  </div>
                  <span className="font-head text-[1rem] font-bold">
                    {r.hits}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VehiclePicksPanel;
