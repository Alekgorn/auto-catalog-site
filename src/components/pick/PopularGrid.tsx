interface Props {
  items: string[];
  value: string;
  onPick: (value: string) => void;
}

/**
 * Востребованные марки крупными плитками над общим списком.
 *
 * Спрос сильно смещён: на верхние марки приходится основная часть каталога,
 * поэтому большинству покупателей листать все 54 позиции не придётся вовсе.
 */
const PopularGrid = ({ items, value, onPick }: Props) => {
  if (!items.length) return null;
  return (
    <div className="flex-none border-b border-border px-3 pb-3 pt-2.5">
      <div className="px-1 pb-2 font-head text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Часто выбирают
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((name) => (
          <button
            key={name}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(name);
            }}
            className={`truncate border px-2.5 py-3 text-center font-head text-[0.82rem] font-bold tracking-tight transition-colors ${
              name === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:border-foreground hover:bg-muted'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PopularGrid;
