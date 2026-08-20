interface Props {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  /** Кнопки рядом с заголовком — например смена автомобиля */
  action?: React.ReactNode;
  /**
   * Уровень заголовка. На своей странице этот блок — главный заголовок (h1),
   * а внутри главной он лишь один из разделов, где h1 уже занят шапкой.
   * Меняется только тег: размер и начертание заданы классами.
   */
  as?: 'h1' | 'h2';
}

const SectionHead = ({
  index,
  eyebrow,
  title,
  note,
  action,
  as: Title = 'h2',
}: Props) => (
  <div className="grid grid-cols-1 gap-x-6 gap-y-4 py-10 md:grid-cols-12 md:py-14">
    <div className="flex items-start gap-4 md:col-span-5">
      <span className="font-head text-[0.72rem] font-medium tracking-[0.16em] text-primary">
        {index}
      </span>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <Title className="mt-3 hyphens-auto break-words font-head text-[1.75rem] font-bold uppercase leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
          {title}
        </Title>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
    {note && (
      <p className="max-w-[34em] text-muted-foreground md:col-span-6 md:col-start-7 md:pt-8">
        {note}
      </p>
    )}
  </div>
);

export default SectionHead;