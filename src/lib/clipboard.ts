/**
 * Кладёт строку в буфер обмена.
 *
 * Запасной путь нужен там, где родной буфер закрыт: сайт открыт не по
 * https, старый браузер, отказ в правах. Поле прячем за экраном, иначе
 * телефон прыгает к нему и подсвечивает текст, а readOnly не даёт
 * выскочить клавиатуре — без него на телефоне выделение не срабатывало.
 */
export const copyToClipboard = async (value: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* закрыт — пробуем запасным путём ниже */
  }

  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
};
