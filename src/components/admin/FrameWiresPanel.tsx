import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { FrameGroup, frameGroups, wireCandidates } from '@/lib/frame-wiring';
import { formatPrice } from '@/data/catalog';

interface Props {
  products: AdminProduct[];
  /** Перечитать каталог после сохранения */
  onReload?: () => void;
}

/**
 * Разметка: какие проводки подходят к рамке.
 *
 * Покупатель выбирает рамку первой — и тем самым уже говорит, какая у
 * него машина, каких годов и с какой панелью. Значит проводки логично
 * вешать прямо на рамку, без промежуточных таблиц с годами.
 *
 * Размечаем группами: на Kia Rio 2017–2019 идёт четыре рамки (9", 10",
 * с кнопкой и без), панель у них общая — и проводка одна и та же.
 */
const FrameWiresPanel = ({ products, onReload }: Props) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => frameGroups(products), [products]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (onlyEmpty && g.wires.length && !g.mixed) return false;
      if (!q) return true;
      return `${g.brand} ${g.model}`.toLowerCase().includes(q);
    });
  }, [groups, search, onlyEmpty]);

  const done = groups.filter((g) => g.wires.length && !g.mixed).length;

  /** Ставим проводки всей группе разом — одним запросом на все рамки */
  const save = async (group: FrameGroup, slugs: string[]) => {
    setBusy(true);
    const res = await adminFetch('?action=bulk', {
      method: 'POST',
      body: JSON.stringify({
        op: 'frame-wires',
        ids: group.frames.map((f) => f.id).filter(Boolean),
        frameWires: slugs,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Не сохранилось', variant: 'destructive' });
      return;
    }
    onReload?.();
    toast({
      title: 'Сохранено',
      description: `${group.brand} ${group.model} ${group.from}–${group.to}: ${
        slugs.length
      } ${slugs.length === 1 ? 'проводка' : 'проводки'} на ${
        group.frames.length
      } рамок.`,
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-[46em] text-[0.87rem] leading-relaxed text-muted-foreground">
          Покупатель выбирает рамку первой — и тем самым говорит, какая у
          него машина и каких годов. Отметьте, какие проводки к ней подходят,
          и подбор станет точным. Рамки одного периода размечаются разом:
          9", 10" и 12,3" под одну панель, проводка у них общая.
        </p>
        <div className="text-[0.78rem] text-muted-foreground">
          Размечено {done} из {groups.length}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Марка или модель"
          className="w-full max-w-xs border-b border-border bg-transparent py-2 text-sm outline-none transition-colors focus:border-primary"
        />
        <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyEmpty}
            onChange={(e) => setOnlyEmpty(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Только неразмеченные
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 border border-border py-12 text-center">
          <Icon
            name="CircleCheck"
            size={24}
            className="mx-auto text-success"
          />
          <div className="mt-2 text-[0.87rem] text-muted-foreground">
            Здесь пусто — значит всё размечено
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {shown.slice(0, 300).map((g) => (
            <GroupRow
              key={g.key}
              group={g}
              products={products}
              isOpen={open === g.key}
              busy={busy}
              onToggle={() => setOpen(open === g.key ? null : g.key)}
              onSave={(slugs) => save(g, slugs)}
            />
          ))}
          {shown.length > 300 && (
            <div className="py-4 text-center text-[0.8rem] text-muted-foreground">
              Показаны первые 300 из {shown.length}. Уточните поиск.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Одна группа рамок: фото, годы и выбор проводок */
const GroupRow = ({
  group,
  products,
  isOpen,
  busy,
  onToggle,
  onSave,
}: {
  group: FrameGroup;
  products: AdminProduct[];
  isOpen: boolean;
  busy: boolean;
  onToggle: () => void;
  onSave: (slugs: string[]) => void;
}) => {
  const [picked, setPicked] = useState<string[]>(group.wires);
  const candidates = useMemo(
    () => (isOpen ? wireCandidates(products, group) : []),
    [isOpen, products, group],
  );

  const toggle = (slug: string) =>
    setPicked((p) =>
      p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug],
    );

  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:text-primary"
      >
        <Icon
          name={isOpen ? 'ChevronDown' : 'ChevronRight'}
          size={14}
          className="shrink-0 text-muted-foreground"
        />
        {/* Фото рамок: разницу между периодами видно за секунду */}
        <span className="flex shrink-0 gap-1">
          {group.frames.slice(0, 3).map((f) => (
            <img
              key={f.id}
              src={f.images?.[0] ?? ''}
              alt=""
              loading="lazy"
              className="h-11 w-11 border border-border bg-card object-contain p-0.5"
            />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            {group.brand} {group.model}
            <span className="ml-2 text-muted-foreground">
              {group.from}–{group.to || '…'}
            </span>
          </span>
          <span className="mt-0.5 block text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
            {group.frames.length} рамок ·{' '}
            {group.mixed ? (
              <span className="text-primary">проводки разные — сведите</span>
            ) : group.wires.length ? (
              <span className="text-success">
                {group.wires.length} проводок
              </span>
            ) : (
              'проводки не выбраны'
            )}
          </span>
        </span>
      </button>

      {isOpen && (
        <div className="pb-4 pl-8">
          {candidates.length === 0 ? (
            <p className="text-[0.82rem] text-muted-foreground">
              Под эту машину и годы проводок в каталоге нет. Проверьте
              совместимость проводки — возможно, там не указана эта модель.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                {candidates.map((w) => (
                  <label
                    key={w.slug ?? w.id}
                    className="flex cursor-pointer items-center gap-3 border border-border p-2 transition-colors hover:border-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={picked.includes(w.slug ?? '')}
                      onChange={() => toggle(w.slug ?? '')}
                      className="h-4 w-4 flex-none accent-primary"
                    />
                    <img
                      src={w.images?.[0] ?? ''}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 flex-none bg-card object-contain"
                    />
                    <span className="min-w-0 flex-1 text-[0.82rem] leading-snug">
                      {w.name}
                      <span className="mt-0.5 block text-[0.72rem] text-muted-foreground">
                        {w.yearFrom || '…'}–{w.yearTo || '…'} ·{' '}
                        {formatPrice(w.price)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                disabled={busy}
                onClick={() => onSave(picked)}
                className="mt-3 flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-[0.72rem] uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                <Icon name="Check" size={14} />
                Сохранить всем {group.frames.length} рамкам
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FrameWiresPanel;
