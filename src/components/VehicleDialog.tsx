import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import SearchSelect from '@/components/SearchSelect';
import { Vehicle, YEARS } from '@/data/catalog';
import { useCatalog } from '@/context/CatalogContext';

interface Props {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onApply: (v: Vehicle) => void;
}

/** Выбор машины прямо в каталоге — без перехода к форме внизу страницы. */
const VehicleDialog = ({ open, vehicle, onClose, onApply }: Props) => {
  const { brands: BRANDS } = useCatalog();
  const [brand, setBrand] = useState(vehicle?.brand ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(String(vehicle?.year ?? 2021));

  // При каждом открытии показываем текущую машину
  useEffect(() => {
    if (!open) return;
    setBrand(vehicle?.brand ?? '');
    setModel(vehicle?.model ?? '');
    setYear(String(vehicle?.year ?? 2021));
  }, [open, vehicle]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const models = useMemo(
    () => BRANDS.find((b) => b.name === brand)?.models ?? [],
    [brand, BRANDS],
  );

  if (!open) return null;

  const ready = brand && model && year;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    onApply({ brand, model, year: Number(year) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/50"
      />

      <div className="relative w-full max-w-xl bg-surface p-6 shadow-panel sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Подбор по автомобилю</div>
            <h2 className="mt-2 font-head text-2xl font-bold uppercase leading-tight tracking-[-0.02em]">
              Сменить автомобиль
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex-none p-1 text-muted-foreground transition-colors hover:text-primary"
          >
            <Icon name="X" size={22} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6">
          <div className="border-t border-foreground py-4">
            <SearchSelect
              id="dlg-brand"
              label="Марка"
              value={brand}
              options={BRANDS.map((b) => b.name)}
              placeholder="Введите марку"
              emptyText="Такой марки нет — напишите нам"
              onChange={(b) => {
                setBrand(b);
                setModel(BRANDS.find((x) => x.name === b)?.models[0] ?? '');
              }}
            />
          </div>

          <div className="border-t border-border py-4">
            <SearchSelect
              id="dlg-model"
              label="Модель"
              value={model}
              options={models}
              placeholder="Введите модель"
              emptyText="Модель не найдена"
              onChange={setModel}
            />
          </div>

          <div className="border-y border-border py-4">
            <SearchSelect
              id="dlg-year"
              label="Год"
              value={year}
              options={YEARS.map(String)}
              placeholder="Год"
              emptyText="Нет такого года"
              onChange={setYear}
            />
          </div>

          <button
            type="submit"
            disabled={!ready}
            className="mt-6 flex w-full items-center justify-between bg-primary px-6 py-5 font-head text-base font-bold uppercase tracking-[0.02em] text-primary-foreground transition-colors hover:bg-foreground disabled:opacity-50"
          >
            <span>Показать оборудование</span>
            <span aria-hidden>→</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default VehicleDialog;
