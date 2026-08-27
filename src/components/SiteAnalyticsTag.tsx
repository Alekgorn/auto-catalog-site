import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCatalog } from '@/context/CatalogContext';
import { metrikaId, webmasterCode } from '@/lib/site-settings';
import { SITE_URL } from '@/lib/seo';

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

/**
 * Считаем визит только на боевом адресе.
 *
 * Сайт открывается ещё в двух местах: на localhost во время разработки и
 * на черновом домене превью, где идёт правка через админку. Счётчик там
 * срабатывал тоже, и заходы владельца с разработчиком подмешивались к
 * настоящим клиентам — визиты, отказы и глубина просмотра врали тем
 * сильнее, чем активнее правился сайт.
 *
 * Сверяем именно адрес, а не режим сборки: превью собирается как боевая
 * версия, и по NODE_ENV его от настоящего сайта не отличить.
 */
const isLiveSite = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  // Домен записан кириллицей, браузер отдаёт его в виде xn--…
  const live = SITE_URL.replace(/^https?:\/\//, '');
  return host === live || host === `www.${live}`;
};

/**
 * Подключает Метрику и мета-тег Вебмастера по данным из админки.
 *
 * Раньше номер счётчика был вшит в index.html — сменить его можно было
 * только правкой кода. Теперь он приходит из настроек, поэтому скрипт
 * добавляем на лету и ровно один раз за визит.
 */
const SiteAnalyticsTag = () => {
  const { analytics } = useCatalog();
  const { pathname, search } = useLocation();

  const id = isLiveSite() ? metrikaId(analytics.metrika) : '';
  const code = webmasterCode(analytics.webmaster);

  /* Мета-тег подтверждения прав: Вебмастер читает его при проверке.
     На пререндеренных страницах он уже вшит, здесь — для надёжности */
  useEffect(() => {
    if (!code) return;
    let tag = document.querySelector<HTMLMetaElement>(
      'meta[name="yandex-verification"]',
    );
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'yandex-verification';
      document.head.appendChild(tag);
    }
    if (tag.content !== code) tag.content = code;
  }, [code]);

  useEffect(() => {
    if (!id || window.ym) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);

    // Очередь вызовов до загрузки скрипта — так советует сама Метрика
    window.ym =
      window.ym ||
      function (...args: unknown[]) {
        (window.ym as unknown as { a: unknown[][] }).a =
          (window.ym as unknown as { a?: unknown[][] }).a || [];
        (window.ym as unknown as { a: unknown[][] }).a.push(args);
      };

    window.ym(Number(id), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: analytics.webvisor,
    });
  }, [id, analytics.webvisor]);

  /*
   * Сайт одностраничный: смена раздела не перезагружает страницу, и без
   * этого Метрика засчитала бы весь визит как один просмотр.
   */
  useEffect(() => {
    if (!id || !window.ym) return;
    window.ym(Number(id), 'hit', pathname + search);
  }, [id, pathname, search]);

  if (!id) return null;

  return (
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/${id}`}
          style={{ position: 'absolute', left: '-9999px' }}
          alt=""
        />
      </div>
    </noscript>
  );
};

export default SiteAnalyticsTag;