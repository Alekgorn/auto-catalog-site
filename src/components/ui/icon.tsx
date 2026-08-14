import React from 'react';
import { LucideProps } from 'lucide-react';
import { ICONS } from '@/components/ui/icons';

interface IconProps extends LucideProps {
  name: string;
  fallback?: string;
}

/**
 * Иконка по имени.
 *
 * Берём из подготовленного набора: подключать всю библиотеку ради сотни
 * картинок дорого — это полмегабайта кода на каждого посетителя.
 * Нужной иконки нет в наборе — добавьте её в icons.ts.
 */
const Icon: React.FC<IconProps> = ({
  name,
  fallback = 'CircleAlert',
  ...props
}) => {
  const IconComponent = ICONS[name] ?? ICONS[fallback];

  if (!IconComponent) {
    return <span className="text-xs text-muted-foreground">[icon]</span>;
  }

  return <IconComponent {...props} />;
};

export default Icon;
