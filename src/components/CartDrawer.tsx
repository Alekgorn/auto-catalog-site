import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import ConsentCheck from '@/components/ConsentCheck';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { useCatalog } from '@/context/CatalogContext';
import { usePrice } from '@/hooks/use-price';
import {
  fitsAll,
  formatPrice,
  isCompatible,
  isUniversal,
  productImages,
} from '@/data/catalog';
import { plural } from '@/lib/kit-filter';
import { loadVehicle } from '@/lib/vehicle';
import { buildShareUrl } from '@/lib/share-kit';
import ShareKitDialog from '@/components/share/ShareKitDialog';
import { sendOrder } from '@/lib/api';
import { FREE_ALL_FROM, FREE_FROM, untilFree } from '@/lib/delivery';

const CartDrawer = () => {
  const { items, count, open, setOpen, remove, setQty, clear } = useCart();
  const { dealer, priceOf, profitOf } = usePrice();

  // Сумма с учётом дилерского режима
  const total = items.reduce((a, i) => a + priceOf(i.product) * i.qty, 0);
  /** Розничная стоимость набора и выгода дилера с перепродажи */
  const retail = items.reduce((a, i) => a + i.product.price * i.qty, 0);
  const profit = items.reduce((a, i) => a + profitOf(i.product) * i.qty, 0);
  /** Сколько добрать до бесплатной доставки — 0 значит уже бесплатно */
  const left = untilFree(total);
  const { toast } = useToast();
  const vehicle = loadVehicle();
  /* Нужен, чтобы отличить универсальный товар от неподходящего */
  const { brands } = useCatalog();

  const [step, setStep] = useState<'list' | 'form'>('list');
  /** Открыто окно «Поделиться» */
  const [sharing, setSharing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState(false);
  const [sending, setSending] = useState(false);

  const inputClass =
    'w-full border-b border-border bg-transparent py-3 font-head text-lg font-medium tracking-tight outline-none transition-colors placeholder:font-body placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground focus:border-primary';

  const close = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setStep('list');
      setError(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Укажите имя');
    if (phone.replace(/\D/g, '').length < 10) return setError('Укажите телефон');
    // Без согласия данные принимать нельзя — это требование закона
    if (!consent) {
      setError(null);
      return setConsentError(true);
    }
    setConsentError(false);
    setError(null);
    setSending(true);

    const ok = await sendOrder({
      name: name.trim(),
      phone: phone.trim(),
      comment: comment.trim(),
      vehicle: vehicle ? `${vehicle.brand} ${vehicle.model}, ${vehicle.year}` : '',
      source: 'Корзина',
      items: items.map(({ product, qty }) => ({
        slug: product.id,
        name: product.name,
        price: priceOf(product),
        qty,
      })),
    });
    setSending(false);

    if (!ok) {
      setError('Не удалось отправить. Попробуйте ещё раз или позвоните нам.');
      return;
    }

    close(false);
    toast({
      title: 'Заказ отправлен',
      description: `${count} поз. на ${formatPrice(total)} — перезвоним и подтвердим наличие.`,
    });
    clear();
    setName('');
    setPhone('');
    setComment('');
  };

  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 rounded-none border-foreground p-0 sm:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-foreground bg-primary px-6 py-5 text-primary-foreground">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
              {step === 'form' ? 'Оформление заказа' : 'Ваш заказ'}
            </div>
            <div className="mt-1 font-head text-xl font-bold uppercase tracking-tight">
              {count > 0
                ? `${count} ${plural(count, 'позиция', 'позиции', 'позиций')}`
                : 'Пусто'}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <Icon name="ShoppingCart" size={34} className="text-muted-foreground" />
            <div className="mt-5 font-head text-xl font-medium uppercase tracking-tight">
              Заказ пуст
            </div>
            <p className="mt-3 text-[0.9rem] text-muted-foreground">
              Добавьте оборудование из каталога — соберём всё в одну заявку и посчитаем
              общую стоимость.
            </p>
            <button
              onClick={() => close(false)}
              className="mt-7 border border-foreground px-6 py-3 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:bg-primary hover:border-primary hover:text-primary-foreground"
            >
              К каталогу
            </button>
          </div>
        ) : step === 'list' ? (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {vehicle && (
                <div className="mt-5 border border-border px-4 py-3 text-[0.8rem] text-muted-foreground">
                  Автомобиль: {vehicle.brand} {vehicle.model}, {vehicle.year} г.
                </div>
              )}

              {items.map(({ product, qty }) => {
                /*
                 * Универсальный товар подходит любой машине — у него
                 * просто не заполнен список марок. Раньше корзина этого
                 * не учитывала и честно подобранная магнитола получала
                 * метку «не подходит к вашей машине».
                 */
                const fits =
                  isCompatible(product, vehicle) ||
                  fitsAll(product) ||
                  isUniversal(product, brands.length);
                return (
                  <div key={product.id} className="border-b border-border py-5">
                    <div className="flex gap-4">
                      <Link
                        to={`/product/${product.id}`}
                        onClick={() => close(false)}
                        className="block h-20 w-20 flex-none overflow-hidden bg-card"
                      >
                        <img
                          src={productImages(product)[0]}
                          alt={product.name}
                          className="h-full w-full object-contain p-1.5"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/product/${product.id}`}
                          onClick={() => close(false)}
                          className="block font-head text-[0.95rem] font-medium leading-tight transition-colors hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                          {formatPrice(priceOf(product))} / шт
                        </div>
                        {vehicle && !fits && (
                          <div className="mt-1 flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.08em] text-primary">
                            <Icon name="CircleSlash" size={12} />
                            Не подходит к вашей машине
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => remove(product.id)}
                        aria-label="Удалить"
                        className="h-fit text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => setQty(product.id, qty - 1)}
                          aria-label="Меньше"
                          className="px-3 py-2 transition-colors hover:text-primary"
                        >
                          <Icon name="Minus" size={14} />
                        </button>
                        <span className="min-w-[2.5rem] text-center font-head text-[0.95rem] font-medium">
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty(product.id, qty + 1)}
                          aria-label="Больше"
                          className="px-3 py-2 transition-colors hover:text-primary"
                        >
                          <Icon name="Plus" size={14} />
                        </button>
                      </div>
                      <div className="font-head text-lg font-bold tracking-tight">
                        {formatPrice(priceOf(product) * qty)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="my-5 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={clear}
                  className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Trash2" size={14} />
                  Очистить заказ
                </button>
                {/* Отправить состав другу или клиенту — рядом с очисткой,
                    чтобы не спорить за внимание с кнопкой заявки */}
                <button
                  onClick={() => setSharing(true)}
                  className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon name="Share2" size={14} />
                  Поделиться
                </button>
              </div>
            </div>

            <div className="border-t border-foreground px-6 py-5">
              {dealer && profit > 0 && (
                <div className="mb-4 border border-primary bg-surface px-4 py-3">
                  <div className="flex items-center justify-between text-[0.85rem]">
                    <span className="text-muted-foreground">В рознице</span>
                    <span>{formatPrice(retail)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[0.9rem] font-medium text-primary">
                    <span>Ваша выгода</span>
                    <span>{formatPrice(profit)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-end justify-between">
                <span className="eyebrow">Итого</span>
                <span className="font-head text-3xl font-bold tracking-tight">
                  {formatPrice(total)}
                </span>
              </div>
              {/*
                Подсказка о пороге: доставка ощущается пустой тратой, а
                товар за те же деньги — приобретением. Поэтому «добавьте
                на 900 ₽» поднимает средний чек лучше скидки
              */}
              {left > 0 ? (
                <div className="mt-3 border border-border bg-surface px-4 py-3">
                  <div className="flex items-center gap-2 text-[0.85rem] font-medium">
                    <Icon name="Truck" size={16} className="flex-none text-primary" />
                    До бесплатной доставки — {formatPrice(left)}
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-border">
                    <div
                      className="h-full bg-primary transition-[width] duration-300"
                      style={{
                        width: `${Math.min(100, Math.round((total / FREE_FROM) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 border border-success bg-success/10 px-4 py-3 text-[0.85rem] font-medium text-success">
                  <Icon name="Truck" size={16} className="flex-none" />
                  {total >= FREE_ALL_FROM
                    ? 'Доставка бесплатно — любым способом'
                    : 'Доставка в пункт выдачи — бесплатно'}
                </div>
              )}

              <p className="mt-2 text-[0.78rem] text-muted-foreground">
                Стоимость доставки и установки назовём при подтверждении
                заказа. Курьером по СПб и через СДЭК — оплата при получении.
              </p>
              <button
                onClick={() => setStep('form')}
                className="mt-5 flex w-full items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.02em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Оформить заявку
                <Icon name="ArrowRight" size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            <button
              onClick={() => setStep('list')}
              className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name="ArrowLeft" size={14} />
              К списку
            </button>

            <dl className="mt-5 space-y-2 text-[0.85rem]">
              {items.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="flex justify-between gap-4 border-b border-border pb-2"
                >
                  <dt className="text-muted-foreground">
                    {product.name} × {qty}
                  </dt>
                  <dd className="flex-none">{formatPrice(priceOf(product) * qty)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 pt-2">
                <dt className="font-head font-bold uppercase">Итого</dt>
                <dd className="font-head text-xl font-bold">{formatPrice(total)}</dd>
              </div>
            </dl>

            <form onSubmit={submit} noValidate className="mt-7">
              <label className="eyebrow" htmlFor="c-name">
                Имя
              </label>
              <input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className={inputClass}
              />
              <div className="mt-6">
                <label className="eyebrow" htmlFor="c-phone">
                  Телефон
                </label>
                <input
                  id="c-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 900 000-00-00"
                  inputMode="tel"
                  className={inputClass}
                />
              </div>
              <div className="mt-6">
                <label className="eyebrow" htmlFor="c-comment">
                  Комментарий
                </label>
                <input
                  id="c-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Марка, модель, год или пожелания"
                  className={inputClass}
                />
              </div>
              {error && <div className="mt-3 text-[0.8rem] text-primary">{error}</div>}

              <ConsentCheck
                id="cart"
                checked={consent}
                onChange={(v) => {
                  setConsent(v);
                  if (v) setConsentError(false);
                }}
                error={consentError}
                className="mt-6"
              />

              <button
                type="submit"
                disabled={sending}
                className="mt-5 flex w-full items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase tracking-[0.02em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                {sending ? 'Отправляем…' : 'Отправить заказ'}
                <Icon name="ArrowRight" size={18} />
              </button>
            </form>
          </div>
        )}
      </SheetContent>

      {/* Вне панели: окно должно лежать поверх неё, а не внутри */}
      <ShareKitDialog
        open={sharing}
        onClose={() => setSharing(false)}
        url={buildShareUrl({
          lines: items.map((i) => ({ id: i.product.id, qty: i.qty })),
          vehicle,
        })}
        total={total}
        vehicle={vehicle}
        items={items}
      />
    </Sheet>
  );
};

export default CartDrawer;