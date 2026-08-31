import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import HotspotsEditor from '@/components/admin/HotspotsEditor';
import ScenariosCheck from '@/components/admin/ScenariosCheck';
import ImageOptimizer from '@/components/admin/ImageOptimizer';
import ExternalImages from '@/components/admin/ExternalImages';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';
import {
  DEFAULT_CONTACTS,
  DEFAULT_FAQ,
  DEFAULT_FILTER_BLOCKS,
  DEFAULT_ANALYTICS,
  DEFAULT_HOTSPOTS,
  HeroHotspot,
  SiteAnalytics,
  FILTER_BLOCKS,
  FaqItem,
  FilterBlockKey,
  SiteContacts,
} from '@/lib/site-settings';

interface Props {
  onSaved: () => void;
}

const FIELDS: { key: keyof SiteContacts; label: string; hint: string }[] = [
  { key: 'phone', label: 'Телефон', hint: '8 800 333-44-55' },
  { key: 'email', label: 'Почта', hint: 'zakaz@shtatno.ru' },
  { key: 'address', label: 'Адрес склада', hint: 'Москва, улица, дом' },
  { key: 'hours', label: 'Часы работы', hint: 'Пн–Сб, 09:00 — 20:00' },
  { key: 'telegram', label: 'Telegram', hint: 'https://t.me/имя или @имя' },
  {
    key: 'max',
    label: 'MAX',
    hint: 'https://max.ru/u/... — ссылка «Поделиться профилем» из приложения',
  },
  { key: 'whatsapp', label: 'WhatsApp', hint: 'https://wa.me/79001234567' },
];

const input =
  'w-full border-b border-border bg-transparent py-2.5 text-[0.95rem] outline-none transition-colors focus:border-primary';

const SitePanel = ({ onSaved }: Props) => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<SiteContacts>(DEFAULT_CONTACTS);
  const [faq, setFaq] = useState<FaqItem[]>(DEFAULT_FAQ);
  const [blocks, setBlocks] = useState<FilterBlockKey[]>(DEFAULT_FILTER_BLOCKS);
  const [hotspots, setHotspots] = useState<HeroHotspot[]>(DEFAULT_HOTSPOTS);
  const [analytics, setAnalytics] = useState<SiteAnalytics>(DEFAULT_ANALYTICS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch('?action=settings')
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings ?? {};
        if (s.contacts) setContacts({ ...DEFAULT_CONTACTS, ...s.contacts });
        if (Array.isArray(s.faq) && s.faq.length) setFaq(s.faq);
        if (Array.isArray(s.filter_blocks)) setBlocks(s.filter_blocks);
        if (Array.isArray(s.hotspots) && s.hotspots.length) setHotspots(s.hotspots);
        if (s.analytics) setAnalytics({ ...DEFAULT_ANALYTICS, ...s.analytics });
      })
      .catch(() => undefined);
  }, []);

  const save = async () => {
    setBusy(true);
    const clean = faq.filter((f) => f.q.trim() && f.a.trim());
    const res = await adminFetch('?action=settings', {
      method: 'PUT',
      body: JSON.stringify({
        settings: {
          contacts,
          faq: clean,
          filter_blocks: blocks,
          hotspots: hotspots.filter((x) => x.label.trim()),
          analytics,
        },
      }),
    });
    setBusy(false);
    if (!res.ok) {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить' });
      return;
    }
    setFaq(clean.length ? clean : DEFAULT_FAQ);
    toast({ title: 'Сохранено', description: 'Изменения уже на сайте' });
    onSaved();
  };

  const setFaqAt = (i: number, patch: Partial<FaqItem>) =>
    setFaq((list) => list.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const moveFaq = (i: number, dir: -1 | 1) =>
    setFaq((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const toggleBlock = (key: FilterBlockKey) =>
    setBlocks((b) => (b.includes(key) ? b.filter((x) => x !== key) : [...b, key]));

  return (
    <div className="py-8">
      <div className="mb-12 space-y-5">
        <ImageOptimizer />
        <ExternalImages />
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="eyebrow">Контакты</div>
          <h2 className="mt-3 font-head text-2xl font-bold uppercase tracking-[-0.02em]">
            Данные на сайте
          </h2>
          <p className="mt-4 max-w-[34em] text-muted-foreground">
            Телефон, почта, адрес и ссылки на мессенджеры меняются сразу во
            всех местах: шапка, подвал, блок контактов и кнопки «прислать
            фото». Пустые поля просто не показываются.
          </p>

          <div className="mt-8 space-y-5">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="eyebrow">{f.label}</span>
                <input
                  value={contacts[f.key]}
                  placeholder={f.hint}
                  onChange={(e) =>
                    setContacts((c) => ({ ...c, [f.key]: e.target.value }))
                  }
                  className={input}
                />
              </label>
            ))}
          </div>

          <div className="mt-12">
            <div className="eyebrow">Фильтр в каталоге</div>
            <h3 className="mt-3 font-head text-xl font-bold uppercase tracking-tight">
              Что показывать покупателю
            </h3>
            <p className="mt-3 max-w-[34em] text-muted-foreground">
              Снимите галочку — блок исчезнет из фильтра сбоку.
            </p>
            <div className="mt-5 border-t border-foreground">
              {FILTER_BLOCKS.map((b) => (
                <label
                  key={b.key}
                  className="flex cursor-pointer items-center gap-3 border-b border-border py-3"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-primary"
                    checked={blocks.includes(b.key)}
                    onChange={() => toggleBlock(b.key)}
                  />
                  <span className="text-[0.95rem]">{b.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-12 border-t border-foreground pt-10">
            <AnalyticsPanel
              value={analytics}
              onChange={(patch) => setAnalytics((a) => ({ ...a, ...patch }))}
            />
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Вопросы и ответы</div>
              <h2 className="mt-3 font-head text-2xl font-bold uppercase tracking-[-0.02em]">
                Блок FAQ
              </h2>
            </div>
            <button
              onClick={() => setFaq((f) => [...f, { q: '', a: '' }])}
              className="flex flex-none items-center gap-2 border border-foreground px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
            >
              <Icon name="Plus" size={14} />
              Вопрос
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-2.5 font-head text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                      value={item.q}
                      placeholder="Вопрос покупателя"
                      onChange={(e) => setFaqAt(i, { q: e.target.value })}
                      className={`${input} font-head font-medium`}
                    />
                    <textarea
                      value={item.a}
                      placeholder="Ответ"
                      rows={3}
                      onChange={(e) => setFaqAt(i, { a: e.target.value })}
                      className="mt-3 w-full resize-y border border-border bg-transparent p-3 text-[0.9rem] leading-relaxed outline-none transition-colors focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-none flex-col gap-1">
                    <button
                      onClick={() => moveFaq(i, -1)}
                      disabled={i === 0}
                      title="Выше"
                      className="p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                    >
                      <Icon name="ChevronUp" size={16} />
                    </button>
                    <button
                      onClick={() => moveFaq(i, 1)}
                      disabled={i === faq.length - 1}
                      title="Ниже"
                      className="p-1 text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
                    >
                      <Icon name="ChevronDown" size={16} />
                    </button>
                    <button
                      onClick={() => setFaq((f) => f.filter((_, x) => x !== i))}
                      title="Удалить"
                      className="p-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-14 border-t border-foreground pt-10">
        <HotspotsEditor value={hotspots} onChange={setHotspots} />
      </div>

      <div className="mt-14 border-t border-foreground">
        <ScenariosCheck />
      </div>

      <div className="sticky bottom-0 mt-10 border-t border-foreground bg-background py-5">
        <button
          onClick={save}
          disabled={busy}
          className="flex items-center gap-3 bg-primary px-8 py-4 font-head text-[0.85rem] font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground disabled:opacity-60"
        >
          <Icon name="Check" size={17} />
          {busy ? 'Сохраняем…' : 'Сохранить изменения'}
        </button>
      </div>
    </div>
  );
};

export default SitePanel;