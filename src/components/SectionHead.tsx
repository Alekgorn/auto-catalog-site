interface Props {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  note?: React.ReactNode;
}

const SectionHead = ({ index, eyebrow, title, note }: Props) => (
  <div className="grid grid-cols-1 gap-x-6 gap-y-4 py-10 md:grid-cols-12 md:py-14">
    <div className="flex items-start gap-4 md:col-span-5">
      <span className="font-head text-[0.72rem] font-medium tracking-[0.16em] text-primary">
        {index}
      </span>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-3 font-head text-3xl font-bold uppercase leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-5xl">
          {title}
        </h2>
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