import Icon from "@/components/ui/icon";
import VehicleSelector from "@/components/VehicleSelector";
import PhotoToMessenger from "@/components/PhotoToMessenger";

interface Props {
  brand: string;
  model: string;
  year: string;
  onBrand: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onSubmit: () => void;
}

/**
 * Подбор по машине — первый блок главной. Это наше главное преимущество,
 * поэтому стоит выше поиска и сценариев. Рядом — отправка фото торпедо
 * в мессенджер для тех, кто не знает свою комплектацию.
 */
const Selection = (selector: Props) => (
  <div
    id="select"
    className="anchor-offset -mx-6 bg-surface px-6 md:-mx-14 md:px-14"
  >
    <div className="rule" />

    <div className="grid grid-cols-1 gap-x-6 gap-y-4 py-7 md:grid-cols-12 md:py-9">
      <div className="md:col-span-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex h-6 w-6 flex-none items-center justify-center bg-primary text-[0.72rem] font-bold text-primary-foreground">
            1
          </span>
          <span className="eyebrow !ml-0">Подбор по вашему автомобилю</span>
        </div>
        <h2 className="mt-3 font-head text-2xl font-bold uppercase leading-[1.06] tracking-[-0.025em] sm:text-3xl lg:text-4xl">
          Выбери свою машину – мы покажем только то, что{" "}
          <span className="text-primary">подходит</span>
        </h2>
      </div>

      <p className="max-w-[34em] self-end text-[0.9rem] leading-relaxed text-muted-foreground md:col-span-5">
        Мы не показываем «универсальное». Каждая позиция привязана к штатному
        разъёму и рамке: если товара нет в списке — значит, без переходника он к
        вашей машине не встанет.
      </p>
    </div>

    <div className="rule" />
    <VehicleSelector {...selector} buttonLabel="Подобрать" idPrefix="sel2" />
    <div className="rule-hair" />

    <div className="grid grid-cols-1 items-center gap-x-6 gap-y-4 py-6 md:grid-cols-12">
      <div className="md:col-span-7">
        <div className="flex items-center gap-2 font-head text-[1rem] font-bold uppercase tracking-tight">
          <Icon name="Camera" size={18} className="flex-none text-primary" />
          Не знаете свою комплектацию?
        </div>
        <p className="mt-2 max-w-[36em] text-[0.88rem] leading-relaxed text-muted-foreground">
          Сфотографируйте торпедо и штатную магнитолу, пришлите нам — определим
          комплектацию и подберём оборудование, которое точно встанет.
        </p>
      </div>
      <div className="md:col-span-5">
        <PhotoToMessenger compact hideHint />
      </div>
    </div>

    <div className="rule-hair" />
    <div className="h-6" />
  </div>
);

export default Selection;
