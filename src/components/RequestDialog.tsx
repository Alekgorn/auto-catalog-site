import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Product, Vehicle, formatPrice, productSku } from '@/data/catalog';
import { sendOrder } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null;
  vehicle: Vehicle | null;
}

const RequestDialog = ({ open, onOpenChange, product, vehicle }: Props) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Укажите имя');
    if (phone.replace(/\D/g, '').length < 10) return setError('Укажите телефон');
    setError(null);
    setSending(true);

    const ok = await sendOrder({
      name: name.trim(),
      phone: phone.trim(),
      vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}, ${vehicle.year}` : '',
      source: product ? 'Карточка товара' : 'Общая заявка',
      items: product
        ? [{ slug: product.id, name: product.name, price: product.price, qty: 1 }]
        : [],
    });
    setSending(false);

    if (!ok) {
      setError('Не удалось отправить. Попробуйте ещё раз или позвоните нам.');
      return;
    }

    onOpenChange(false);
    toast({
      title: 'Заявка отправлена',
      description: product
        ? `${product.name} — перезвоним и подтвердим наличие.`
        : 'Перезвоним и подтвердим наличие.',
    });
    setName('');
    setPhone('');
  };

  const inputClass =
    'w-full border-b border-border bg-transparent py-3 font-head text-lg font-medium tracking-tight outline-none transition-colors placeholder:font-body placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground focus:border-primary';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 rounded-none border-foreground p-0">
        <div className="border-b border-foreground bg-primary px-7 py-5 text-primary-foreground">
          <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
            Заявка на оборудование
          </div>
          <h3 className="mt-2 font-head text-xl font-bold uppercase leading-tight tracking-tight">
            {product ? product.name : 'Подбор по вашей машине'}
          </h3>
        </div>

        <div className="px-7 py-6">
          {product && (
            <dl className="mb-6 space-y-2 text-[0.85rem]">
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Цена</dt>
                <dd className="font-head font-medium">{formatPrice(product.price)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Артикул</dt>
                <dd>{productSku(product)}</dd>
              </div>
              {vehicle && (
                <div className="flex justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Автомобиль</dt>
                  <dd>
                    {vehicle.brand} {vehicle.model}, {vehicle.year}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <form onSubmit={submit} noValidate>
            <label className="eyebrow" htmlFor="r-name">
              Имя
            </label>
            <input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя"
              className={inputClass}
            />
            <div className="mt-6">
              <label className="eyebrow" htmlFor="r-phone">
                Телефон
              </label>
              <input
                id="r-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 900 000-00-00"
                inputMode="tel"
                className={inputClass}
              />
            </div>
            {error && <div className="mt-3 text-[0.8rem] text-primary">{error}</div>}
            <button
              type="submit"
              disabled={sending}
              className="mt-7 flex w-full items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.02em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
            >
              {sending ? 'Отправляем…' : 'Отправить'}
              <Icon name="ArrowRight" size={18} />
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDialog;