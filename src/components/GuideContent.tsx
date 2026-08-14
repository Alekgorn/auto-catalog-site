import Icon from '@/components/ui/icon';
import { Guide } from '@/data/catalog';

interface Props {
  guide: Guide;
  compact?: boolean;
}

const GuideContent = ({ guide, compact = false }: Props) => {
  let stepNo = 0;

  return (
    <div>
      {!compact && guide.cover && (
        <img
          src={guide.cover}
          alt={guide.title}
          className="mb-8 aspect-[16/7] w-full bg-card object-cover"
        />
      )}

      {(guide.duration || guide.difficulty || guide.tools?.length > 0) && (
        <div className="mb-8 grid grid-cols-1 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
          {guide.duration && (
            <div>
              <div className="eyebrow">Время работ</div>
              <div className="mt-1 font-head text-lg font-medium">{guide.duration}</div>
            </div>
          )}
          {guide.difficulty && (
            <div>
              <div className="eyebrow">Сложность</div>
              <div className="mt-1 font-head text-lg font-medium">{guide.difficulty}</div>
            </div>
          )}
          {guide.tools?.length > 0 && (
            <div>
              <div className="eyebrow">Инструмент</div>
              <div className="mt-1 text-[0.9rem] text-muted-foreground">
                {guide.tools.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-8">
        {guide.blocks?.map((b, i) => {
          if (b.type === 'text') {
            return (
              <p key={i} className="max-w-[46em] leading-relaxed text-muted-foreground">
                {b.text}
              </p>
            );
          }

          if (b.type === 'note') {
            return (
              <div
                key={i}
                className="flex max-w-[46em] items-start gap-3 border-l-2 border-primary bg-card px-5 py-4"
              >
                <Icon name="Info" size={17} className="mt-0.5 flex-none text-primary" />
                <span className="text-[0.92rem] leading-relaxed">{b.text}</span>
              </div>
            );
          }

          if (b.type === 'image') {
            return (
              <figure key={i}>
                <img
                  src={b.image}
                  alt={b.caption ?? ''}
                  loading="lazy"
                  decoding="async"
                  className="w-full bg-card"
                />
                {b.caption && (
                  <figcaption className="mt-2 text-[0.82rem] text-muted-foreground">
                    {b.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          stepNo += 1;
          return (
            <div key={i} className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <div className="flex items-baseline gap-4 border-t border-foreground pt-4">
                  <span className="font-head text-[0.72rem] font-medium tracking-[0.16em] text-primary">
                    {String(stepNo).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-head text-xl font-medium leading-tight tracking-tight">
                      {b.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{b.text}</p>
                  </div>
                </div>
              </div>
              {b.image && (
                <div className="md:col-span-5 md:col-start-8">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="aspect-[4/3] w-full bg-card object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuideContent;
