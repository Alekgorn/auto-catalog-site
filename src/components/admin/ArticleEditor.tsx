import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArticleBlock } from '@/data/catalog';
import { AdminProduct } from '@/components/admin/ProductEditor';
import { uploadImage } from '@/components/admin/BlocksEditor';
import ArticleBlocksEditor from '@/components/admin/ArticleBlocksEditor';
import ImageZoom, { keepOpenOnZoom } from '@/components/admin/ImageZoom';
import { articleDescription, articleTitle } from '@/lib/article-seo';

export interface AdminArticle {
  id?: number;
  slug?: string;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  cover: string;
  blocks: ArticleBlock[];
  tags: string[];
  publishedAt: string;
  sortOrder: number;
  isActive: boolean;
}

export const emptyArticle = (): AdminArticle => ({
  title: '',
  h1: '',
  metaTitle: '',
  metaDescription: '',
  excerpt: '',
  cover: '',
  blocks: [{ type: 'text', text: '' }],
  tags: [],
  publishedAt: new Date().toISOString().slice(0, 10),
  sortOrder: 100,
  isActive: true,
});

interface Props {
  article: AdminArticle;
  products: AdminProduct[];
  onClose: () => void;
  onSave: (a: AdminArticle) => void;
}

const label = 'eyebrow block mb-1';
const field =
  'w-full border-b border-border bg-transparent py-2 outline-none transition-colors focus:border-primary';
const area =
  'w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary';

/** Сколько знаков влезает в выдачу — за этой чертой текст обрежется */
const TITLE_LIMIT = 70;
const DESC_LIMIT = 160;

/**
 * Разбирает вставленный текст на блоки.
 *
 * Статью обычно пишут в редакторе документов и переносят целиком.
 * Вручную раскладывать двадцать абзацев — работа на полчаса, поэтому
 * короткие строки без точки на конце считаем подзаголовками, строки с
 * дефисом или цифрой в начале — списком, остальное абзацами.
 */
const parseText = (raw: string): ArticleBlock[] => {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out: ArticleBlock[] = [];
  let list: string[] = [];
  let ordered = false;

  const flush = () => {
    if (list.length) out.push({ type: 'list', items: list, ordered });
    list = [];
  };

  lines.forEach((line) => {
    const bullet = /^[-–—•*]\s+/.test(line);
    const numbered = /^\d+[.)]\s+/.test(line);

    if (bullet || numbered) {
      if (list.length && ordered !== numbered) flush();
      ordered = numbered;
      list.push(line.replace(/^([-–—•*]|\d+[.)])\s+/, ''));
      return;
    }

    flush();

    const short = line.length < 70;
    const noEnd = !/[.!?:;,]$/.test(line);
    const headingMark = /^#{1,3}\s+/.test(line);

    if (headingMark) {
      out.push({ type: 'heading', text: line.replace(/^#+\s+/, ''), level: 2 });
    } else if (short && noEnd) {
      out.push({ type: 'heading', text: line, level: 2 });
    } else {
      out.push({ type: 'text', text: line });
    }
  });

  flush();
  return out;
};

/**
 * Редактор статьи.
 *
 * Мета-заголовок и описание заполняются сами из названия и первого
 * абзаца — их можно не трогать. Но если под статью собрано семантическое
 * ядро, поля открыты: вписанное руками всегда важнее подстановки.
 */
const ArticleEditor = ({ article, products, onClose, onSave }: Props) => {
  const [form, setForm] = useState<AdminArticle>({
    ...article,
    blocks: article.blocks?.length ? article.blocks : [{ type: 'text', text: '' }],
    tags: article.tags ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  const set = <K extends keyof AdminArticle>(key: K, value: AdminArticle[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* Что увидит поисковик, если поля оставить пустыми */
  const preview = useMemo(() => {
    const stub = {
      slug: form.slug ?? '',
      title: form.title,
      h1: form.h1,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      excerpt: form.excerpt,
      cover: form.cover,
      blocks: form.blocks,
      tags: form.tags,
      publishedAt: form.publishedAt,
    };
    return {
      title: articleTitle(stub),
      description: articleDescription(stub),
    };
  }, [form]);

  const submit = () => {
    if (!form.title.trim()) {
      setError('Укажите заголовок статьи');
      return;
    }
    setError(null);
    onSave({ ...form, blocks: form.blocks.filter(Boolean) });
  };

  const counter = (value: string, limit: number) => (
    <span
      className={`text-[0.72rem] ${
        value.length > limit ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {value.length} / {limit}
    </span>
  );

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        {...keepOpenOnZoom}
        className="max-h-[92vh] max-w-4xl gap-0 overflow-y-auto rounded-none border-foreground p-0"
      >
        <div className="sticky top-0 z-10 border-b border-foreground bg-primary px-6 py-5 text-primary-foreground">
          <div className="text-[0.7rem] uppercase tracking-[0.16em] opacity-80">
            {form.id ? 'Редактирование статьи' : 'Новая статья'}
          </div>
          <div className="mt-1 font-head text-xl font-bold uppercase tracking-tight">
            {form.title || 'Без названия'}
          </div>
        </div>

        <div className="space-y-8 px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className={label}>Заголовок статьи</span>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={field}
                placeholder="Сравнение TDA7708 и Si4755: какой FM-тюнер лучше"
              />
            </div>

            <div className="sm:col-span-2">
              <span className={label}>Краткое описание для списка статей</span>
              <textarea
                value={form.excerpt}
                rows={2}
                onChange={(e) => set('excerpt', e.target.value)}
                className={area}
                placeholder="Один-два предложения — их видно в карточке статьи"
              />
            </div>

            <div>
              <span className={label}>Дата публикации</span>
              <input
                type="date"
                value={(form.publishedAt || '').slice(0, 10)}
                onChange={(e) => set('publishedAt', e.target.value)}
                className={field}
              />
            </div>

            <div>
              <span className={label}>Порядок</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', Number(e.target.value))}
                className={field}
              />
            </div>

            <label className="flex cursor-pointer items-end gap-3 pb-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-[0.9rem]">Показывать на сайте</span>
            </label>
          </div>

          {/* ── Поисковая выдача ── */}
          <div className="border border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow">Как статья выглядит в поиске</span>
            </div>

            <div className="mt-4 max-w-[38em] bg-card p-4">
              <div className="text-[0.72rem] text-muted-foreground">
                {form.slug ? `сайт.рф/articles/${form.slug}` : 'сайт.рф/articles/…'}
              </div>
              <div className="mt-1 font-head text-[1.05rem] leading-snug text-primary">
                {preview.title}
              </div>
              <div className="mt-1 text-[0.83rem] leading-snug text-muted-foreground">
                {preview.description || 'Описание появится из первого абзаца'}
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className={label}>Заголовок на странице (H1)</span>
                </div>
                <input
                  value={form.h1}
                  onChange={(e) => set('h1', e.target.value)}
                  className={field}
                  placeholder={form.title || 'По умолчанию — заголовок статьи'}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className={label}>Мета-заголовок (title)</span>
                  {counter(preview.title, TITLE_LIMIT)}
                </div>
                <input
                  value={form.metaTitle}
                  onChange={(e) => set('metaTitle', e.target.value)}
                  className={field}
                  placeholder="Пусто — соберём из заголовка"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className={label}>Мета-описание (description)</span>
                  {counter(preview.description, DESC_LIMIT)}
                </div>
                <textarea
                  value={form.metaDescription}
                  rows={2}
                  onChange={(e) => set('metaDescription', e.target.value)}
                  className={area}
                  placeholder="Пусто — возьмём краткое описание или первый абзац"
                />
              </div>

              <div>
                <span className={label}>Адрес страницы</span>
                <input
                  value={form.slug ?? ''}
                  onChange={(e) => set('slug', e.target.value)}
                  className={field}
                  placeholder="Пусто — составим из заголовка"
                />
              </div>
            </div>
          </div>

          {/* ── Обложка ── */}
          <div>
            <span className={label}>Обложка</span>
            <div className="mt-2 flex items-center gap-4">
              {form.cover ? (
                <div className="relative">
                  <button
                    onClick={() => setZoom(form.cover)}
                    aria-label="Открыть обложку"
                    className="block cursor-zoom-in border border-transparent transition-colors hover:border-primary"
                  >
                    <img
                      src={form.cover}
                      alt=""
                      className="h-24 w-32 bg-card object-cover"
                    />
                  </button>
                  <button
                    onClick={() => set('cover', '')}
                    aria-label="Удалить обложку"
                    className="absolute -right-2 -top-2 bg-primary p-1 text-primary-foreground"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-[0.68rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                  <Icon name="Plus" size={18} />
                  Загрузить
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      const url = await uploadImage(file);
                      setBusy(false);
                      if (url) set('cover', url);
                    }}
                  />
                </label>
              )}
              {busy && (
                <span className="text-[0.78rem] uppercase tracking-[0.1em] text-primary">
                  Загружаем…
                </span>
              )}
            </div>
          </div>

          {/* ── Быстрая вставка готового текста ── */}
          <div className="border border-dashed border-border p-4">
            <button
              onClick={() => setShowPaste((v) => !v)}
              className="flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name={showPaste ? 'ChevronDown' : 'ChevronRight'} size={14} />
              Вставить готовый текст целиком
            </button>

            {showPaste && (
              <div className="mt-4 space-y-3">
                <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
                  Скопируйте статью из документа и вставьте сюда — она
                  разложится на абзацы, подзаголовки и списки. Дальше
                  поправите руками: добавите таблицы, товары и призыв.
                </p>
                <textarea
                  value={paste}
                  rows={7}
                  onChange={(e) => setPaste(e.target.value)}
                  className={area}
                  placeholder="Вставьте текст статьи"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const parsed = parseText(paste);
                      if (!parsed.length) return;
                      const current = form.blocks.filter(
                        (b) => !(b.type === 'text' && !b.text.trim()),
                      );
                      set('blocks', [...current, ...parsed]);
                      setPaste('');
                      setShowPaste(false);
                    }}
                    disabled={!paste.trim()}
                    className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.06em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
                  >
                    Разложить на блоки
                  </button>
                </div>
              </div>
            )}
          </div>

          <ArticleBlocksEditor
            blocks={form.blocks}
            onChange={(next) => set('blocks', next)}
            products={products}
          />

          {error && (
            <div className="border border-primary px-4 py-3 text-[0.85rem] text-primary">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-foreground bg-background px-6 py-4">
          <button
            onClick={onClose}
            className="border border-border px-5 py-2.5 text-[0.78rem] uppercase tracking-[0.08em] transition-colors hover:border-foreground"
          >
            Отмена
          </button>
          <button
            onClick={submit}
            className="bg-foreground px-6 py-2.5 font-head text-[0.78rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Сохранить
          </button>
        </div>

        <ImageZoom src={zoom} onClose={() => setZoom(null)} />
      </DialogContent>
    </Dialog>
  );
};

export default ArticleEditor;
