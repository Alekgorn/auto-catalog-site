/**
 * Разбор ссылки на видео товара.
 *
 * Магазин хранит один и тот же videoUrl двух разных типов: свой файл на
 * CDN (плеер — обычный <video>) или ссылка на YouTube/Rutube (плеер —
 * iframe с их же встраиванием). Здесь одна функция решает, что это за
 * ссылка и как её показывать — компонентам разбираться в этом не нужно.
 */

export type VideoKind = 'file' | 'youtube' | 'rutube';

export interface ParsedVideo {
  kind: VideoKind;
  /** Для youtube/rutube — адрес их плеера для iframe; для file — сам файл */
  src: string;
}

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
const RUTUBE_HOSTS = ['rutube.ru', 'www.rutube.ru'];

const youtubeId = (u: URL): string | null => {
  if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
  if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
  if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
  return u.searchParams.get('v');
};

const rutubeId = (u: URL): string | null => {
  // Обычная ссылка: rutube.ru/video/{id}/, встроенная: rutube.ru/play/embed/{id}
  const parts = u.pathname.split('/').filter(Boolean);
  const at = parts.indexOf('video');
  if (at >= 0 && parts[at + 1]) return parts[at + 1];
  const embedAt = parts.indexOf('embed');
  if (embedAt >= 0 && parts[embedAt + 1]) return parts[embedAt + 1];
  return null;
};

/** Разбирает адрес видео товара. Пусто или нераспознанное — null. */
export const parseVideo = (raw: string | null | undefined): ParsedVideo | null => {
  const value = String(raw ?? '').trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (YOUTUBE_HOSTS.includes(url.hostname)) {
    const id = youtubeId(url);
    if (!id) return null;
    return { kind: 'youtube', src: `https://www.youtube.com/embed/${id}` };
  }

  if (RUTUBE_HOSTS.includes(url.hostname)) {
    const id = rutubeId(url);
    if (!id) return null;
    return { kind: 'rutube', src: `https://rutube.ru/play/embed/${id}` };
  }

  // Всё остальное — свой файл: он лежит на нашем CDN после загрузки
  return { kind: 'file', src: value };
};

/** Похоже ли на ссылку YouTube/Rutube — используется в админке для подсказки */
export const isVideoLink = (raw: string): boolean => {
  const parsed = parseVideo(raw);
  return parsed?.kind === 'youtube' || parsed?.kind === 'rutube';
};
