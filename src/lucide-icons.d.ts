/**
 * Иконки подключаются по одной, а не всей библиотекой сразу.
 * У таких файлов в пакете нет описания типов — задаём его здесь.
 */
declare module 'lucide-react/dist/esm/icons/*' {
  import { FC } from 'react';
  import { LucideProps } from 'lucide-react';
  const Icon: FC<LucideProps>;
  export default Icon;
}
