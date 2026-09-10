import { useEffect, useRef, useState } from 'react';
import { AdminProduct } from '@/components/admin/ProductEditor';

/**
 * Наличие и метка прямо в строке списка товаров.
 *
 * Раньше, чтобы поправить остаток, приходилось открывать карточку,
 * искать поле среди двух десятков других, сохранять и возвращаться в
 * список. При обходе поставок это десятки лишних заходов.
 *
 * Сохраняем не на каждое нажатие клавиши, а когда человек ушёл из поля
 * или нажал Enter: иначе набор «120» отправил бы на сервер три запроса,
 * и товар успел бы побывать в наличии «1» и «12».
 */

/** Готовые метки: набирать «Хит» руками каждый раз незачем */
const BADGES = ['', 'Хит', 'Акция', 'Новинка'];

interface Props {
  product: AdminProduct;
  onSave: (product: AdminProduct) => void | Promise<void>;
}

const QuickFields = ({ product, onSave }: Props) => {
  const [stock, setStock] = useState(String(product.stock ?? 0));
  /* Метка своя, не из списка — держим её как отдельный вариант, иначе
     выпадающий список молча затёр бы её при первом же открытии */
  const custom =
    product.badge && !BADGES.includes(product.badge) ? product.badge : '';

  /* Список обновился со стороны сервера — подхватываем новые значения,
     но не перебиваем то, что человек прямо сейчас набирает */
  const typing = useRef(false);
  useEffect(() => {
    if (!typing.current) setStock(String(product.stock ?? 0));
  }, [product.stock]);

  const commitStock = () => {
    typing.current = false;
    const next = Math.max(0, Number(stock) || 0);
    if (next === (product.stock ?? 0)) return;
    setStock(String(next));
    onSave({ ...product, stock: next });
  };

  const label =
    'text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground';

  return (
    <div className="flex flex-none items-end gap-3">
      <div>
        <span className={label}>Наличие</span>
        <div className="mt-0.5 flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            value={stock}
            onFocus={() => (typing.current = true)}
            onChange={(e) => setStock(e.target.value)}
            onBlur={commitStock}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setStock(String(product.stock ?? 0));
                typing.current = false;
                e.currentTarget.blur();
              }
            }}
            aria-label={`Наличие: ${product.name}`}
            className="w-[68px] border border-border bg-background px-2 py-1.5 text-center font-head text-[0.9rem] font-bold outline-none focus:border-primary"
          />
          {/* Словами, как это увидит покупатель: цифра сама по себе не
              говорит, отправят товар сегодня или он под заказ */}
          <span
            className={`text-[0.62rem] uppercase tracking-[0.08em] ${
              (product.stock ?? 0) > 0 ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {(product.stock ?? 0) > 0 ? 'на складе' : 'под заказ'}
          </span>
        </div>
      </div>

      <div>
        <span className={label}>Метка</span>
        <select
          value={product.badge ?? ''}
          onChange={(e) =>
            onSave({ ...product, badge: e.target.value || null })
          }
          aria-label={`Метка: ${product.name}`}
          className="mt-0.5 block w-[104px] cursor-pointer border border-border bg-background px-2 py-1.5 text-[0.78rem] outline-none focus:border-primary"
        >
          {BADGES.map((b) => (
            <option key={b} value={b}>
              {b || '— нет —'}
            </option>
          ))}
          {custom && <option value={custom}>{custom}</option>}
        </select>
      </div>
    </div>
  );
};

export default QuickFields;
