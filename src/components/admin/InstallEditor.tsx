import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AdminProduct } from '@/components/admin/ProductEditor';
import { uploadImage } from '@/components/admin/BlocksEditor';
import ImageZoom, { keepOpenOnZoom } from '@/components/admin/ImageZoom';
import VideoField from '@/components/admin/VideoField';
import { AdminBrand } from '@/components/admin/BrandsEditor';

export interface AdminInstall {
  id?: number;
  slug?: string;
  brand: string;
  model: string;
  year: number;
  title: string;
  excerpt: string;
  /** Панель до работы — снимок из той же точки, что и «стало» */
  beforeImage: string;
  afterImage: string;
  gallery: string[];
  /** Вертикальный ролик: YouTube Shorts, Rutube, VK или свой файл */
  video: string;
  comment: string;
  /** Партнёрский сервис, где выполняли работу */
  placeName: string;
  placeAddress: string;
  /** Почему ставили именно там */
  placeNote: string;
  /** Точка на карте: «55.751244,37.618423» */
  placeCoords: string;
  /** Разрешение партнёра. Выключено — адреса на сайте нет вовсе */
  placeShown: boolean;
  productIds: number[];
  sortOrder: number;
  isActive: boolean;
}

export const emptyInstall = (): AdminInstall => ({
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  title: '',
  excerpt: '',
  beforeImage: '',
  afterImage: '',
  gallery: [],
  video: '',
  comment: '',
  placeName: '',
  placeAddress: '',
  placeNote: '',
  placeCoords: '',
  placeShown: false,
  productIds: [],
  sortOrder: 100,
  isActive: true,
});

interface Props {
  install: AdminInstall;
  products: AdminProduct[];
  brands: AdminBrand[];
  onClose: () => void;
  onSave: (i: AdminInstall) => void;
}

const label = 'eyebrow block mb-1';
const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';
const area =
  'w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary';

/**
 * Установка — выполненная работа с фото «было/стало».
 *
 * Отдельная запись, а не блок внутри товара: одна установка это всегда
 * комплект (магнитола, рамка, проводка), и она показывается сразу на
 * всех товарах, что в ней стояли. Заполняется один раз.
 */
const InstallEditor = ({ install, products, brands, onClose, onSave }: Props) => {
  const [form, setForm] = useState<AdminInstall>({
    ...install,
    gallery: install.gallery ?? [],
    productIds: install.productIds ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const set = <K extends keyof AdminInstall>(key: K, value: AdminInstall[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const models = useMemo(
    () => brands.find((b) => b.name === form.brand)?.models ?? [],
    [brands, form.brand],
  );

  const pick = async (files: FileList | null, apply: (url: string) => void) => {
    if (!files?.length) return;
    setBusy(true);
    const url = await uploadImage(files[0]);
    setBusy(false);
    if (url) apply(url);
  };

  /* Галерея: снимков на одну работу бывает под десяток, поэтому
     разрешаем выбрать сразу несколько файлов за раз */
  const pickGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setBusy(false);
    if (urls.length) setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls] }));
  };

  const toggleProduct = (id: number) =>
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((x) => x !== id)
        : [...f.productIds, id],
    }));

  const submit = () => {
    if (!form.brand.trim() || !form.model.trim()) {
      return setError('Укажите марку и модель — по ним человек ищет свой случай');
    }
    if (!form.afterImage.trim()) {
      return setError('Нужно хотя бы фото «стало» — без него показывать нечего');
    }
    setError(null);
    onSave({ ...form, gallery: form.gallery.filter(Boolean) });
  };

  const shown = products.filter((p) =>
    (p.name + ' ' + p.category).toLowerCase().includes(search.toLowerCase()),
  );

  /** Заголовок собирается из машины сам — показываем, что получится */
  const autoTitle =
    `${form.brand} ${form.model}`.trim() + (form.year ? ` ${form.year}` : '');

  const photoBox = (
    src: string,
    onPick: (url: string) => void,
    caption: string,
    hint: string,
  ) => (
    <div>
      <span className={label}>{caption}</span>
      {src ? (
        <div className="relative">
          <img
            src={src}
            alt={caption}
            onClick={() => setZoom(src)}
            className="aspect-[4/3] w-full cursor-zoom-in border border-border bg-card object-cover"
          />
          <button
            onClick={() => onPick('')}
            title="Убрать фото"
            className="absolute right-2 top-2 bg-foreground/80 p-1.5 text-background transition-colors hover:bg-primary"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      ) : (
        <label className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Icon name={busy ? 'Loader' : 'ImagePlus'} size={26} />
          <span className="text-[0.78rem]">{busy ? 'Загружаем…' : 'Выбрать фото'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files, onPick)}
          />
        </label>
      )}
      <p className="mt-1.5 text-[0.72rem] leading-snug text-muted-foreground">
        {hint}
      </p>
    </div>
  );

  return (
    <>
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          {...keepOpenOnZoom}
          className="max-h-[92vh] max-w-3xl gap-0 overflow-y-auto rounded-none border-foreground p-0"
        >
          <div className="sticky top-0 z-10 border-b border-foreground bg-primary px-6 py-5 text-primary-foreground">
            <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
              {form.id ? 'Редактирование установки' : 'Новая установка'}
            </div>
            <div className="mt-1 font-head text-xl font-bold uppercase tracking-tight">
              {form.title || autoTitle || 'Без машины'}
            </div>
          </div>

          <div className="space-y-8 px-6 py-6">
            {/* Машина */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <span className={label}>Марка</span>
                <select
                  value={form.brand}
                  onChange={(e) => {
                    set('brand', e.target.value);
                    set('model', '');
                  }}
                  className={`${field} cursor-pointer`}
                >
                  <option value="">— выберите —</option>
                  {brands.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={label}>Модель</span>
                <select
                  value={form.model}
                  onChange={(e) => set('model', e.target.value)}
                  disabled={!models.length}
                  className={`${field} cursor-pointer disabled:opacity-50`}
                >
                  <option value="">— выберите —</option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={label}>Год</span>
                <input
                  type="number"
                  value={form.year || ''}
                  onChange={(e) => set('year', Number(e.target.value))}
                  className={field}
                  placeholder="2017"
                />
              </div>
            </div>

            {/* Пара «было/стало» — главное в записи */}
            <div>
              <div className="border-t border-foreground pt-5">
                <h3 className="font-head text-[1rem] font-bold uppercase tracking-tight">
                  Было и стало
                </h3>
                <p className="mt-1.5 max-w-[42em] text-[0.82rem] leading-relaxed text-muted-foreground">
                  Снимайте оба кадра с одной точки — тогда на сайте они
                  переключаются на месте и разница видна сразу. Если ракурсы
                  разные, эффект теряется. «Было» можно не заполнять, тогда
                  покажем только результат.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {photoBox(
                  form.beforeImage,
                  (u) => set('beforeImage', u),
                  'Было',
                  'Штатная панель до работы',
                )}
                {photoBox(
                  form.afterImage,
                  (u) => set('afterImage', u),
                  'Стало — обязательно',
                  'Готовый результат: это фото попадёт в ленту на главной',
                )}
              </div>
            </div>

            {/* Галерея процесса */}
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className={label}>Остальные фото</span>
                  <p className="text-[0.78rem] text-muted-foreground">
                    Процесс, разъёмы, детали крупным планом
                  </p>
                </div>
                <label className="flex flex-none cursor-pointer items-center gap-2 border border-foreground px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:border-primary hover:text-primary">
                  <Icon name={busy ? 'Loader' : 'Plus'} size={14} />
                  Добавить
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => pickGallery(e.target.files)}
                  />
                </label>
              </div>

              {form.gallery.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {form.gallery.map((src, i) => (
                    <div key={src + i} className="relative">
                      <img
                        src={src}
                        alt=""
                        onClick={() => setZoom(src)}
                        className="aspect-square w-full cursor-zoom-in border border-border bg-card object-cover"
                      />
                      <button
                        onClick={() =>
                          set(
                            'gallery',
                            form.gallery.filter((_, x) => x !== i),
                          )
                        }
                        title="Убрать"
                        className="absolute right-1 top-1 bg-foreground/80 p-1 text-background transition-colors hover:bg-primary"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Видео */}
            <div className="border-t border-foreground pt-5">
              <span className={label}>Короткое видео</span>
              <VideoField
                value={form.video}
                onChange={(v) => set('video', v)}
              />
              <p className="mt-1.5 max-w-[42em] text-[0.78rem] leading-relaxed text-muted-foreground">
                Вертикальный ролик показываем узкой колонкой рядом с фото —
                как в телефоне, без чёрных полос по бокам.
              </p>
            </div>

            {/* Комментарий мастера */}
            <div>
              <span className={label}>Что важно знать про эту установку</span>
              <textarea
                value={form.comment}
                onChange={(e) => set('comment', e.target.value)}
                rows={2}
                className={area}
                placeholder="Кнопки на руле сохранены, штатная камера подхватилась без адаптера"
              />
              <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                Самая ценная строка: из одних фотографий этого не видно, а
                покупателя волнует именно это.
              </p>
            </div>

            {/* Где ставили */}
            <div className="border-t border-foreground pt-5">
              <h3 className="font-head text-[1rem] font-bold uppercase tracking-tight">
                Где выполнена установка
              </h3>
              <p className="mt-1.5 max-w-[42em] text-[0.82rem] leading-relaxed text-muted-foreground">
                Работы делают партнёрские сервисы. Адрес показываем только
                с их разрешения — галочка ниже. Снимете её, и на сайте не
                останется ни адреса, ни карты, но данные сохранятся: если
                разрешение вернут, включите обратно.
              </p>

              <label className="mt-4 flex cursor-pointer items-start gap-3 border border-border p-4">
                <input
                  type="checkbox"
                  checked={form.placeShown}
                  onChange={(e) => set('placeShown', e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-none accent-primary"
                />
                <span>
                  <span className="font-head text-[0.9rem] font-medium">
                    Партнёр разрешил показывать адрес
                  </span>
                  <span className="mt-0.5 block text-[0.78rem] text-muted-foreground">
                    {form.placeShown
                      ? 'Адрес и карта видны посетителям сайта'
                      : 'Сейчас адрес на сайте не показывается'}
                  </span>
                </span>
              </label>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <span className={label}>Название сервиса</span>
                  <input
                    value={form.placeName}
                    onChange={(e) => set('placeName', e.target.value)}
                    className={field}
                    placeholder="Автозвук на Ленина"
                  />
                </div>
                <div>
                  <span className={label}>Адрес</span>
                  <input
                    value={form.placeAddress}
                    onChange={(e) => set('placeAddress', e.target.value)}
                    className={field}
                    placeholder="Санкт-Петербург, Ленина 15"
                  />
                </div>
              </div>

              <div className="mt-5">
                <span className={label}>Точка на карте</span>
                <input
                  value={form.placeCoords}
                  onChange={(e) => set('placeCoords', e.target.value)}
                  className={field}
                  placeholder="59.939095, 30.315868"
                />
                <p className="mt-1.5 max-w-[42em] text-[0.72rem] leading-snug text-muted-foreground">
                  Откройте Яндекс.Карты, нажмите правой кнопкой на нужном
                  месте и выберите «Что здесь?» — числа скопируйте сюда.
                  Оставите пустым — покажем адрес строкой, без карты.
                </p>
              </div>

              <div className="mt-5">
                <span className={label}>Почему ставили именно там</span>
                <textarea
                  value={form.placeNote}
                  onChange={(e) => set('placeNote', e.target.value)}
                  rows={2}
                  className={area}
                  placeholder="Работают с этой маркой не первый год, есть подъёмник и стенд для проверки кнопок на руле"
                />
              </div>
            </div>

            {/* Для поиска */}
            <div className="border-t border-foreground pt-5">
              <span className={label}>Краткое описание — для поиска</span>
              <textarea
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                rows={2}
                className={area}
                placeholder="Установка Android-магнитолы в Kia Rio 2017: рамка, проводка, сохранение кнопок на руле"
              />
              <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                Две-три строки живым языком. Их читает поисковик, когда
                показывает страницу в выдаче.
              </p>
            </div>

            {/* Товары */}
            <div className="border-t border-foreground pt-5">
              <span className={label}>Что стояло в этой машине</span>
              <p className="mb-3 text-[0.78rem] text-muted-foreground">
                Установка появится на страницах всех отмеченных товаров.
              </p>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск товара"
                className={`${field} mb-3`}
              />
              <div className="max-h-64 space-y-1 overflow-y-auto border border-border p-3">
                {shown.slice(0, 300).map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 py-1 text-[0.88rem]"
                  >
                    <input
                      type="checkbox"
                      checked={form.productIds.includes(p.id as number)}
                      onChange={() => toggleProduct(p.id as number)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="flex-1">{p.name}</span>
                    <span className="text-[0.72rem] uppercase tracking-[0.08em] text-muted-foreground">
                      {p.category}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-[0.78rem] text-muted-foreground">
                Выбрано: {form.productIds.length}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 border-t border-foreground pt-5 sm:grid-cols-2">
              <div>
                <span className={label}>Своё название — если нужно</span>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  className={field}
                  placeholder={autoTitle || 'Соберётся из машины'}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 self-end pb-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-[0.9rem]">Показывать на сайте</span>
              </label>
            </div>

            {error && <div className="text-[0.85rem] text-primary">{error}</div>}

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={busy}
                className="flex flex-1 items-center justify-between bg-foreground px-6 py-4 font-head text-[0.9rem] font-bold uppercase text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                {busy ? 'Загружаем фото…' : 'Сохранить'}
                <Icon name="Check" size={18} />
              </button>
              <button
                onClick={onClose}
                className="border border-foreground px-6 py-4 font-head text-[0.9rem] font-medium uppercase transition-colors hover:border-primary hover:text-primary"
              >
                Отмена
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ImageZoom src={zoom} onClose={() => setZoom(null)} />
    </>
  );
};

export default InstallEditor;