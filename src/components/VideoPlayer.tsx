import { parseVideo } from '@/lib/video';

interface Props {
  url: string;
  title: string;
  className?: string;
  /** Ролик снят вертикально — шортс. Иначе получит чёрные поля по бокам */
  vertical?: boolean;
}

/**
 * Плеер видео товара: свой файл или встраивание YouTube/Rutube.
 *
 * Какой из них показать, решает parseVideo по самой ссылке — снаружи
 * достаточно передать videoUrl товара как есть, без разбора вручную.
 */
const VideoPlayer = ({
  url,
  title,
  className = '',
  vertical = false,
}: Props) => {
  /* Пропорции кадра: вертикальный ролик в горизонтальной рамке выглядит
     чужеродно — узкая картинка посреди чёрного поля */
  const ratio = vertical ? 'aspect-[9/16]' : 'aspect-video';
  const video = parseVideo(url);
  if (!video) return null;

  if (video.kind === 'file') {
    return (
      <video
        src={video.src}
        controls
        playsInline
        preload="metadata"
        className={`${ratio} w-full bg-foreground/5 ${className}`}
      >
        Ваш браузер не поддерживает видео.
      </video>
    );
  }

  return (
    <iframe
      src={video.src}
      title={`Видео: ${title}`}
      className={`${ratio} w-full border-0 ${className}`}
      allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
      allowFullScreen
    />
  );
};

export default VideoPlayer;
