import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Product } from '@/data/catalog';

interface Props {
  product: Product;
}

/**
 * Гарантии под фото товара.
 *
 * Человек смотрит на картинку и думает «а вдруг не подойдёт и куда мне
 * потом бежать». Место сразу под галереей — сильная позиция: возражение
 * снимается там же, где возникает, до того как взгляд уйдёт на кнопку.
 */
const ProductTrust = ({ product }: Props) => {
  const rows = [
    {
      icon: 'ShieldCheck',
      title: product.warranty ? `Гарантия ${product.warranty}` : 'Гарантия',
      text: 'Брак меняем без споров и лишних вопросов.',
    },
    {
      icon: 'RotateCcw',
      title: 'Возврат 14 дней',
      text: 'Без следов монтажа принимаем обратно. Ошиблись в подборе мы — обмен за наш счёт.',
    },
    {
      icon: 'Wallet',
      title: 'Оплата при получении',
      text: 'Курьером по СПб и через СДЭК. Ничего не переводите заранее.',
    },
  ];

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.title} className="flex items-start gap-3">
            <Icon
              name={r.icon}
              fallback="CircleCheck"
              size={18}
              className="mt-0.5 flex-none text-primary"
            />
            <div className="min-w-0">
              <div className="text-[0.88rem] font-medium leading-tight">
                {r.title}
              </div>
              <div className="mt-0.5 text-[0.8rem] leading-snug text-muted-foreground">
                {r.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/*
        Подбор по фото — ответ на «хочу посмотреть вживую». Прислать
        снимок панели надёжнее, чем разглядывать коробку в магазине:
        решает не внешний вид, а совместимость с конкретной машиной
      */}
      <Link
        to="/#contacts"
        className="mt-4 flex items-center gap-2 border border-border px-3.5 py-3 text-[0.83rem] transition-colors hover:border-primary hover:text-primary"
      >
        <Icon name="Camera" size={16} className="flex-none text-primary" />
        <span className="min-w-0 flex-1 leading-snug">
          Не уверены, что подойдёт? Пришлите фото панели — подберём
        </span>
        <Icon name="ArrowRight" size={14} className="flex-none" />
      </Link>
    </div>
  );
};

export default ProductTrust;
