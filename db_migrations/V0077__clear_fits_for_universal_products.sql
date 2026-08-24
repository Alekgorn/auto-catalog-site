-- У товаров «подходит любой машине» перечень моделей не нужен: совместимость
-- задаётся самим типом подбора. Магнитолы и камеры дублировали весь справочник
-- (54 марки, 1369 моделей у каждой) — это ~125 КБ в каждой загрузке каталога.
UPDATE products p SET fits = '{}'::jsonb
FROM categories c
WHERE c.name = p.category
  AND p.fits <> '{}'::jsonb
  AND coalesce(nullif(p.fit_mode, ''), c.fit_mode, 'universal') = 'universal';