import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { frameGroups } from '@/lib/frame-wiring';
import { suggestAll, FrameSuggestion, WireSuggestion } from '@/lib/wire-suggest';
import { formatPrice } from '@/data/catalog';

interface Props {
  products: AdminProduct[];
  onReload?: () => void;
  onEdit?: (p: AdminProduct) => void;
}

/**
 * Подсказки связок «рамка — проводка».
 *
 * Проводка проставлена малой части рамок — остальные покупатель видит
 * без неё. Машина находит кандидатов по марке, названной модели и
 * пересечению годов, человек подтверждает нажатием. Автоматически ничего
 * не связывается: у рамки и проводки годы честно могут расходиться, и
 * решать это должен тот, кто знает товар.
 */
const WireSuggestPanel = ({ products, onReload, onEdit }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [onlySure, setOnlySure] = useState(true);
  const [busy, setBusy] = useState('');
  /** Что уже привязали в этом заходе — прячем, не дожидаясь перезагрузки */
  const [done, setDone] = useState<string[]>([]);

  const groups = useMemo(() => frameGroups(products), [products]);
  const all = useMemo(() => suggestAll(products, groups), [products, groups]);

  /** Однозначные: один кандидат и он без оговорок */
  const isSure = (s: FrameSuggestion) =>
    s.candidates.length === 1 &&
    s.candidates[0].level === 'sure' &&
    !s.candidates[0].warn;

  const sureCount = all.filter(isSure).length;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((s) => {
      if (done.includes(s.group.key)) return false;
      if (onlySure && !isSure(s)) return false;
      if (!q) return true;
      return `${s.group.brand} ${s.group.model}`.toLowerCase().includes(q);
    });
  }, [all, search, onlySure, done]);

  /** Ставим проводку всей группе рамок разом */
  const attach = async (s: FrameSuggestion, wire: AdminProduct) => {
    setBusy(s.group.key);
    const slugs = [...new Set([...s.group.wires, wire.slug].filter(Boolean))];
    const res = await adminFetch('?action=bulk', {
      method: 'POST',
      body: JSON.stringify({
        op: 'frame-wires',
        ids: s.group.frames.map((f) => f.id).filter(Boolean),
        frameWires: slugs,
      }),
    });
    setBusy('');
    if (!res.ok) {
      toast({ title: 'Не сохранилось', variant: 'destructive' });
      return;
    }
    setDone((prev) => [...prev, s.group.key]);
    toast({
      title: 'Привязано',
      description: `${s.group.brand} ${s.group.model} ${s.group.from}–${s.group.to}: проводка на ${s.group.frames.length} ${
        s.group.frames.length === 1 ? 'рамку' : 'рамок'
      }.`,
    });
    onReload?.();
  };

  return (
    <div className="py-6">
      <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
        Машина ищет проводки, у которых совпала марка, модель названа прямо
        в тексте товара и годы пересекаются с рамкой. Решение за вами:
        нажмите «Привязать» у подходящей. Проводка встанет сразу всем рамкам
        этого периода — 9", 10" и 12,3" под одну панель.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-border py-3">
        <div className="text-[0.85rem]">
          Найдено предложений:{' '}
          <span className="font-head font-bold">{all.length}</span>
          <span className="ml-3 text-muted-foreground">
            однозначных — {sureCount}
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Марка или модель"
          className="w-full max-w-xs border-b border-border bg-transparent py-1.5 text-sm outline-none transition-colors focus:border-primary"
        />
        <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] text-muted-foreground">
          <input
            type="checkbox"
            checked={onlySure}
            onChange={(e) => setOnlySure(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Только однозначные
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 border border-border py-12 text-center">
          <Icon name="CircleCheck" size={24} className="mx-auto text-success" />
          <div className="mt-2 text-[0.87rem] text-muted-foreground">
            {onlySure && all.length > 0
              ? 'Однозначных предложений не осталось — снимите галочку, чтобы увидеть остальные'
              : 'Предложений нет — либо всё размечено, либо подходящих проводок не нашлось'}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.slice(0, 150).map((s) => (
            <div key={s.group.key} className="border border-border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-head text-[1rem] font-bold uppercase tracking-tight">
                  {s.group.brand} {s.group.model}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {s.group.from}–{s.group.to}
                  </span>
                </div>
                <div className="text-[0.78rem] text-muted-foreground">
                  {s.group.frames.length}{' '}
                  {s.group.frames.length === 1 ? 'рамка' : 'рамок'} в группе
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {s.candidates.map((c) => (
                  <CandidateRow
                    key={c.wire.slug}
                    candidate={c}
                    busy={busy === s.group.key}
                    onAttach={() => attach(s, c.wire)}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </div>
          ))}
          {shown.length > 150 && (
            <div className="py-4 text-center text-[0.8rem] text-muted-foreground">
              Показаны первые 150 из {shown.length}. Уточните поиск.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Одна проводка-кандидат с пояснением и кнопкой */
const CandidateRow = ({
  candidate,
  busy,
  onAttach,
  onEdit,
}: {
  candidate: WireSuggestion;
  busy: boolean;
  onAttach: () => void;
  onEdit?: (p: AdminProduct) => void;
}) => {
  const { wire, level, warn } = candidate;

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border p-3 ${
        level === 'doubt' ? 'border-destructive/40 bg-destructive/5' : 'border-border'
      }`}
    >
      <div className="min-w-0 flex-1">
        <button
          onClick={() => onEdit?.(wire)}
          className="block max-w-full truncate text-left text-[0.87rem] transition-colors hover:text-primary"
        >
          {wire.name}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] text-muted-foreground">
          <span>
            {wire.yearFrom}–{wire.yearTo}
          </span>
          <span>{formatPrice(wire.price)}</span>
          {warn && (
            <span
              className={
                level === 'doubt' ? 'text-destructive' : 'text-muted-foreground'
              }
            >
              <Icon
                name="TriangleAlert"
                size={12}
                className="mr-1 inline align-[-1px]"
              />
              {warn}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onAttach}
        disabled={busy}
        className="flex flex-none items-center gap-2 border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
      >
        <Icon name={busy ? 'Loader' : 'Link'} size={14} />
        Привязать
      </button>
    </div>
  );
};

export default WireSuggestPanel;
