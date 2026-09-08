import { AdminBrand } from '@/components/admin/BrandsEditor';
import { AdminProduct } from '@/components/admin/product-editor/product-types';
import { auditProducts, RULE_TITLES } from '@/lib/data-audit';
import { auditKitProducts, KIT_RULE_TITLES } from '@/lib/kit-audit';
import { findYearGaps, findBrandMismatch, findStaleFits } from '@/lib/wiring-audit';
import { ALL_MODELS } from '@/lib/fits-match';

/**
 * Куда отнести находку. Группы — по тому, ЧТО чинить, а не по тому,
 * какая проверка нашла: человек ищет «где у меня дыры в карточках»,
 * а не «что сказал модуль сверки проводок».
 */
export type IssueGroup = 'card' | 'fits' | 'wiring';

export const GROUP_TITLES: Record<IssueGroup, string> = {
  card: 'Карточка товара',
  fits: 'Совместимость',
  wiring: 'Рамки и проводки',
};

export type IssueLevel = 'error' | 'warning';

export interface CatalogIssue {
  /** Ключ правила — по нему фильтруем список */
  rule: string;
  /** Понятное название правила для кнопки фильтра */
  title: string;
  group: IssueGroup;
  level: IssueLevel;
  /** Что показать в строке — обычно название товара */
  subject: string;
  /** Суть замечания */
  text: string;
  hint?: string;
  /** Карточку можно открыть в редакторе */
  product?: AdminProduct;
}

/**
 * Правила, которые ловят одно и то же в разных модулях.
 *
 * «Годы наоборот» проверяются и в карточках, и в комплекте; марка с
 * моделью — в совместимости и там же в комплекте. Раньше человек видел
 * один и тот же товар в двух вкладках и не понимал, две это проблемы
 * или одна. Оставляем первое вхождение, второе гасим.
 */
const KIT_DUPLICATES = new Set([
  'years-order',
  'no-brand',
  'no-model',
  'years',
  'no-fits',
]);

const groupOfCardRule = (rule: string): IssueGroup =>
  rule === 'no-fits' || rule === 'brand-no-models' ? 'fits' : 'card';

/**
 * Все находки каталога одним списком.
 *
 * Раньше это были пять вкладок с разными таблицами: расхождения в
 * карточках, совместимость, комплект, сверка проводок. Проблемы там
 * частично повторялись, а искать приходилось по всем пяти. Теперь один
 * список с фильтром — видно сразу и сколько всего, и что именно.
 */
export const collectIssues = (
  products: AdminProduct[],
  brands: AdminBrand[],
  onlyActive = true,
): CatalogIssue[] => {
  const out: CatalogIssue[] = [];

  /* ── Расхождения внутри карточки ── */
  auditProducts(products, onlyActive).forEach((row) =>
    row.issues.forEach((i) =>
      out.push({
        rule: i.rule,
        title: RULE_TITLES[i.rule] ?? i.rule,
        group: groupOfCardRule(i.rule),
        level: i.level,
        subject: row.product.name,
        text: i.text,
        hint: i.hint,
        product: row.product,
      }),
    ),
  );

  /* ── Марки и модели против справочника ── */
  const list = products.filter((p) => (onlyActive ? p.isActive : true));
  list.forEach((product) => {
    Object.entries(product.fits ?? {}).forEach(([brand, models]) => {
      if (!Array.isArray(models)) return;
      const ref = brands.find((b) => b.name === brand);

      if (!ref) {
        out.push({
          rule: 'unknown-brand',
          title: 'Марки нет в справочнике',
          group: 'fits',
          level: 'error',
          subject: product.name,
          text: `Марка «${brand}» не найдена в справочнике`,
          hint: 'Товар выпадет из подбора по этой марке. Проверьте написание или добавьте марку.',
          product,
        });
        return;
      }

      models.forEach((model) => {
        if (model === ALL_MODELS || ref.models.includes(model)) return;
        out.push({
          rule: 'unknown-model',
          title: 'Модели нет в справочнике',
          group: 'fits',
          level: 'warning',
          subject: product.name,
          text: `${brand}: модели «${model}» нет в справочнике`,
          hint: 'Подбор может найти её нечётким поиском, но лучше привести написание к справочнику.',
          product,
        });
      });
    });
  });

  /* ── Рамки и проводки ── */
  auditKitProducts(products, onlyActive).forEach((i) => {
    if (KIT_DUPLICATES.has(i.rule)) return;
    out.push({
      rule: i.rule,
      title: KIT_RULE_TITLES[i.rule] ?? i.rule,
      group: 'wiring',
      level: i.level,
      subject: i.title,
      text: i.text,
      hint: i.hint,
      product: i.product,
    });
  });

  /* ── Проводка не закрывает срок рамки ── */
  findYearGaps(list).forEach((g) =>
    out.push({
      rule: 'year-gap',
      title: 'Годы против рамки',
      group: 'wiring',
      level: 'warning',
      subject: g.wire.name,
      text: `Рамка «${g.frame.name}» ${g.frameYears[0]}–${g.frameYears[1]}, проводка ${g.wireYears[0]}–${g.wireYears[1]}`,
      hint: `Не закрыто: ${g.uncovered}. Часто это нормально — разные поколения электроники. Смотрим, нет ли опечатки в годах.`,
      product: g.wire,
    }),
  );

  /* ── Марка есть в совместимости, но не в названии ── */
  findBrandMismatch(list).forEach((m) =>
    out.push({
      rule: 'brand-not-in-name',
      title: 'Марки нет в названии',
      group: 'wiring',
      level: 'warning',
      subject: m.product.name,
      text: `В совместимости есть ${m.missing.join(', ')}, в названии их нет`,
      hint: 'Нормально для универсальных позиций. У переходника под конкретное авто — повод проверить разметку.',
      product: m.product,
    }),
  );

  /* ── Перечень моделей вместо метки «вся марка» ── */
  findStaleFits(list, brands).forEach((s) =>
    out.push({
      rule: 'stale-fits',
      title: 'Устаревший список моделей',
      group: 'fits',
      level: 'warning',
      subject: s.product.name,
      text: `${s.brand}: выбрано ${s.selected} из ${s.total} моделей`,
      hint: `Похоже, брали «всю марку» перечнем. Переведите на «Выбрать все» — новые модели подхватятся сами. Не хватает: ${s.missing.slice(0, 5).join(', ')}`,
      product: s.product,
    }),
  );

  /* Ошибки вперёд: с них и начинают разбор */
  return out.sort((a, b) => {
    const rank = (x: CatalogIssue) => (x.level === 'error' ? 0 : 1);
    return rank(a) - rank(b) || a.subject.localeCompare(b.subject);
  });
};
