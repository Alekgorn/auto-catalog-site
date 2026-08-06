UPDATE t_p61203256_auto_catalog_site.products
SET is_active = FALSE
WHERE category IN ('Фаркопы', 'Багажники', 'Пороги', 'Защита', 'Салон', 'Электроника')
   OR name ILIKE '%фаркоп%';

UPDATE t_p61203256_auto_catalog_site.categories
SET is_active = FALSE
WHERE name IN ('Фаркопы', 'Багажники', 'Пороги', 'Защита', 'Салон');
