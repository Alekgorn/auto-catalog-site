import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import {
  FLAG_HINTS,
  FLAG_TITLES,
  Flag,
  CheckRow,
  checkVehicle,
} from '@/lib/vehicle-check';
import { IssueMute, loadMutes, muteId, saveMutes } from '@/lib/issue-mutes';

interface Props {
  products: AdminProduct[];
  brands: AdminBrand[];
  onEdit: (product: AdminProduct) => void;
}

const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';

/**
 * Проверка подбора по конкретной машине.
 *
 * Покупатель жалуется «мне выдало не то» — и до сих пор проверить это
 * можно было только руками, проходя по сайту как посетитель. Здесь то
 * же самое за один ввод: марка, модель, год — и сразу видно, что
 * попадёт в подбор и какие карточки выглядят подозрительно.
 *
 * Флаги не приговор: товар без разметки может быть новым, а «вся марка»
 * иногда стоит намеренно. Проверка только сужает поиск.
 */
const VehicleCheckPanel = ({ products, brands, onEdit }: Props) => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear() - 5);
  const [onlyIssues, setOnlyIssues] = useState(true);
  /* Пропущенные общие для всей проверки данных — тот же список, что и
     в «Найденных проблемах»: товар, признанный нормой, незачем
     разбирать заново в каждой панели */
  const [mutes, setMutes] = useState<IssueMute[]>([]);
  const [showMuted, setShowMuted] = useState(false);

  useEffect(() => {
    loadMutes().then(setMutes);
  }, []);

  const mutedIds = useMemo(() => new Set(mutes.map((m) => m.id)), [mutes]);

  /* Отпечаток берём по товару целиком, а не по каждому флагу: у одной
     карточки их бывает несколько, и снимать замечания поштучно —
     занятие на весь вечер */
  const rowId = (r: CheckRow) => muteId('vehicle-check', r.product.name);

  const toggleMute = (r: CheckRow) => {
    const id = rowId(r);
    const next = mutedIds.has(id)
      ? mutes.filter((m) => m.id !== id)
      : [...mutes, { id, at: Date.now() }];
    setMutes(next);
    saveMutes(next);
  };

  const models = useMemo(
    () => brands.find((b) => b.name === brand)?.models ?? [],
    [brands, brand],
  );

  const result = useMemo(
    () =>
      brand && model
        ? checkVehicle(products, { brand, model, year })
        : null,
    [products, brand, model, year],
  );

  const list = (rows: CheckRow[]) => {
    const base = onlyIssues ? rows.filter((r) => r.flags.length) : rows;
    return base.filter((r) => mutedIds.has(rowId(r)) === showMuted);
  };

  /** Какие флаги встретились — под списком объясняем каждый */
  const seen = useMemo(() => {
    const set = new Set<Flag>();
    [...(result?.wires ?? []), ...(result?.frames ?? [])].forEach((r) =>
      r.flags.forEach((f) => set.add(f)),
    );
    return [...set];
  }, [result]);

  const block = (title: string, rows: CheckRow[]) => {
    const shown = list(rows);
    return (
      <div className="mt-7">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="font-head text-[0.95rem] font-bold uppercase tracking-tight">
            {title}
          </h3>
          <span className="text-[0.8rem] text-muted-foreground">
            подходит {rows.length}, с замечаниями{' '}
            {rows.filter((r) => r.flags.length).length}
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="mt-2 text-[0.85rem] text-muted-foreground">
            {rows.length
              ? 'Замечаний нет — всё, что подходит, размечено.'
              : 'Ничего не подходит этой машине.'}
          </p>
        ) : (
          <div className="mt-3 border-t border-border">
            {shown.map((r) => (
              <div
                key={r.product.id}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[0.88rem] leading-snug">
                    {r.product.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {r.flags.map((f) => (
                      <span
                        key={f}
                        className="bg-primary/10 px-1.5 py-0.5 text-[0.7rem] font-medium text-primary"
                      >
                        {FLAG_TITLES[f]}
                      </span>
                    ))}
                    {!r.flags.length && (
                      <span className="text-[0.75rem] text-muted-foreground">
                        Замечаний нет
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <button
                    onClick={() => toggleMute(r)}
                    title={
                      showMuted
                        ? 'Вернуть в общий список'
                        : 'Здесь всё верно — убрать из списка'
                    }
                    className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-head text-[0.7rem] font-bold uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name={showMuted ? 'Undo2' : 'BellOff'} size={13} />
                    {showMuted ? 'Вернуть' : 'Пропустить'}
                  </button>
                  <button
                    onClick={() => onEdit(r.product)}
                    className="flex items-center gap-1.5 border border-foreground px-3 py-1.5 font-head text-[0.7rem] font-bold uppercase tracking-[0.06em] transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name="Pencil" size={13} />
                    Открыть
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
        Введите машину, на которую жалуется покупатель, — покажу, что
        попадёт в подбор рамки и проводки и какие карточки выглядят
        подозрительно. Замечание не значит ошибку: решаете вы, каталог
        знаете вы.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
            Марка
          </span>
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setModel('');
            }}
            className={`${field} cursor-pointer`}
          >
            <option value="">— выберите —</option>
            {brands.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
            Модель
          </span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!brand}
            className={`${field} cursor-pointer disabled:opacity-50`}
          >
            <option value="">— выберите —</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
            Год выпуска
          </span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={field}
          />
        </label>
      </div>

      {result && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={onlyIssues}
                onChange={(e) => setOnlyIssues(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[0.82rem] text-muted-foreground">
                Только с замечаниями ({result.issues})
              </span>
            </label>

            <button
              onClick={() => setShowMuted((v) => !v)}
              className={`flex items-center gap-1.5 border px-3 py-1.5 text-[0.75rem] transition-colors ${
                showMuted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="BellOff" size={13} />
              Пропущенные
            </button>
          </div>

          {block('Проводка', result.wires)}
          {block('Переходные рамки', result.frames)}

          {seen.length > 0 && (
            <div className="mt-8 border-t border-foreground pt-5">
              <div className="text-[0.7rem] uppercase tracking-[0.1em] text-muted-foreground">
                Что означают замечания
              </div>
              <dl className="mt-3 space-y-3">
                {seen.map((f) => (
                  <div key={f}>
                    <dt className="text-[0.85rem] font-medium">
                      {FLAG_TITLES[f]}
                    </dt>
                    <dd className="mt-0.5 max-w-[46em] text-[0.82rem] leading-snug text-muted-foreground">
                      {FLAG_HINTS[f]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VehicleCheckPanel;
