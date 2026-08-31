import { parseVideo } from '@/lib/video';

interface Props {
  url: string;
  title: string;
  className?: string;
}

/**
 * Плеер видео товара: свой файл или встраивание YouTube/Rutube.
 *
 * Какой из них показать, решает parseVideo по самой ссылке — снаружи
 * достаточно передать videoUrl товара как есть, без разбора вручную.
 */
const VideoPlayer = ({ url, title, className = '' }: Props) => {
  const video = parseVideo(url);
  if (!video) return null;

  if (video.kind === 'file') {
    return (
      <video
        src={video.src}
        controls
        playsInline
        preload="metadata"
        className={`aspect-video w-full bg-foreground/5 ${className}`}
      >
        Ваш браузер не поддерживает видео.
      </video>
    );
  }

  return (
    <iframe
      src={video.src}
      title={`Видео: ${title}`}
      className={`aspect-video w-full border-0 ${className}`}
      allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
      allowFullScreen
    />
  );
};

export default VideoPlayer;
