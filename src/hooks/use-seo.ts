import { useEffect } from 'react';
import { SeoData, applySeo } from '@/lib/seo';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Ставит мета-теги страницы. В браузере — после отрисовки,
 * при сборке статики — сразу, чтобы генератор вшил их в HTML.
 */
export const useSeo = (data: SeoData | null) => {
  if (!isBrowser && data) applySeo(data);

  useEffect(() => {
    if (data) applySeo(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);
};
