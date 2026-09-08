import { useState } from 'react';
import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import DataAuditPanel from '@/components/admin/DataAuditPanel';
import FitsCheckPanel from '@/components/admin/FitsCheckPanel';
import KitAuditPanel from '@/components/admin/KitAuditPanel';
import WiringPanel from '@/components/admin/WiringPanel';
import FrameWiresPanel from '@/components/admin/FrameWiresPanel';
import WireTechPanel from '@/components/admin/WireTechPanel';
import WiringAuditPanel from '@/components/admin/WiringAuditPanel';
import WireSuggestPanel from '@/components/admin/WireSuggestPanel';
import VehicleCheckPanel from '@/components/admin/VehicleCheckPanel';

interface Props {
  products: AdminProduct[];
  brands: AdminBrand[];
  onEdit: (product: AdminProduct) => void;
  /** Счётчики для подписей — считаются на уровне админки */
  dataIssues: number;
  fitsIssues: number;
  /** Перечитать каталог после массовых правок */
  onReload?: () => void;
  /** Обновить проводки у рамок на месте, без перезапроса каталога */
  onPatchFrameWires?: (u: { id?: number; frameWires: string[] }[]) => void;
  /** Одно поле сразу многим товарам — без перезапроса каталога */
  onPatchMany?: (
    ids: (number | undefined)[],
    patch: Partial<AdminProduct>,
  ) => void;
}

type Section =
  | 'vehicle'
  | 'frames'
  | 'suggest'
  | 'tech'
  | 'cards'
  | 'fits'
  | 'kit'
  | 'audit-wires'
  | 'wiring';

/**
 * Проверка данных — одно место для всей диагностики каталога.
 *
 * Раньше это были четыре вкладки вразнобой в общем меню: расхождения в
 * карточках, совместимость, подбор проводки. Искать проблему приходилось
 * по всей админке, хотя занимаются этим за один заход. Теперь всё внутри
 * одного раздела, а верхнее меню стало короче.
 */
const DiagnosticsPanel = ({
  products,
  brands,
  onEdit,
  dataIssues,
  fitsIssues,
  onReload,
  onPatchFrameWires,
  onPatchMany,
}: Props) => {
  const [section, setSection] = useState<Section>('vehicle');

  const SECTIONS: { id: Section; label: string; count?: number; hint: string }[] =
    [
      {
        id: 'vehicle',
        label: 'Проверка по машине',
        hint: 'Что выйдет в подборе на конкретном авто и что там подозрительно',
      },
      {
        id: 'frames',
        label: 'Проводки к рамкам',
        hint: 'Какие проводки подходят к рамке — основа подбора',
      },
      {
        id: 'suggest',
        label: 'Подсказки связок',
        hint: 'Рамки без проводки и подходящие кандидаты — привязка в одно нажатие',
      },
      {
        id: 'tech',
        label: 'Признаки проводок',
        hint: 'Усилитель, камера, CAN — чем проводки отличаются друг от друга',
      },
      {
        id: 'cards',
        label: 'Расхождения в карточках',
        count: dataIssues,
        hint: 'Год в названии против поля, пустые описания, ошибки в цене',
      },
      {
        id: 'fits',
        label: 'Совместимость',
        count: fitsIssues,
        hint: 'Марки и модели, которых нет в справочнике',
      },
      {
        id: 'audit-wires',
        label: 'Сверка проводок',
        hint: 'Устаревшие списки моделей, годы против рамки, марка не в названии',
      },
      {
        id: 'kit',
        label: 'Комплект',
        hint: 'Связки рамка-проводка, разметка подбора, годы',
      },
      {
        id: 'wiring',
        label: 'Разметка через Excel',
        hint: 'Выгрузка и загрузка подбора проводки',
      },
    ];

  const active = SECTIONS.find((s) => s.id === section);

  return (
    <div className="py-8">
      <div className="max-w-[46em]">
        <div className="font-head text-xl font-bold uppercase tracking-tight">
          Проверка данных
        </div>
        <p className="mt-2 text-[0.87rem] leading-relaxed text-muted-foreground">
          {active?.hint}
        </p>
      </div>

      {/* Разделы диагностики */}
      <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 border-b border-border pb-3">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`border-b-2 pb-1.5 text-[0.78rem] uppercase tracking-[0.08em] transition-colors ${
              section === s.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
            {s.count ? ` (${s.count})` : ''}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {section === 'vehicle' && (
          <VehicleCheckPanel
            products={products}
            brands={brands}
            onEdit={onEdit}
          />
        )}
        {section === 'frames' && (
          <FrameWiresPanel
            products={products}
            onReload={onReload}
            onPatch={onPatchFrameWires}
            onEdit={onEdit}
          />
        )}
        {section === 'suggest' && (
          <WireSuggestPanel
            products={products}
            onReload={onReload}
            onPatch={onPatchFrameWires}
            onEdit={onEdit}
          />
        )}
        {section === 'tech' && (
          <WireTechPanel
            products={products}
            onReload={onReload}
            onPatchMany={onPatchMany}
            onEdit={onEdit}
          />
        )}
        {section === 'cards' && (
          <DataAuditPanel products={products} onEdit={onEdit} bare />
        )}
        {section === 'fits' && (
          <FitsCheckPanel
            products={products}
            brands={brands}
            onEdit={onEdit}
            bare
          />
        )}
        {section === 'kit' && (
          <KitAuditPanel
            products={products}
            brands={brands}
            onEdit={onEdit}
            onReload={onReload}
            onPatch={onPatchFrameWires}
          />
        )}
        {section === 'audit-wires' && (
          <WiringAuditPanel
            products={products}
            brands={brands}
            onEdit={onEdit}
          />
        )}
        {section === 'wiring' && <WiringPanel bare />}
      </div>
    </div>
  );
};

export default DiagnosticsPanel;
