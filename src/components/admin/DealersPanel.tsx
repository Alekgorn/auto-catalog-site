import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';

interface Dealer {
  id: number;
  phone: string;
  name: string;
  comment: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string | null;
}

const showPhone = (digits: string): string => {
  const d = digits.replace(/\D/g, '');
  if (d.length !== 11) return digits;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
};

const showDate = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

/** Управление списком дилеров: добавление, отключение и удаление. */
const DealersPanel = () => {
  const [list, setList] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('?action=dealers');
      const data = await res.json();
      setList(data.dealers ?? []);
    } catch {
      setError('Не удалось загрузить список');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Введите номер полностью');
      return;
    }
    setBusy(true);
    setError('');
    await adminFetch('?action=dealers', {
      method: 'POST',
      body: JSON.stringify({ phone, name, comment }),
    });
    setPhone('');
    setName('');
    setComment('');
    setBusy(false);
    load();
  };

  const remove = async (id: number) => {
    await adminFetch('?action=dealers', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    load();
  };

  const toggle = async (d: Dealer) => {
    await adminFetch('?action=dealers', {
      method: 'PUT',
      body: JSON.stringify({ id: d.id, isActive: !d.isActive }),
    });
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-head text-2xl font-bold uppercase tracking-tight">
            Дилеры
          </h2>
          <p className="mt-2 max-w-[40em] text-[0.88rem] leading-relaxed text-muted-foreground">
            Дилер вводит свой номер в окне «Я дилер» на сайте. Если номер есть в
            этом списке и доступ включён — в каталоге показываются дилерские
            цены.
          </p>
        </div>
        <div className="text-[0.75rem] uppercase tracking-[0.12em] text-muted-foreground">
          Всего: {list.length}
        </div>
      </div>

      {/* Добавление */}
      <div className="mt-6 grid grid-cols-1 gap-4 border border-foreground bg-surface p-5 md:grid-cols-12">
        <div className="md:col-span-3">
          <span className="eyebrow mb-1 block">Телефон</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 999 123-45-67"
            className="w-full border-b border-border bg-transparent py-2 font-head text-lg font-medium outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="md:col-span-4">
          <span className="eyebrow mb-1 block">Название или имя</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Автосервис «Пример»"
            className="w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="md:col-span-3">
          <span className="eyebrow mb-1 block">Заметка</span>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Скидка по договору"
            className="w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex items-end md:col-span-2">
          <button
            onClick={add}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 bg-foreground px-4 py-3 font-head text-[0.78rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
          >
            <Icon name="Plus" size={16} />
            Добавить
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-2 text-[0.85rem] text-primary">
          <Icon name="CircleAlert" size={15} />
          {error}
        </p>
      )}

      {/* Список */}
      <div className="mt-8 border-t border-foreground">
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Загружаем…</div>
        ) : list.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            Пока ни одного дилера. Добавьте номер выше.
          </div>
        ) : (
          list.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-1 items-center gap-3 border-b border-border py-4 md:grid-cols-12"
            >
              <div className="font-head text-[1.05rem] font-bold tracking-tight md:col-span-3">
                {showPhone(d.phone)}
              </div>
              <div className="md:col-span-3">
                {d.name || <span className="text-muted-foreground">—</span>}
              </div>
              <div className="text-[0.85rem] text-muted-foreground md:col-span-2">
                {d.comment || '—'}
              </div>
              <div className="text-[0.8rem] text-muted-foreground md:col-span-2">
                Вход: {showDate(d.lastLogin)}
              </div>
              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <button
                  onClick={() => toggle(d)}
                  className={`border px-3 py-2 text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                    d.isActive
                      ? 'border-foreground hover:border-primary hover:text-primary'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {d.isActive ? 'Включён' : 'Отключён'}
                </button>
                <button
                  onClick={() => remove(d.id)}
                  aria-label="Удалить"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Trash2" size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DealersPanel;
