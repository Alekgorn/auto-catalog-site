import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface MissingFitRow {
  id: number;
  brand: string;
  model: string;
  year: number;
  scenario: string;
  contact: string;
  /** Сколько раз эту машину искали */
  hits: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Props {
  /** Сообщить наверх, сколько записей — для счётчика на вкладке */
  onCount?: (n: number) => void;
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

/**
 * Машины, под которые не удалось собрать комплект.
 *
 * Записывается каждый показ заглушки, а не только оставленные заявки:
 * так видно реальный спрос — какие авто вообще выбирают люди, даже если
 * ушли молча. Повторные заходы копятся в счётчик, поэтому наверху списка
 * оказывается то, чего не хватает чаще всего.
 */
const MissingFitPanel = ({ onCount }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<MissingFitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyContacts, setOnlyContacts] = useState(false);

  const load = () => {
    setLoading(true);
    adminFetch('?action=missing-fit')
      .then((r) => r.json())
      .then((d) => {
        const list = (d.items ?? []) as MissingFitRow[];
        setRows(list);
        onCount?.(list.length);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (row: MissingFitRow) => {
    const res = await adminFetch(`?action=missing-fit&id=${row.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить запись' });
      return;
    }
    setRows((list) => {
      const next = list.filter((r) => r.id !== row.id);
      onCount?.(next.length);
      return next;
    });
    toast({ title: `${row.brand} ${row.model} — запись удалена` });
  };

  const waiting = rows.filter((r) => r.contact).length;
  const visible = onlyContacts ? rows.filter((r) => r.contact) : rows;

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <p className="max-w-[44em] text-muted-foreground lg:col-span-7">
          Машины, под которые не нашлось переходной рамки — комплект собрать не
          удалось. Записывается каждый заход, даже если человек ничего не
          оставил: так видно, какие авто ищут чаще всего. Наверху — самые
          частые запросы.
        </p>

        <div className="lg:col-span-4 lg:col-start-9">
          <div className="border border-border p-5">
            <div className="flex items-baseline gap-2">
              <span className="font-head text-[2rem] font-bold leading-none">
                {rows.length}
              </span>
              <span className="text-[0.85rem] text-muted-foreground">
                {rows.length === 1 ? 'машина' : 'машин'} без решения
              </span>
            </div>
            {waiting > 0 && (
              <p className="mt-2 text-[0.85rem] text-primary">
                Из них {waiting} ждут ответа — оставили контакт
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setOnlyContacts((v) => !v)}
          className={`flex items-center gap-2 border px-4 py-2.5 text-[0.78rem] uppercase tracking-[0.08em] transition-colors ${
            onlyContacts
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
          }`}
        >
          <Icon name="Bell" size={15} />
          Только с контактом
        </button>
        <button
          onClick={load}
          className="flex items-center gap-2 border border-border px-4 py-2.5 text-[0.78rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <Icon name="RotateCcw" size={15} />
          Обновить
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Загружаем…</div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center">
          <Icon
            name="CircleCheck"
            size={36}
            className="mx-auto text-muted-foreground"
          />
          <div className="mt-4 font-head text-lg font-bold uppercase">
            {onlyContacts ? 'Никто не ждёт ответа' : 'Пока пусто'}
          </div>
          <p className="mx-auto mt-2 max-w-[32em] text-[0.88rem] text-muted-foreground">
            {onlyContacts
              ? 'Контакты оставляют не все — снимите фильтр, чтобы увидеть все машины.'
              : 'Здесь появятся машины, для которых не нашлось переходной рамки.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 border-t border-foreground">
          {visible.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 gap-3 border-b border-border py-4 md:grid-cols-12 md:items-center"
            >
              <div className="md:col-span-4">
                <div className="font-head text-[1.05rem] font-bold uppercase leading-tight tracking-tight">
                  {r.brand} {r.model}
                </div>
                <div className="mt-0.5 text-[0.8rem] text-muted-foreground">
                  {r.year > 0 ? `${r.year} г.` : 'год не указан'}
                  {r.scenario ? ` · ${r.scenario}` : ''}
                </div>
              </div>

              <div className="md:col-span-2">
                <span
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[0.78rem] ${
                    r.hits > 1
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                  title="Сколько раз искали эту машину"
                >
                  <Icon name="Users" size={13} />
                  {r.hits}
                </span>
              </div>

              <div className="md:col-span-4">
                {r.contact ? (
                  <a
                    href={
                      r.contact.includes('@')
                        ? `mailto:${r.contact}`
                        : `tel:${r.contact.replace(/[^+\d]/g, '')}`
                    }
                    className="flex items-center gap-1.5 text-[0.9rem] font-medium underline-offset-4 hover:text-primary hover:underline"
                  >
                    <Icon name="Bell" size={14} className="text-primary" />
                    {r.contact}
                  </a>
                ) : (
                  <span className="text-[0.85rem] text-muted-foreground">
                    Контакт не оставили
                  </span>
                )}
                <div className="mt-0.5 text-[0.75rem] text-muted-foreground">
                  {fmtDate(r.updatedAt)}
                </div>
              </div>

              <div className="flex justify-end md:col-span-2">
                <button
                  onClick={() => remove(r)}
                  aria-label={`Удалить ${r.brand} ${r.model}`}
                  title="Удалить запись"
                  className="flex items-center gap-1.5 border border-border px-3 py-2 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name="Trash2" size={15} />
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MissingFitPanel;
