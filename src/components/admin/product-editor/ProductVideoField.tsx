import VideoField from '@/components/admin/VideoField';
import { label } from './product-types';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

/**
 * Видео товара: свой файл со своего компьютера или ссылка на YouTube/Rutube.
 *
 * Само поле общее с блоками инструкций (VideoField) — здесь только
 * заголовок и пояснение, зачем оно нужно в карточке товара.
 */
const ProductVideoField = ({ value, onChange }: Props) => (
  <div>
    <span className={label}>Видео</span>
    <p className="mt-1 text-[0.78rem] text-muted-foreground">
      Загрузите файл со своего компьютера или вставьте ссылку на YouTube
      либо Rutube — на карточке товара оно проиграется прямо на странице.
    </p>
    <div className="mt-3">
      <VideoField value={value} onChange={onChange} />
    </div>
  </div>
);

export default ProductVideoField;
