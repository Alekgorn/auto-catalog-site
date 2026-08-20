-- Чистка справочника марок: мусор от импорта и недостающие модели

-- Склейки и опечатки в названиях моделей
UPDATE t_p61203256_auto_catalog_site.brands
SET models = (models - 'Delica Delica D2') || '["Delica D2"]'::jsonb
WHERE name = 'Mitsubishi' AND models @> '["Delica Delica D2"]';

UPDATE t_p61203256_auto_catalog_site.brands
SET models = (models - '600 (W100).') || '["600 (W100)"]'::jsonb
WHERE name = 'Mercedes-Benz' AND models @> '["600 (W100)."]';

-- Модели, которые есть в товарах, но отсутствовали в справочнике
UPDATE t_p61203256_auto_catalog_site.brands
SET models = models || '["Sienta"]'::jsonb
WHERE name = 'Toyota' AND NOT models @> '["Sienta"]';

UPDATE t_p61203256_auto_catalog_site.brands
SET models = models || '["GS"]'::jsonb
WHERE name = 'Lexus' AND NOT models @> '["GS"]';

UPDATE t_p61203256_auto_catalog_site.brands
SET models = models || '["ix45"]'::jsonb
WHERE name = 'Hyundai' AND NOT models @> '["ix45"]';

UPDATE t_p61203256_auto_catalog_site.brands
SET models = models || '["Spike"]'::jsonb
WHERE name = 'Honda' AND NOT models @> '["Spike"]';

UPDATE t_p61203256_auto_catalog_site.brands
SET models = models || '["Grand Commander"]'::jsonb
WHERE name = 'Jeep' AND NOT models @> '["Grand Commander"]';
