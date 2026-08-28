import SectionHead from '@/components/SectionHead';
import Icon from '@/components/ui/icon';
import { formatPrice } from '@/data/catalog';
import { DELIVERY } from '@/lib/delivery';

/**
 * Блок «Как купить»: способы доставки, оплата при получении и возврат.
 *
 * Отвечает на молчаливый вопрос покупателя «а вдруг не подойдёт и куда
 * мне потом бежать». Возможность заплатить курьеру при получении снимает
 * этот страх лучше любых слов о надёжности: до товара в руках человек
 * ничем не рискует. Поэтому способы с оплатой на месте идут первыми.
 */
const HowToBuy = () => (
  <section id="delivery" className="section-pad anchor-offset">
    <div className="rule" />
    <SectionHead
      eyebrow="Доставка и оплата"
      title="Как купить"
      note="Мы интернет-магазин из Санкт-Петербурга — привозим к вам."
    />

    {/* Способов четыре: на широком экране два ряда по два, иначе
        последний висел бы в одиночестве под тройкой */}
    <div className="grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2 lg:grid-cols-4">
      {DELIVERY.map((d) => (
        <div key={d.id} className="border border-border p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center border border-border bg-surface">
              <Icon name={d.icon} fallback="Package" size={19} className="text-primary" />
            </span>
            <div className="min-w-0">
              <div className="font-head text-[1rem] font-bold uppercase leading-tight tracking-tight">
                {d.title}
              </div>
              <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted-foreground">
                {d.text}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <div className="text-[0.85rem] font-medium">
              Бесплатно от {formatPrice(d.free)}
            </div>
            <div className="mt-0.5 text-[0.78rem] text-muted-foreground">
              Меньше — от {formatPrice(d.from)}, сумму назовём при
              подтверждении
            </div>
          </div>

          {d.onDelivery && (
            <div className="mt-3 inline-flex items-center gap-1.5 border border-success px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-[0.04em] text-success">
              <Icon name="Wallet" fallback="CircleCheck" size={13} />
              Оплата при получении
            </div>
          )}
        </div>
      ))}
    </div>

    {/*
      Главное возражение снимаем отдельно и крупно: человек боится не
      «не посмотреть товар», а отдать деньги неизвестно кому
    */}
    <div className="grid grid-cols-1 gap-6 border-t border-foreground pt-6 pb-14 md:grid-cols-12">
      <div className="md:col-span-5">
        <div className="flex items-start gap-3">
          <Icon
            name="ShieldCheck"
            fallback="CircleCheck"
            size={22}
            className="mt-0.5 flex-none text-primary"
          />
          <div>
            <div className="font-head text-[1.05rem] font-bold uppercase leading-tight tracking-tight">
              Платите, когда получите
            </div>
            <p className="mt-2 max-w-[30em] text-[0.9rem] leading-relaxed text-muted-foreground">
              Курьером по Петербургу и через СДЭК по России — оплата при
              получении. Ничего не переводите заранее. В пункте выдачи посылку
              можно вскрыть и проверить до оплаты.
            </p>
          </div>
        </div>
      </div>

      <div className="md:col-span-5 md:col-start-7">
        <div className="flex items-start gap-3">
          <Icon
            name="RotateCcw"
            size={22}
            className="mt-0.5 flex-none text-primary"
          />
          <div>
            <div className="font-head text-[1.05rem] font-bold uppercase leading-tight tracking-tight">
              Не подошло — вернём
            </div>
            <p className="mt-2 max-w-[30em] text-[0.9rem] leading-relaxed text-muted-foreground">
              Товар без следов монтажа принимаем обратно 14 дней. Ошиблись мы в
              подборе — обмен и доставку берём на себя. Не уверены, что
              подойдёт: пришлите фото панели, подберём под вашу машину.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HowToBuy;