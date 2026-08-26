import Icon from '@/components/ui/icon';
import {
  SiteAnalytics,
  metrikaId,
  webmasterCode,
} from '@/lib/site-settings';

interface Props {
  value: SiteAnalytics;
  onChange: (patch: Partial<SiteAnalytics>) => void;
}

const input =
  'w-full border-b border-border bg-transparent py-2.5 text-[0.95rem] outline-none transition-colors focus:border-primary';

/**
 * Счётчики Яндекса. Ключевое здесь — не заставлять человека выковыривать
 * номер из скрипта: он вставляет что скопировал, а нужное достаём сами
 * и тут же показываем, что именно распознали.
 */
const AnalyticsPanel = ({ value, onChange }: Props) => {
  const id = metrikaId(value.metrika);
  const code = webmasterCode(value.webmaster);

  return (
    <div>
      <div className="eyebrow">Аналитика</div>
      <h2 className="mt-3 font-head text-2xl font-bold uppercase tracking-[-0.02em]">
        Сервисы Яндекса
      </h2>
      <p className="mt-4 max-w-[34em] text-muted-foreground">
        Метрика показывает посещаемость и записывает действия посетителей,
        Вебмастер отвечает за показ сайта в поиске. Поля можно оставить
        пустыми — тогда счётчик просто не подключится.
      </p>

      {/*
        Коды попадают на сайт только при сборке. Без публикации Яндекс
        видит прошлую версию страниц и счётчиков не находит — на этом
        уже спотыкались, поэтому предупреждение стоит над полями.
      */}
      <div className="mt-8 flex gap-3 border-2 border-primary bg-primary/5 px-4 py-3.5">
        <Icon
          name="TriangleAlert"
          fallback="CircleAlert"
          size={18}
          className="mt-0.5 flex-none text-primary"
        />
        <div className="min-w-0 text-[0.85rem] leading-relaxed">
          <span className="block font-head text-[0.9rem] font-bold uppercase tracking-tight">
            После сохранения опубликуйте сайт
          </span>
          <span className="mt-1 block text-muted-foreground">
            Одного сохранения мало: коды попадают на страницы только при
            публикации. Пока сайт не опубликован, Метрика и Вебмастер
            счётчиков не увидят.
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <label className="block">
          <span className="eyebrow">Яндекс.Метрика</span>
          <input
            value={value.metrika}
            placeholder="Номер счётчика, например 101026698"
            onChange={(e) => onChange({ metrika: e.target.value })}
            className={input}
          />
          <span className="mt-2 block text-[0.8rem] text-muted-foreground">
            {value.metrika.trim() ? (
              id ? (
                <span className="flex items-center gap-1.5 text-success">
                  <Icon name="Check" size={13} className="flex-none" />
                  Счётчик № {id} — подключим при сохранении
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-destructive">
                  <Icon name="TriangleAlert" fallback="CircleAlert" size={13} className="flex-none" />
                  Не нашли номер счётчика. Нужны цифры из адреса Метрики
                </span>
              )
            ) : (
              'Метрика → Настройки → номер счётчика. Можно вставить и весь код целиком — номер достанем сами'
            )}
          </span>
        </label>

        {/* Вебвизор пишет клики и прокрутку. Штука полезная, но не всем
            нужная — пусть выключается, не трогая сам счётчик */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={value.webvisor}
            onChange={(e) => onChange({ webvisor: e.target.checked })}
            className="mt-1 h-4 w-4 flex-none accent-primary"
          />
          <span className="min-w-0">
            <span className="block text-[0.95rem]">Вебвизор</span>
            <span className="block text-[0.8rem] text-muted-foreground">
              Запись движений мыши и прокрутки: видно, где посетители
              застревают. Работает только вместе с Метрикой
            </span>
          </span>
        </label>

        <label className="block">
          <span className="eyebrow">Яндекс.Вебмастер</span>
          <input
            value={value.webmaster}
            placeholder='Код подтверждения или мета-тег целиком'
            onChange={(e) => onChange({ webmaster: e.target.value })}
            className={input}
          />
          <span className="mt-2 block text-[0.8rem] text-muted-foreground">
            {value.webmaster.trim() ? (
              <span className="flex items-center gap-1.5 text-success">
                <Icon name="Check" size={13} className="flex-none" />
                Код {code.slice(0, 24)}
                {code.length > 24 ? '…' : ''} появится на всех страницах
              </span>
            ) : (
              'Вебмастер → Права → Мета-тег. Скопируйте строку целиком — код выделим сами'
            )}
          </span>
        </label>
      </div>

      <div className="mt-8 flex gap-2.5 border border-border px-4 py-3.5 text-[0.85rem] text-muted-foreground">
        <Icon name="Info" size={16} className="mt-0.5 flex-none text-primary" />
        <span>
          Порядок такой: сохранить → опубликовать сайт → нажать «Проверить»
          в Вебмастере. Метрика начнёт собирать данные сразу после
          публикации, первые цифры появятся в течение получаса.
        </span>
      </div>
    </div>
  );
};

export default AnalyticsPanel;