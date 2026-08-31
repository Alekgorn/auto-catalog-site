import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { adminFetch } from '@/lib/api';
import { SCENARIOS } from '@/data/scenarios';

interface CategoryRow {
  name: string;
  products: number;
}

/** Что не так с конкретной привязкой к разделу каталога */
type Trouble = 'missing' | 'empty' | null;

interface Source {
  /** Раздел каталога, откуда сценарий берёт товары */
  category: string;
  /** Товаров в этом разделе */
  products: number;
  trouble: Trouble;
  /** Для комплектов — номер шага, чтобы было понятно, где чинить */
  step?: string;
}

interface Checked {
  slug: string;
  title: string;
  heading: string;
  /** Собирает комплект по шагам, а не показывает выборку */
  isKit: boolean;
  /** Показывает весь каталог — проверять нечего */
  fullCatalog: boolean;
  sources: Source[];
  total: number;
  broken: number;
}

/**
 * Проверка сценариев.
 *
 * Сценарии на главной берут товары из разделов каталога по названию.
 * Стоит переименовать раздел или не завести его вовсе — и страница
 * молча покажет пустоту: покупатель приходит по заманчивой плитке и
 * упирается в ничто. Такую поломку невозможно заметить из админки,
 * поэтому она проверяется здесь.
 */
const ScenariosCheck = () => {
  const [cats, setCats] = useState<CategoryRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('?action=categories')
      .then((r) => r.json())
      .then((d) => setCats((d.categories ?? []) as CategoryRow[]))
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  }, []);

  const checked = useMemo<Checked[]>(() => {
    if (!cats) return [];
    const byName = new Map(cats.map((c) => [c.name, c.products]));

    return SCENARIOS.map((s) => {
      const sources: Source[] = [];

      const push = (category: string, step?: string) => {
        const found = byName.has(category);
        const products = byName.get(category) ?? 0;
        sources.push({
          category,
          products,
          trouble: !found ? 'missing' : products === 0 ? 'empty' : null,
          step,
        });
      };

      (s.onlyCategories ?? []).forEach((c) => push(c));
      (s.kit ?? []).forEach((k, i) => push(k.category, `Шаг ${i + 1}`));

      const total = sources.reduce((n, x) => n + x.products, 0);
      return {
        slug: s.slug,
        title: s.title,
        heading: s.heading,
        isKit: Boolean(s.kit?.length),
        fullCatalog: Boolean(s.fullCatalog),
        sources,
        total,
        broken: sources.filter((x) => x.trouble).length,
      };
    });
  }, [cats]);

  const troubled = checked.filter((c) => c.broken > 0).length;

  if (loading) {
    return (
      <div className="py-8 text-[0.85rem] text-muted-foreground">
        Проверяем сценарии…
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="font-head text-2xl font-bold uppercase tracking-tight">
        Проверка сценариев
      </h2>
      <p className="mt-1 max-w-[46em] text-[0.85rem] text-muted-foreground">
        Плитки на главной берут товары из разделов каталога. Если раздел
        переименован или пуст, покупатель попадёт на пустую страницу. Здесь
        видно, где это случилось.
      </p>

      <div
        className={`mt-5 flex items-start gap-3 border px-5 py-4 ${
          troubled > 0
            ? 'border-primary bg-card'
            : 'border-border bg-card'
        }`}
      >
        <Icon
          name={troubled > 0 ? 'TriangleAlert' : 'CircleCheck'}
          size={17}
          className={`mt-0.5 flex-none ${troubled > 0 ? 'text-primary' : 'text-success'}`}
        />
        <div className="text-[0.88rem]">
          {troubled > 0 ? (
            <>
              <span className="font-bold">
                Сценариев с проблемой: {troubled}
              </span>
              <span className="text-muted-foreground">
                {' '}
                — покупатели видят пустую страницу.
              </span>
            </>
          ) : (
            <>
              <span className="font-bold">Все сценарии работают</span>
              <span className="text-muted-foreground">
                {' '}
                — товары находятся в каждом.
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-px border border-border bg-border">
        {checked.map((c) => (
          <div key={c.slug} className="bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-head text-[1.05rem] font-bold">
                    {c.title}
                  </span>
                  {c.broken > 0 ? (
                    <span className="border border-primary px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary">
                      Не работает
                    </span>
                  ) : (
                    <span className="text-[0.7rem] uppercase tracking-[0.08em] text-success">
                      Работает
                    </span>
                  )}
                  {c.isKit && (
                    <span className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                      Сборка комплекта
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[0.78rem] text-muted-foreground">
                  Страница: «{c.heading}»
                </div>
              </div>
              <a
                href={`/search?s=${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-none items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-primary"
              >
                <Icon name="ExternalLink" size={13} />
                Открыть
              </a>
            </div>

            {c.fullCatalog ? (
              <div className="mt-3 text-[0.82rem] text-muted-foreground">
                Показывает весь каталог целиком — проверять нечего.
              </div>
            ) : (
              <div className="mt-3 space-y-1.5">
                {c.sources.map((src, i) => (
                  <div
                    key={`${src.category}-${i}`}
                    className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.82rem]"
                  >
                    <Icon
                      name={src.trouble ? 'CircleX' : 'CircleCheck'}
                      size={14}
                      className={`flex-none ${src.trouble ? 'text-primary' : 'text-success'}`}
                    />
                    {src.step && (
                      <span className="text-muted-foreground">{src.step}:</span>
                    )}
                    <span className={src.trouble ? 'text-primary' : ''}>
                      {src.category}
                    </span>
                    {src.trouble === 'missing' && (
                      <span className="text-muted-foreground">
                        — такого раздела в каталоге нет
                      </span>
                    )}
                    {src.trouble === 'empty' && (
                      <span className="text-muted-foreground">
                        — раздел есть, но товаров в нём нет
                      </span>
                    )}
                    {!src.trouble && (
                      <span className="text-muted-foreground">
                        {src.products}{' '}
                        {src.products === 1
                          ? 'товар'
                          : src.products < 5
                            ? 'товара'
                            : 'товаров'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-5 max-w-[46em] text-[0.8rem] leading-relaxed text-muted-foreground">
        Названия разделов у сценариев прописаны в коде сайта. Если раздел
        нужно переименовать или связать сценарий с другим — скажите мне, я
        поправлю.
      </p>
    </div>
  );
};

export default ScenariosCheck;
