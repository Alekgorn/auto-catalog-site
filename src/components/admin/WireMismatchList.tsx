import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { WireMismatch } from '@/lib/kit-audit';

interface Props {
  rows: WireMismatch[];
  onSaved?: () => void;
  /** Обновить проводки на месте — дешевле полного перезапроса каталога */
  onPatch?: (u: { id?: number; frameWires: string[] }[]) => void;
  onEdit?: (p: AdminProduct) => void;
}

/** Машины строкой: «Dodge 330, Dodge 440, Jeep Cherokee…» */
const carsText = (cars: { brand: string; model: string }[], max = 8) => {
  const head = cars.slice(0, max).map((c) => `${c.brand} ${c.model}`);
  const rest = cars.length - head.length;
  return head.join(', ') + (rest > 0 ? ` и ещё ${rest}` : '');
};

/**
 * Проводки, привязанные к рамке мимо её машин.
 *
 * Рамка часто общая на несколько моделей. Если к ней прицепить проводку,
 * подходящую лишь к части из них, покупатель по остальным машинам получит
 * в подборе деталь, которая ему не встанет. Здесь такие связи собраны в
 * один список: видно, каким именно машинам проводка не подходит, и можно
 * сразу снять связь.
 */
const WireMismatchList = ({ rows, onSaved, onPatch, onEdit }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState('');
  const [onlyTotal, setOnlyTotal] = useState(false);

  const shown = onlyTotal ? rows.filter((r) => r.total) : rows;

  /** Убираем проводку у рамки — остальные её связи не трогаем */
  const unlink = async (row: WireMismatch) => {
    const id = row.frame.id;
    if (!id) return;

    const key = `${id}|${row.wire.slug}`;
    setBusy(key);

    const next = (row.frame.frameWires ?? []).filter((s) => s !== row.wire.slug);
    const res = await adminFetch('?action=bulk', {
      method: 'POST',
      body: JSON.stringify({
        op: 'frame-wires-each',
        updates: [{ id, frameWires: next }],
      }),
    });

    setBusy('');
    if (!res.ok) {
      toast({ title: 'Не сохранилось', variant: 'destructive' });
      return;
    }
    toast({ title: 'Связь убрана', description: row.wire.name });

    // Связь уже снята на сервере — каталог ради этого не перекачиваем
    if (onPatch) onPatch([{ id, frameWires: next }]);
    else onSaved?.();
  };

  if (!rows.length) {
    return (
      <div className="mt-6 border-t border-border pt-10 text-center">
        <Icon
          name="CircleCheck"
          size={26}
          className="mx-auto text-muted-foreground"
        />
        <p className="mt-3 text-[0.9rem] text-muted-foreground">
          Все проводки привязаны к своим машинам.
        </p>
      </div>
    );
  }

  const totalCount = rows.filter((r) => r.total).length;

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[46em] text-[0.85rem] leading-relaxed text-muted-foreground">
          Рамка общая на несколько машин, а проводка подходит не всем из
          них. По этим машинам в подборе покажется деталь, которая не
          встанет. Либо снимите связь, либо допишите машины в совместимость
          проводки.
        </p>
        {totalCount > 0 && (
          <button
            onClick={() => setOnlyTotal((v) => !v)}
            className="flex flex-none items-center gap-2 border border-border px-3 py-2 text-[0.72rem] uppercase tracking-[0.08em] transition-colors hover:border-foreground"
          >
            <Icon name={onlyTotal ? 'SquareCheck' : 'Square'} size={14} />
            Только полный промах ({totalCount})
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {shown.map((r) => {
          const key = `${r.frame.id}|${r.wire.slug}`;
          return (
            <div key={key} className="border border-border p-3">
              <div className="flex flex-wrap items-start gap-3">
                <span
                  className={`flex-none px-2 py-1 text-[0.65rem] uppercase tracking-[0.08em] ${
                    r.total
                      ? 'bg-destructive text-destructive-foreground'
                      : 'border border-primary text-primary'
                  }`}
                >
                  {r.total ? 'не подходит вовсе' : `мимо ${r.missing.length}`}
                </span>

                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => onEdit?.(r.frame)}
                    className="block text-left text-[0.87rem] font-medium leading-snug transition-colors hover:text-primary"
                  >
                    {r.frame.name}
                  </button>

                  <div className="mt-1 flex items-center gap-1.5 text-[0.8rem] text-muted-foreground">
                    <Icon name="CornerDownRight" size={13} className="flex-none" />
                    <button
                      onClick={() => onEdit?.(r.wire)}
                      className="text-left transition-colors hover:text-primary"
                    >
                      {r.wire.name}
                    </button>
                  </div>

                  <p className="mt-1.5 text-[0.78rem] leading-snug text-muted-foreground">
                    {r.yearsOnly ? (
                      <>
                        Машины совпадают, но годы расходятся: рамка{' '}
                        {r.frame.yearFrom || '…'}–{r.frame.yearTo || '…'},
                        проводка {r.wire.yearFrom || '…'}–
                        {r.wire.yearTo || '…'}
                      </>
                    ) : (
                      <>
                        Не подходит к: {carsText(r.missing)}
                        {r.covered > 0 && (
                          <span className="text-success">
                            {' '}
                            · закрывает {r.covered}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                <button
                  disabled={busy === key}
                  onClick={() => unlink(r)}
                  className="flex flex-none items-center gap-1.5 border border-border px-3 py-2 text-[0.7rem] uppercase tracking-[0.08em] transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
                >
                  <Icon name="Unlink" size={13} />
                  Убрать связь
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WireMismatchList;
