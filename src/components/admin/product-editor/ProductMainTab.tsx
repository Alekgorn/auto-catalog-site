import { AdminProduct, SetField, label, field } from './product-types';
import { DEFAULT_STOCK_NOTE } from '@/components/StockLine';

interface Props {
  form: AdminProduct;
  set: SetField;
  categories: string[];
}

/** Вкладка «Основное»: название, цены, ссылки на маркетплейсы, годы. */
const ProductMainTab = ({ form, set, categories }: Props) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    <div className="sm:col-span-2">
      <span className={label}>Название</span>
      <input
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Категория</span>
      <select
        value={form.category}
        onChange={(e) => set('category', e.target.value)}
        className={`${field} cursor-pointer`}
      >
        <option value="">— выберите категорию —</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        {form.category && !categories.includes(form.category) && (
          <option value={form.category}>{form.category}</option>
        )}
      </select>
    </div>
    <div>
      <span className={label}>Артикул</span>
      <input
        value={form.sku ?? ''}
        onChange={(e) => set('sku', e.target.value)}
        className={field}
        placeholder="TOW-01"
      />
    </div>
    <div>
      <span className={label}>Метка (Хит, Акция)</span>
      <input
        value={form.badge ?? ''}
        onChange={(e) => set('badge', e.target.value || null)}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Популярность (0—100)</span>
      <input
        type="number"
        value={form.popularity ?? 0}
        onChange={(e) => set('popularity', Number(e.target.value))}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Наличие, шт</span>
      <input
        type="number"
        min={0}
        value={form.stock ?? 0}
        onChange={(e) => set('stock', Number(e.target.value))}
        className={field}
      />
      <p className="mt-1 text-[0.72rem] text-muted-foreground">
        Больше нуля — на сайте «На складе – отправка сегодня»
      </p>
    </div>
    <div>
      <span className={label}>Если нет в наличии</span>
      <input
        value={form.stockNote ?? ''}
        onChange={(e) => set('stockNote', e.target.value)}
        className={field}
        placeholder={DEFAULT_STOCK_NOTE}
      />
    </div>
    <div>
      <span className={label}>Цена, ₽</span>
      <input
        type="number"
        value={form.price}
        onChange={(e) => set('price', Number(e.target.value))}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Старая цена, ₽</span>
      <input
        type="number"
        value={form.oldPrice ?? ''}
        onChange={(e) => set('oldPrice', e.target.value ? Number(e.target.value) : null)}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Цена дилера, ₽</span>
      <input
        type="number"
        value={form.proPrice ?? ''}
        onChange={(e) => set('proPrice', e.target.value ? Number(e.target.value) : null)}
        className={field}
      />
    </div>
    <div className="md:col-span-2">
      <span className={label}>Ссылка на Ozon</span>
      <input
        value={form.ozonUrl}
        onChange={(e) => set('ozonUrl', e.target.value)}
        placeholder="https://www.ozon.ru/product/..."
        className={field}
      />
    </div>
    <div className="md:col-span-2">
      <span className={label}>Ссылка на Wildberries</span>
      <input
        value={form.wbUrl}
        onChange={(e) => set('wbUrl', e.target.value)}
        placeholder="https://www.wildberries.ru/catalog/..."
        className={field}
      />
    </div>
    <div>
      <span className={label}>Гарантия</span>
      <input
        value={form.warranty}
        onChange={(e) => set('warranty', e.target.value)}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Порядок в каталоге</span>
      <input
        type="number"
        value={form.sortOrder}
        onChange={(e) => set('sortOrder', Number(e.target.value))}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Год авто с</span>
      <input
        type="number"
        value={form.yearFrom}
        onChange={(e) => set('yearFrom', Number(e.target.value))}
        className={field}
      />
    </div>
    <div>
      <span className={label}>Год авто по</span>
      <input
        type="number"
        value={form.yearTo}
        onChange={(e) => set('yearTo', Number(e.target.value))}
        className={field}
      />
    </div>
    <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
      <input
        type="checkbox"
        checked={form.isActive}
        onChange={(e) => set('isActive', e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      <span className="text-[0.9rem]">Показывать на сайте</span>
    </label>
  </div>
);

export default ProductMainTab;
