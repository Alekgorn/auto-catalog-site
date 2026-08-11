import Icon from '@/components/ui/icon';
import { AdminProduct, SetField, label, field } from './product-types';

interface Props {
  form: AdminProduct;
  set: SetField;
  uploading: boolean;
  upload: (files: FileList | null) => void;
  missingFields: string[];
}

/** Вкладка «Описание и фото»: снимки, абзацы, характеристики, комплектация. */
const ProductContentTab = ({ form, set, uploading, upload, missingFields }: Props) => (
  <div className="space-y-7">
    <div>
      <span className={label}>Фотографии</span>
      <div className="mt-2 flex flex-wrap gap-3">
        {form.images.map((src, i) => (
          <div key={src + i} className="relative">
            <img src={src} alt="" className="h-24 w-24 bg-card object-contain p-1" />
            <button
              onClick={() =>
                set(
                  'images',
                  form.images.filter((_, idx) => idx !== i),
                )
              }
              aria-label="Удалить фото"
              className="absolute -right-2 -top-2 bg-primary p-1 text-primary-foreground"
            >
              <Icon name="X" size={12} />
            </button>
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Icon name={uploading ? 'Loader' : 'Plus'} size={18} />
          {uploading ? 'Грузим' : 'Добавить'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </div>
    </div>

    <div>
      <span className={label}>Описание (абзацы)</span>
      {form.description.map((d, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <textarea
            value={d}
            rows={3}
            onChange={(e) =>
              set(
                'description',
                form.description.map((x, idx) => (idx === i ? e.target.value : x)),
              )
            }
            className="w-full border border-border bg-transparent p-3 text-[0.9rem] outline-none transition-colors focus:border-primary"
          />
          <button
            onClick={() =>
              set(
                'description',
                form.description.filter((_, idx) => idx !== i),
              )
            }
            aria-label="Удалить абзац"
            className="h-fit text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => set('description', [...form.description, ''])}
        className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon name="Plus" size={14} />
        Абзац
      </button>
    </div>

    <div>
      <span className={label}>Характеристики</span>

      {missingFields.length > 0 && (
        <div className="mb-4 border border-border bg-surface-muted p-3">
          <div className="text-[0.78rem] text-muted-foreground">
            Для категории «{form.category}» не заполнены:
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingFields.map((f) => (
              <button
                key={f}
                onClick={() => set('specs', [...form.specs, [f, '']])}
                className="flex items-center gap-1.5 border border-foreground px-2.5 py-1.5 text-[0.78rem] transition-colors hover:border-primary hover:text-primary"
              >
                <Icon name="Plus" size={13} />
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.specs.map(([k, v], i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input
            value={k}
            placeholder="Название"
            onChange={(e) =>
              set(
                'specs',
                form.specs.map((s, idx) =>
                  idx === i ? [e.target.value, s[1]] : s,
                ) as [string, string][],
              )
            }
            className={field}
          />
          <input
            value={v}
            placeholder="Значение"
            onChange={(e) =>
              set(
                'specs',
                form.specs.map((s, idx) =>
                  idx === i ? [s[0], e.target.value] : s,
                ) as [string, string][],
              )
            }
            className={field}
          />
          <button
            onClick={() =>
              set(
                'specs',
                form.specs.filter((_, idx) => idx !== i),
              )
            }
            aria-label="Удалить"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => set('specs', [...form.specs, ['', '']])}
        className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon name="Plus" size={14} />
        Характеристика
      </button>
    </div>

    <div>
      <span className={label}>Комплектация</span>
      {form.kit.map((k, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input
            value={k}
            onChange={(e) =>
              set(
                'kit',
                form.kit.map((x, idx) => (idx === i ? e.target.value : x)),
              )
            }
            className={field}
          />
          <button
            onClick={() =>
              set(
                'kit',
                form.kit.filter((_, idx) => idx !== i),
              )
            }
            aria-label="Удалить"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => set('kit', [...form.kit, ''])}
        className="mt-1 flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
      >
        <Icon name="Plus" size={14} />
        Пункт
      </button>
    </div>
  </div>
);

export default ProductContentTab;
