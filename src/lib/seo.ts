export const SITE_URL = 'https://xn--80a0adnb7a.xn--p1ai';

export interface SeoData {
  title: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
}

/**
 * До какой даты цена считается действительной. Без этого поля поисковик
 * считает цену протухшей и может не показать её в сниппете. Берём месяц
 * вперёд: прайс обновляется чаще, а страницы пересобираются при каждой
 * выгрузке, так что дата всегда свежая.
 */
export const priceValidUntil = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

/** Собранное при сборке SEO — читается генератором статики. */
const collected = new Map<string, SeoData>();

export const collectSeo = (key: string, data: SeoData) => collected.set(key, data);
export const takeSeo = (key: string): SeoData | undefined => collected.get(key);
export const clearSeo = () => collected.clear();

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    const [key, val] = selector.replace(/[[\]"]/g, '').split('=');
    el.setAttribute(key.replace('meta', '').trim() || 'name', val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const JSON_LD_ID = 'seo-json-ld';

/**
 * В браузере проставляет title, description, OG-теги и микроразметку.
 * При сборке складывает данные в память — генератор вшивает их прямо в HTML.
 */
export const applySeo = (data: SeoData, key = 'current') => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    collectSeo(key, data);
    return;
  }

  const { title, description, image, canonical, type = 'website', jsonLd } = data;
  document.title = title;

  if (description) {
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:description"]', 'content', description);
  }
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:type"]', 'content', type);
  if (image) {
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[name="twitter:image"]', 'content', image);
  }

  const url = canonical ?? window.location.origin + window.location.pathname;
  setMeta('meta[property="og:url"]', 'content', url);
  setLink('canonical', url);

  document.getElementById(JSON_LD_ID)?.remove();
  if (jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = JSON_LD_ID;
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
};