import { Fragment, ReactNode } from 'react';

/**
 * Выделение жирным внутри абзаца.
 *
 * Слово оборачивается двумя звёздочками: **так**. Разметка простая
 * намеренно — её видно прямо в поле ввода, она переживает копирование
 * из документа и не ломает вёрстку, если автор забыл закрыть пару.
 */
export const renderRich = (text: string): ReactNode => {
  if (!text.includes('**')) return text;

  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, i) => {
    const match = /^\*\*([^*]+)\*\*$/.exec(part);
    return match ? (
      <strong key={i} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    );
  });
};

/** Тот же текст без разметки — для описаний и мета-тегов */
export const stripRich = (text: string) => text.replace(/\*\*/g, '');
