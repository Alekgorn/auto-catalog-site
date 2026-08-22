/**
 * Значок марки: первая буква названия на своём цвете.
 *
 * Настоящих логотипов у нас нет, а рисовать их для 54 марок нельзя —
 * это чужие товарные знаки. Буква на постоянном цвете решает ту же задачу:
 * глаз цепляется за цветное пятно и находит нужную строку, не вчитываясь.
 */
interface Props {
  name: string;
  /** Строка подсвечена — значок делаем контрастным к красному фону */
  active?: boolean;
}

/** Спокойные, различимые между собой цвета */
const COLORS = [
  '#1f6feb', '#b45309', '#0f766e', '#7c3aed', '#be123c',
  '#0369a1', '#4d7c0f', '#a21caf', '#c2410c', '#0e7490',
  '#4338ca', '#9f1239',
];

/** Один и тот же цвет у марки при любом заходе — нужен устойчивый выбор */
const colorOf = (name: string): string => {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum = (sum * 31 + name.charCodeAt(i)) % 9973;
  return COLORS[sum % COLORS.length];
};

/** Первый знак названия: у «ГАЗ» это «Г», у «bZ4X» — «B» */
const initial = (name: string): string => {
  const ch = name.trim().charAt(0).toUpperCase();
  return ch || '?';
};

const BrandMark = ({ name, active = false }: Props) => (
  <span
    aria-hidden
    className={`flex h-6 w-6 flex-none items-center justify-center rounded-[3px] font-head text-[0.72rem] font-bold leading-none text-white ${
      active ? 'bg-primary-foreground/25' : ''
    }`}
    style={active ? undefined : { backgroundColor: colorOf(name) }}
  >
    {initial(name)}
  </span>
);

export default BrandMark;
