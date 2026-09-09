import Icon from '@/components/ui/icon';
import { AdminArticle } from '@/components/admin/ArticleEditor';

interface Props {
  articles: AdminArticle[];
  onCreate: () => void;
  onEdit: (article: AdminArticle) => void;
  onRemove: (article: AdminArticle) => void;
}

const dateText = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Вкладка «Статьи»: список SEO-текстов с датой, статусом и действиями. */
const AdminArticlesTab = ({ articles, onCreate, onEdit, onRemove }: Props) => (
  <>
    <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[42em] text-muted-foreground">
        Статьи раздела «Полезное». Каждая — отдельная страница со своим
        адресом и мета-тегами: их видит поисковик. В текст можно вставлять
        товары из каталога и кнопку с призывом.
      </p>
      <button
        onClick={onCreate}
        className="flex flex-none items-center justify-center gap-2 bg-foreground px-5 py-3 font-head text-[0.8rem] font-bold uppercase tracking-[0.06em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Icon name="Plus" size={16} />
        Новая статья
      </button>
    </div>

    {articles.length === 0 ? (
      <div className="py-20 text-center text-muted-foreground">
        Статей пока нет
      </div>
    ) : (
      <div className="border-t border-foreground">
        {articles.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-4 border-b border-border py-4"
          >
            {a.cover ? (
              <img
                src={a.cover}
                alt=""
                className="h-14 w-20 flex-none bg-card object-cover"
              />
            ) : (
              <div className="flex h-14 w-20 flex-none items-center justify-center bg-card text-muted-foreground">
                <Icon name="FileText" size={18} />
              </div>
            )}

            <div className="min-w-[200px] flex-1">
              <div className="font-head text-[1rem] font-medium leading-tight">
                {a.title}
              </div>
              <div className="mt-1 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">
                {dateText(a.publishedAt)} · {a.blocks?.length ?? 0} блоков
                {a.metaTitle || a.metaDescription ? ' · мета вручную' : ''}
              </div>
            </div>

            {a.slug && a.isActive && (
              <a
                href={`/articles/${a.slug}`}
                target="_blank"
                rel="noreferrer"
                title="Открыть на сайте"
                aria-label="Открыть на сайте"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="ExternalLink" size={16} />
              </a>
            )}

            <span
              className={`px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.1em] ${
                a.isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground'
              }`}
            >
              {a.isActive ? 'На сайте' : 'Скрыта'}
            </span>

            <button
              onClick={() => onEdit(a)}
              className="border border-foreground px-4 py-2 text-[0.75rem] uppercase tracking-[0.08em] transition-colors hover:bg-foreground hover:text-background"
            >
              Изменить
            </button>
            <button
              onClick={() => onRemove(a)}
              aria-label="Удалить"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name="Trash2" size={17} />
            </button>
          </div>
        ))}
      </div>
    )}
  </>
);

export default AdminArticlesTab;
