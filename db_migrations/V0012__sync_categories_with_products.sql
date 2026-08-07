-- Старые категории не совпадают с товарами — прячем их
UPDATE t_p61203256_auto_catalog_site.categories
SET is_active = FALSE
WHERE name NOT IN (
    SELECT DISTINCT category
    FROM t_p61203256_auto_catalog_site.products
    WHERE category IS NOT NULL AND category <> ''
);

-- Добавляем те, что реально стоят у товаров
INSERT INTO t_p61203256_auto_catalog_site.categories (slug, name, sort_order)
SELECT
    'cat-' || ROW_NUMBER() OVER (ORDER BY src.category),
    src.category,
    (ROW_NUMBER() OVER (ORDER BY src.category)) * 10
FROM (
    SELECT DISTINCT category
    FROM t_p61203256_auto_catalog_site.products
    WHERE category IS NOT NULL AND category <> ''
) AS src
WHERE NOT EXISTS (
    SELECT 1 FROM t_p61203256_auto_catalog_site.categories c
    WHERE c.name = src.category
);

-- Уже существующие возвращаем в работу
UPDATE t_p61203256_auto_catalog_site.categories
SET is_active = TRUE
WHERE name IN (
    SELECT DISTINCT category
    FROM t_p61203256_auto_catalog_site.products
    WHERE category IS NOT NULL AND category <> ''
);
