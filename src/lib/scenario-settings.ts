import { Scenario, SCENARIOS } from '@/data/scenarios';

/**
 * Настройка карточки сценария из админки.
 *
 * Сами сценарии остаются в коде: в них зашита логика сборки комплекта,
 * подбор по диагонали, вопросы о проводке — это не текст, а поведение.
 * Отсюда правится только то, что видит покупатель: как называется
 * карточка, что на ней написано, в каком она порядке и из каких разделов
 * каталога берёт товары.
 */
export interface ScenarioOverride {
  /** Какой сценарий настраиваем */
  slug: string;
  /** Убран с главной. Страница остаётся доступной по прямой ссылке */
  hidden?: boolean;
  title?: string;
  text?: string;
  cta?: string;
  icon?: string;
  /**
   * Разделы каталога, из которых берутся товары. Пусто — остаётся то,
   * что задано в коде.
   */
  categories?: string[];
}

/**
 * Сценарий, который открывается по короткому адресу /catalog.
 * Держим отдельной строкой: он подставляется в маршруте и в ссылках,
 * и менять его в семи местах руками — прямой путь к расхождению.
 */
export const CATALOG_SLUG = 'vse-po-mashine';

/** Короткий адрес каталога — им подписаны все ссылки «Каталог» */
export const CATALOG_PATH = '/catalog';

/**
 * Сценарии, где состав разделов трогать нельзя.
 *
 * Подбор магнитолы идёт по шагам со своей сортировкой: рамка ищется под
 * диагональ выбранного экрана, проводка — под ответы о камере и
 * усилителе. Подменить здесь разделы значит сломать всю цепочку, поэтому
 * поле закрыто в редакторе, а не оставлено «на свой страх».
 */
export const LOCKED_CATEGORIES = ['ekran-nedorogo', 'ekran-premium'];

/**
 * Четвёрка на главной по умолчанию.
 *
 * Порядок не случайный: первым идёт комплект — на нём зарабатываем,
 * вторым рамка с проводкой — на неё идёт основной поток, дальше
 * универсальное оборудование и весь каталог. Остальные сценарии
 * скрыты с главной, но продолжают жить по своим адресам.
 */
export const DEFAULT_SCENARIOS: ScenarioOverride[] = [
  {
    slug: 'ekran-nedorogo',
    title: 'Магнитола с рамкой и проводкой',
    text: 'Соберём комплект на вашу машину — всё подойдёт друг к другу.',
    cta: 'Собрать комплект',
    icon: 'MonitorSmartphone',
  },
  {
    slug: 'registrator',
    title: 'Рамка и проводка на мою машину',
    text: '1300 рамок и 400 жгутов. Скажите марку — покажем, что встанет без доработки.',
    cta: 'Подобрать по авто',
    icon: 'Cable',
  },
  {
    slug: 'parkovka',
    title: 'Видеть всё вокруг',
    text: 'Камеры заднего вида, парктроники, регистраторы. Подходят к любой машине.',
    cta: 'Посмотреть решения',
    icon: 'ParkingCircle',
  },
  {
    slug: 'vse-po-mashine',
    title: 'Всё для моей машины',
    text: 'Весь каталог, отфильтрованный под ваш автомобиль.',
    cta: 'Смотреть всё',
    icon: 'LayoutGrid',
  },
  { slug: 'ekran-premium', hidden: true },
  { slug: 'obzor-360', hidden: true },
  { slug: 'remont-provodki', hidden: true },
  { slug: 'shumoizolyaciya', hidden: true },
];

/** Накладываем правки админки на сценарий из кода */
export const applyOverride = (
  base: Scenario,
  over?: ScenarioOverride,
): Scenario => {
  if (!over) return base;
  const locked = LOCKED_CATEGORIES.includes(base.slug);
  return {
    ...base,
    title: over.title?.trim() || base.title,
    text: over.text?.trim() || base.text,
    cta: over.cta?.trim() || base.cta,
    icon: over.icon?.trim() || base.icon,
    onlyCategories:
      !locked && over.categories?.length
        ? over.categories
        : base.onlyCategories,
  };
};

/**
 * Карточки для главной: в заданном порядке, без скрытых.
 *
 * Сценарий, которого нет в настройках, показываем как есть — иначе
 * добавленный в коде новый пропал бы с главной незаметно.
 */
export const visibleScenarios = (list: ScenarioOverride[]): Scenario[] => {
  const settings = list.length ? list : DEFAULT_SCENARIOS;
  const known = new Set(settings.map((o) => o.slug));

  const ordered = settings
    .map((o) => {
      const base = SCENARIOS.find((s) => s.slug === o.slug);
      return base && !o.hidden ? applyOverride(base, o) : null;
    })
    .filter((s): s is Scenario => !!s);

  const rest = SCENARIOS.filter((s) => !known.has(s.slug));
  return [...ordered, ...rest];
};

/** Сценарий по адресу — с учётом правок из админки */
export const scenarioWith = (
  base: Scenario,
  list: ScenarioOverride[],
): Scenario =>
  applyOverride(
    base,
    (list.length ? list : DEFAULT_SCENARIOS).find((o) => o.slug === base.slug),
  );
