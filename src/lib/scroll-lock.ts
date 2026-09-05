/**
 * Запрет прокрутки страницы под открытым окном.
 *
 * Считаем открытые окна, а не пишем в стиль напрямую. Раньше каждое окно
 * при закрытии сбрасывало запрет в пустую строку — и если под ним было
 * открыто второе окно (быстрый просмотр и корзина, фото и карточка),
 * страница за ним снова начинала прокручиваться. Отпускаем только когда
 * закрылось последнее окно.
 */
let depth = 0;
let saved = '';

/** Запрещает прокрутку. Возвращает функцию, снимающую запрет. */
export const lockScroll = (): (() => void) => {
  if (typeof document === 'undefined') return () => {};

  if (depth === 0) {
    saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  depth += 1;

  let released = false;
  return () => {
    /* Защита от повторного вызова: React в строгом режиме прогоняет
       уборку дважды, и счётчик ушёл бы в минус */
    if (released) return;
    released = true;

    depth = Math.max(0, depth - 1);
    if (depth === 0) document.body.style.overflow = saved;
  };
};
