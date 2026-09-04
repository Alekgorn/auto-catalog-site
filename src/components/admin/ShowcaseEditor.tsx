import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { uploadImage } from '@/components/admin/BlocksEditor';
import { ShowcaseKit } from '@/lib/site-settings';
import { Product } from '@/data/catalog';
import { buildShareUrl, readShareParams } from '@/lib/share-kit';
import { useToast } from '@/hooks/use-toast';

interface Props {
  value: ShowcaseKit[];
  onChange: (list: ShowcaseKit[]) => void;
  products: Product[];
}

const input =
  'w-full border-b border-border bg-transparent py-2 text-[0.9rem] outline-none transition-colors focus:border-primary';

const money = (n: number) => `${n.toLocaleString('ru-RU')} \u20bd`;

/**
 * Витрина собранных комплектов.
 *
 * Заводится тремя способами, и все три ведут к одному составу: вставить
 * ссылку на сборку (её же отправляли клиенту в мессенджер), найти товары
 * поиском или собрать руками. Цену не храним — считаем по каталогу, иначе
 * витрина показывала бы вчерашнюю стоимость.
 */
const ShowcaseEditor = ({ value, onChange, products }: Props) => {
  const { toast } = useToast();
  const [query, setQuery] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const byId = useMemo(() => {
    const map: Record<string, Product> = {};
    products.forEach((p) => (map[p.id] = p));
    return map;
  }, [products]);

  const setAt = (i: number, patch: Partial<ShowcaseKit>) =>
    onChange(value.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  /* Ссылка на сборку — самый быстрый путь: состав уже собран в диалоге
     с клиентом, переносить руками его незачем */
  const pasteLink = (i: number, raw: string) => {
    const q = raw.slice(raw.indexOf('?'));
    const { lines } = readShareParams(q);
    const ids = lines.map((l) => l.id).filter((id) => byId[id]);
    if (!ids.length) {
      toast({
        title: 'Не разобрали ссылку',
        description: 'Нужен адрес вида /sborka?p=... с товарами из каталога',
      });
      return;
    }
    setAt(i, { ids });
    toast({ title: 'Состав перенесён', description: `Позиций: ${ids.length}` });
  };

  const addPhoto = async (i: number, file?: File) => {
    if (!file) return;
    setBusy(i);
    const url = await uploadImage(file);
    setBusy(null);
    if (url) setAt(i, { image: url });
  };

  return (
    <div>
      <div className="eyebrow">Главная страница</div>
      <h3 className="mt-3 font-head text-xl font-bold uppercase tracking-tight">
        Что мы уже собрали
      </h3>
      <p className="mt-3 max-w-[46em] text-muted-foreground">
        Витрина готовых решений вместо ленты новых товаров. Показывайте не
        самое свежее, а самое понятное: массовые машины, разные бюджеты. Простой
        заказ «рамка + проводка» здесь так же полезен, как комплект целиком —
        по нему человек узнаёт свою задачу. Цены и названия подтягиваются из
        каталога сами, отдельно их вести не нужно.
      </p>

      <div className="mt-6 space-y-5">
        {value.map((kit, i) => {
          const items = kit.ids.map((id) => byId[id]).filter(Boolean);
          const lost = kit.ids.filter((id) => !byId[id]);
          const total = items.reduce((s, p) => s + (p.price || 0), 0);
          const q = (query[i] ?? '').trim().toLowerCase();
          const found = q.length > 2
            ? products
                .filter(
                  (p) =>
                    !kit.ids.includes(p.id) &&
                    p.name.toLowerCase().includes(q),
                )
                .slice(0, 6)
            : [];

          return (
            <div key={i} className="border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <span className="eyebrow">Заголовок карточки</span>
                  <input
                    value={kit.title}
                    placeholder="Kia Rio 2017"
                    onChange={(e) => setAt(i, { title: e.target.value })}
                    className={input}
                  />
                </div>
                <div className="flex flex-none gap-1 pt-5">
                  <button
                    onClick={() => move(i, -1)}
                    className="border border-border p-2 transition-colors hover:border-primary"
                    title="Выше"
                  >
                    <Icon name="ChevronUp" size={15} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className="border border-border p-2 transition-colors hover:border-primary"
                    title="Ниже"
                  >
                    <Icon name="ChevronDown" size={15} />
                  </button>
                  <button
                    onClick={() => onChange(value.filter((_, x) => x !== i))}
                    className="border border-border p-2 text-destructive transition-colors hover:border-destructive"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="eyebrow">Срок поставки</span>
                  <input
                    value={kit.term ?? ''}
                    placeholder="Под заказ, 5–7 дней"
                    onChange={(e) => setAt(i, { term: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block">
                  <span className="eyebrow">Перенести состав из ссылки</span>
                  <input
                    placeholder="Вставьте ссылку /sborka?p=..."
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (v.includes('?')) {
                        pasteLink(i, v);
                        e.target.value = '';
                      }
                    }}
                    className={input}
                  />
                </label>
              </div>

              <div className="mt-4">
                <span className="eyebrow">Фото установки</span>
                <div className="mt-2 flex items-center gap-3">
                  {kit.image && (
                    <img
                      src={kit.image}
                      alt=""
                      className="h-16 w-16 flex-none border border-border object-cover"
                    />
                  )}
                  <label className="cursor-pointer border border-border px-3 py-2 text-[0.8rem] transition-colors hover:border-primary">
                    {busy === i ? 'Загружаем…' : kit.image ? 'Заменить' : 'Загрузить'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => addPhoto(i, e.target.files?.[0])}
                    />
                  </label>
                  {kit.image && (
                    <button
                      onClick={() => setAt(i, { image: '' })}
                      className="text-[0.8rem] text-muted-foreground underline"
                    >
                      Убрать
                    </button>
                  )}
                  <span className="text-[0.8rem] text-muted-foreground">
                    Без фото возьмём снимок первого товара
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <span className="eyebrow">
                  Состав — {items.length} поз., {money(total)}
                </span>

                <div className="mt-2 space-y-1.5">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 border border-border px-3 py-2 text-[0.85rem]"
                    >
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="flex-none text-muted-foreground">
                        {money(p.price)}
                      </span>
                      <button
                        onClick={() =>
                          setAt(i, { ids: kit.ids.filter((x) => x !== p.id) })
                        }
                        className="flex-none text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Товар могли удалить из каталога уже после того, как
                      карточку завели. Молчать нельзя: на сайте будет
                      неполный состав и заниженная цена */}
                  {lost.map((id) => (
                    <div
                      key={id}
                      className="flex items-center gap-2 border border-destructive px-3 py-2 text-[0.85rem] text-destructive"
                    >
                      <Icon name="TriangleAlert" size={14} className="flex-none" />
                      <span className="flex-1">
                        Товара больше нет в каталоге ({id}) — замените
                      </span>
                      <button
                        onClick={() =>
                          setAt(i, { ids: kit.ids.filter((x) => x !== id) })
                        }
                        className="flex-none"
                      >
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <input
                  value={query[i] ?? ''}
                  placeholder="Найти товар по названию…"
                  onChange={(e) =>
                    setQuery((s) => ({ ...s, [i]: e.target.value }))
                  }
                  className={`${input} mt-2`}
                />
                {found.length > 0 && (
                  <div className="mt-1 border border-border">
                    {found.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setAt(i, { ids: [...kit.ids, p.id] });
                          setQuery((s) => ({ ...s, [i]: '' }));
                        }}
                        className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-[0.85rem] last:border-0 hover:bg-surface"
                      >
                        <Icon name="Plus" size={14} className="flex-none" />
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="flex-none text-muted-foreground">
                          {money(p.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onChange([...value, { title: '', ids: [] }])}
        className="mt-5 inline-flex items-center gap-2 border border-foreground px-4 py-2.5 font-head text-[0.8rem] font-medium uppercase tracking-[0.08em] transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
      >
        <Icon name="Plus" size={15} />
        Добавить карточку
      </button>
    </div>
  );
};

/** Ссылка на комплект: собираем при сохранении, чтобы не хранить лишнее */
export const showcaseHref = (kit: ShowcaseKit): string =>
  buildShareUrl({
    lines: kit.ids.map((id) => ({ id, qty: 1 })),
    vehicle: null,
  });

export default ShowcaseEditor;
