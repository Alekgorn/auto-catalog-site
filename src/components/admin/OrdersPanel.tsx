import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { formatPrice } from '@/data/catalog';
import { useToast } from '@/hooks/use-toast';
import { useCatalog } from '@/context/CatalogContext';
import { showcaseHref } from '@/components/admin/ShowcaseEditor';
import { ShowcaseKit } from '@/lib/site-settings';

export interface AdminOrder {
  id: number;
  kind: string;
  name: string;
  phone: string;
  comment: string;
  vehicle: string;
  items: { slug: string; name: string; price: number; qty: number }[];
  total: number;
  status: string;
  adminNote: string;
  source: string;
  createdAt: string | null;
}

export const STATUSES: { key: string; label: string }[] = [
  { key: 'new', label: 'Новая' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'done', label: 'Выполнена' },
  { key: 'cancelled', label: 'Отменена' },
];

const statusLabel = (key: string) =>
  STATUSES.find((s) => s.key === key)?.label ?? key;

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Заголовок карточки из машины в заказе: «Kia Rio, 2015» → «Kia Rio 2015».
 * Запятая в базе появилась от формата заявки, на витрине она лишняя.
 */
const kitTitle = (vehicle: string): string =>
  (vehicle || '').replace(/,\s*/g, ' ').trim();

const OrdersPanel = () => {
  const { toast } = useToast();
  const { products } = useCatalog();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('?action=orders');
      const data = await res.json();
      setOrders(data.orders ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (order: AdminOrder, status: string) => {
    const res = await adminFetch('?action=orders', {
      method: 'PUT',
      body: JSON.stringify({ id: order.id, status, adminNote: order.adminNote }),
    });
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить статус' });
      return;
    }
    setOrders((list) =>
      list.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
  };

  const saveNote = async (order: AdminOrder, note: string) => {
    await adminFetch('?action=orders', {
      method: 'PUT',
      body: JSON.stringify({ id: order.id, status: order.status, adminNote: note }),
    });
    toast({ title: 'Комментарий сохранён' });
  };

  /*
   * Заказ → карточка витрины.
   *
   * Переносим только состав и машину: цену витрина считает по каталогу
   * сама, иначе однажды показала бы стоимость на день заказа. Позиции,
   * которых уже нет в каталоге, молча пропускаем — но если не осталось
   * ни одной, честно говорим, что переносить нечего.
   */
  const toShowcase = async (order: AdminOrder) => {
    const ids = order.items
      .map((it) => it.slug)
      .filter((id) => products.some((p) => p.id === id));

    if (!ids.length) {
      toast({
        title: 'Нечего переносить',
        description: 'В заявке нет товаров, которые есть в каталоге',
      });
      return;
    }

    setBusy(order.id);
    const cur = await adminFetch('?action=settings').then((r) => r.json());
    const list: ShowcaseKit[] = Array.isArray(cur.settings?.showcase)
      ? cur.settings.showcase
      : [];

    const kit: ShowcaseKit = {
      title: kitTitle(order.vehicle) || `Заказ №${order.id}`,
      ids,
      term: '',
    };

    const res = await adminFetch('?action=settings', {
      method: 'PUT',
      body: JSON.stringify({
        settings: {
          showcase: [...list, { ...kit, href: showcaseHref(kit) }],
        },
      }),
    });
    setBusy(null);

    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить' });
      return;
    }
    toast({
      title: 'Карточка создана',
      description: 'Вкладка «Сайт» — добавьте фото и срок поставки',
    });
  };

  const remove = async (order: AdminOrder) => {
    if (!window.confirm(`Удалить заявку от ${order.name}?`)) return;
    await adminFetch(`?action=orders&id=${order.id}`, { method: 'DELETE' });
    setOrders((list) => list.filter((o) => o.id !== order.id));
  };

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.status] = (map[o.status] ?? 0) + 1;
    });
    return map;
  }, [orders]);

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-6">
        <button
          onClick={() => setFilter('all')}
          className={`border-b pb-1 text-[0.78rem] uppercase tracking-[0.1em] transition-colors ${
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Все ({orders.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`border-b pb-1 text-[0.78rem] uppercase tracking-[0.1em] transition-colors ${
              filter === s.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label} ({counts[s.key] ?? 0})
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
        >
          <Icon name="RefreshCw" size={14} />
          Обновить
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Загружаем…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">Заявок пока нет</div>
      ) : (
        <div className="border-t border-foreground">
          {filtered.map((o) => (
            <div key={o.id} className="border-b border-border py-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="w-[110px] flex-none text-[0.78rem] text-muted-foreground">
                  {formatDate(o.createdAt)}
                </div>
                <div className="min-w-[140px] flex-1">
                  <div className="font-head text-[1rem] font-medium">{o.name}</div>
                  <a
                    href={`tel:${o.phone}`}
                    className="text-[0.85rem] text-muted-foreground transition-colors hover:text-primary"
                  >
                    {o.phone}
                  </a>
                </div>
                <div className="min-w-[120px] text-[0.8rem] text-muted-foreground">
                  {o.items.length > 0
                    ? `${o.items.length} поз.`
                    : o.source || 'Без товаров'}
                </div>
                <div className="min-w-[100px] font-head text-lg font-bold">
                  {o.total > 0 ? formatPrice(o.total) : '—'}
                </div>
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o, e.target.value)}
                  className={`cursor-pointer border px-3 py-2 text-[0.75rem] uppercase tracking-[0.08em] outline-none ${
                    o.status === 'new'
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
                >
                  {expanded === o.id ? 'Свернуть' : 'Подробнее'}
                </button>
                {/* Кнопка только там, где есть что показать: заявка на
                    подбор без товаров карточкой стать не может */}
                {o.items.length > 0 && (
                  <button
                    onClick={() => toShowcase(o)}
                    disabled={busy === o.id}
                    title="Создать карточку в блоке «Что мы уже собрали»"
                    className="flex items-center gap-2 border border-primary px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                  >
                    <Icon name="LayoutGrid" size={14} />
                    {busy === o.id ? 'Создаём…' : 'В витрину'}
                  </button>
                )}
                <button
                  onClick={() => remove(o)}
                  aria-label="Удалить"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>

              {expanded === o.id && (
                <div className="mt-5 grid grid-cols-1 gap-6 border-t border-border pt-5 md:grid-cols-2">
                  <div>
                    <div className="eyebrow">Состав заказа</div>
                    {o.items.length === 0 ? (
                      <p className="mt-3 text-[0.9rem] text-muted-foreground">
                        Товары не выбраны — заявка на подбор.
                      </p>
                    ) : (
                      <dl className="mt-3 text-[0.88rem]">
                        {o.items.map((it, i) => (
                          <div
                            key={i}
                            className="flex justify-between gap-4 border-b border-border py-2"
                          >
                            <dt className="text-muted-foreground">
                              {it.name} × {it.qty}
                            </dt>
                            <dd className="flex-none">{formatPrice(it.price * it.qty)}</dd>
                          </div>
                        ))}
                        <div className="flex justify-between gap-4 pt-3">
                          <dt className="font-head font-bold uppercase">Итого</dt>
                          <dd className="font-head text-lg font-bold">
                            {formatPrice(o.total)}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>

                  <div>
                    <div className="eyebrow">Данные клиента</div>
                    <dl className="mt-3 text-[0.88rem]">
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Автомобиль</dt>
                        <dd className="text-right">{o.vehicle || 'не указан'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Откуда</dt>
                        <dd className="text-right">{o.source || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-border py-2">
                        <dt className="text-muted-foreground">Статус</dt>
                        <dd className="text-right">{statusLabel(o.status)}</dd>
                      </div>
                    </dl>
                    {o.comment && (
                      <p className="mt-4 border-l-2 border-primary pl-4 text-[0.88rem] text-muted-foreground">
                        {o.comment}
                      </p>
                    )}

                    <div className="mt-5">
                      <label className="eyebrow mb-1 block">Комментарий менеджера</label>
                      <textarea
                        defaultValue={o.adminNote}
                        rows={2}
                        onBlur={(e) => {
                          if (e.target.value !== o.adminNote) saveNote(o, e.target.value);
                        }}
                        className="w-full border border-border bg-transparent p-3 text-[0.88rem] outline-none transition-colors focus:border-primary"
                        placeholder="Что уже сделано по заявке"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPanel;
