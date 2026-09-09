import { Article, ArticleBlock } from '@/data/catalog';
import { SITE_URL, SeoData } from '@/lib/seo';
import { crumbsJsonLd } from '@/components/Breadcrumbs';

const BRAND = 'ШТАТНО';

/** Обрезаем по границе слова, чтобы описание не обрывалось на полуслове */
const cut = (text: string, limit: number) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const part = clean.slice(0, limit);
  const space = part.lastIndexOf(' ');
  return `${part.slice(0, space > limit * 0.6 ? space : limit).trim()}…`;
};

/** Первый осмысленный текст статьи — из него собираем описание */
const firstText = (blocks: ArticleBlock[]): string => {
  for (const b of blocks) {
    if (b.type === 'text' && b.text.trim()) return b.text;
    if (b.type === 'quote' && b.text.trim()) return b.text;
  }
  return '';
};

/**
 * Мета-теги статьи.
 *
 * Всё, что автор не заполнил руками, собирается само: title из
 * заголовка с названием сайта, описание — из первого абзаца. Как только
 * поле заполнено в редакторе, автоподстановка отступает.
 */
export const articleTitle = (a: Article) =>
  a.metaTitle.trim() || `${a.h1.trim() || a.title} | ${BRAND}`;

export const articleDescription = (a: Article) =>
  a.metaDescription.trim() ||
  cut(a.excerpt.trim() || firstText(a.blocks ?? []), 158);

export const articleHeading = (a: Article) => a.h1.trim() || a.title;

/** Разметка для поисковика: сама статья, хлебные крошки и вопрос-ответ */
export const articleJsonLd = (a: Article) => {
  const faq = (a.blocks ?? []).flatMap((b) =>
    b.type === 'faq' ? b.items.filter((x) => x.q.trim() && x.a.trim()) : [],
  );

  const out: Record<string, unknown>[] = [
    crumbsJsonLd([{ label: 'Статьи', to: '/articles' }, { label: a.title }]),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: articleHeading(a),
      description: articleDescription(a),
      image: a.cover || undefined,
      datePublished: a.publishedAt || undefined,
      dateModified: a.publishedAt || undefined,
      author: { '@type': 'Organization', name: BRAND },
      publisher: { '@type': 'Organization', name: BRAND },
      mainEntityOfPage: `${SITE_URL}/articles/${a.slug}`,
    },
  ];

  if (faq.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((x) => ({
        '@type': 'Question',
        name: x.q,
        acceptedAnswer: { '@type': 'Answer', text: x.a },
      })),
    });
  }

  return out;
};

export const articleSeo = (a: Article): SeoData => ({
  title: articleTitle(a),
  description: articleDescription(a),
  image: a.cover || undefined,
  canonical: `${SITE_URL}/articles/${a.slug}`,
  type: 'article',
  jsonLd: articleJsonLd(a),
});
