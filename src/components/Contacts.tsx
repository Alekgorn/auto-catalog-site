import { useState } from 'react';
import Icon from '@/components/ui/icon';
import SectionHead from '@/components/SectionHead';
import { useToast } from '@/hooks/use-toast';
import { sendOrder } from '@/lib/api';
import { loadVehicle } from '@/lib/vehicle';
import { useCatalog } from '@/context/CatalogContext';
import { telHref } from '@/lib/site-settings';

const Contacts = () => {
  const { toast } = useToast();
  const { contacts } = useCatalog();

  const CONTACTS = [
    { label: 'Телефон', value: contacts.phone, href: telHref(contacts.phone) },
    { label: 'Почта', value: contacts.email, href: `mailto:${contacts.email}` },
    { label: 'Склад и выдача', value: contacts.address },
    { label: 'Часы работы', value: contacts.hours },
  ].filter((c) => c.value);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; phone?: string } = {};
    if (name.trim().length < 2) next.name = 'Укажите имя';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) next.phone = 'Телефон из 10–11 цифр';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    const vehicle = loadVehicle();
    const ok = await sendOrder({
      name: name.trim(),
      phone: phone.trim(),
      comment: comment.trim(),
      vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}, ${vehicle.year}` : '',
      source: 'Форма контактов',
      items: [],
    });
    setSending(false);

    if (!ok) {
      setErrors({ phone: 'Не удалось отправить. Попробуйте ещё раз.' });
      return;
    }

    toast({
      title: 'Заявка принята',
      description: `${name}, перезвоним на ${phone} в рабочее время.`,
    });
    setName('');
    setPhone('');
    setComment('');
  };

  const inputClass =
    'w-full border-b border-border bg-transparent py-3 font-head text-lg font-medium tracking-tight outline-none transition-colors placeholder:font-body placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground focus:border-primary';

  return (
    <section id="contacts" className="section-pad anchor-offset bg-surface">
      <div className="rule" />
      <SectionHead
        index="05"
        eyebrow="Контакты"
        title="Напишите, подберём"
        note="Отвечаем в рабочее время. Если знаете марку, модель и год — напишите их в комментарии, пришлём готовый список."
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-12 pb-14 md:grid-cols-12">
        <div className="md:col-span-5">
          {CONTACTS.map((c) => (
            <div key={c.label} className="border-t border-foreground py-4">
              <div className="eyebrow">{c.label}</div>
              {c.href ? (
                <a
                  href={c.href}
                  className="mt-1 block font-head text-xl font-medium tracking-tight transition-colors hover:text-primary"
                >
                  {c.value}
                </a>
              ) : (
                <div className="mt-1 font-head text-xl font-medium tracking-tight">
                  {c.value}
                </div>
              )}
            </div>
          ))}
          <div className="mt-8 flex gap-4">
            {[
              { icon: 'Send', href: contacts.telegram, title: 'Telegram' },
              { icon: 'MessageCircle', href: contacts.whatsapp, title: 'WhatsApp' },
              { icon: 'Phone', href: telHref(contacts.phone), title: 'Позвонить' },
            ]
              .filter((s) => s.href)
              .map((s) => (
                <a
                  key={s.icon}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  title={s.title}
                  className="flex h-11 w-11 items-center justify-center border border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name={s.icon} size={18} />
                </a>
              ))}
          </div>
        </div>

        <form onSubmit={submit} className="md:col-span-6 md:col-start-7" noValidate>
          <div className="border-t border-foreground pt-6">
            <label className="eyebrow" htmlFor="c-name">
              Как к вам обращаться
            </label>
            <input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className={inputClass}
            />
            {errors.name && (
              <div className="mt-2 text-[0.8rem] text-primary">{errors.name}</div>
            )}
          </div>

          <div className="mt-8">
            <label className="eyebrow" htmlFor="c-phone">
              Телефон для связи
            </label>
            <input
              id="c-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 900 000-00-00"
              inputMode="tel"
              className={inputClass}
            />
            {errors.phone && (
              <div className="mt-2 text-[0.8rem] text-primary">{errors.phone}</div>
            )}
          </div>

          <div className="mt-8">
            <label className="eyebrow" htmlFor="c-comment">
              Машина и что нужно
            </label>
            <textarea
              id="c-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Например: Lada Vesta SW Cross 2021, нужна магнитола 2DIN с камерой"
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-8 flex w-full items-center justify-between bg-primary px-6 py-5 font-head text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground disabled:opacity-60"
          >
            {sending ? 'Отправляем…' : 'Отправить заявку'}
            <Icon name="ArrowRight" size={20} />
          </button>
          <p className="mt-4 text-[0.78rem] leading-relaxed text-muted-foreground">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
          </p>
        </form>
      </div>
    </section>
  );
};

export default Contacts;