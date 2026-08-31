import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import VideoPlayer from '@/components/VideoPlayer';
import { uploadVideo } from '@/lib/video-upload';
import { isVideoLink } from '@/lib/video';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

/**
 * Поле видео для админки: свой файл с компьютера или ссылка на
 * YouTube/Rutube.
 *
 * Одно и то же поле работает и в карточке товара, и в блоках инструкции,
 * поэтому логика загрузки живёт здесь, а не дублируется в каждом месте.
 * Оба варианта пишутся в одну строку — какой из них перед нами, решает
 * parseVideo по самой ссылке (src/lib/video.ts).
 */
const VideoField = ({ value, onChange }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const { url } = await uploadVideo(file, setProgress);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить видео');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {value && !uploading && (
        <div className="max-w-sm border border-border bg-surface">
          <VideoPlayer url={value} title="Предпросмотр" />
          <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
            <span className="truncate text-[0.75rem] text-muted-foreground">
              {isVideoLink(value) ? 'Ссылка на видеохостинг' : 'Свой файл'}
            </span>
            <button
              onClick={() => onChange('')}
              className="flex flex-none items-center gap-1 text-[0.75rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-primary"
            >
              <Icon name="Trash2" size={13} />
              Убрать
            </button>
          </div>
        </div>
      )}

      {uploading && (
        <div className="max-w-sm border border-border bg-surface p-3">
          <div className="flex items-center gap-2 text-[0.78rem] text-muted-foreground">
            <Icon name="Loader" size={14} className="animate-spin" />
            Загружаем видео — {Math.round(progress * 100)}%
          </div>
          <div className="mt-2 h-1.5 w-full bg-border">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!value && !uploading && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 border border-dashed border-border px-4 py-2.5 text-[0.78rem] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <Icon name="Upload" size={15} />
            Загрузить файл
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files)}
            />
          </label>
          <span className="text-[0.75rem] text-muted-foreground">или</span>
          <input
            type="url"
            placeholder="Ссылка на YouTube или Rutube"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) onChange(v);
            }}
            className="min-w-0 flex-1 border-b border-border bg-transparent py-2 text-[0.85rem] outline-none transition-colors focus:border-primary"
          />
        </div>
      )}

      {error && <p className="mt-2 text-[0.78rem] text-primary">{error}</p>}
    </div>
  );
};

export default VideoField;
