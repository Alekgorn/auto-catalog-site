-- Приводим SEO-адреса Android магнитол в соответствие с новыми названиями.
-- Меняем только те 4 товара, где адрес разошёлся с названием после переименования.
UPDATE t_p61203256_auto_catalog_site.products
SET slug = 'android-magnitola-9-dyuymov-6-128-gb-carplay'
WHERE id = 247 AND slug = 'android-magnitola-11-dyuymov-6-128-gb-carplay';

UPDATE t_p61203256_auto_catalog_site.products
SET slug = 'android-magnitola-topway-ts105-9-4-64-gb-ips-2k'
WHERE id = 1366 AND slug = '9-dyuymovaya-android-magnitola-topway-ts105-8-yader-2-7-ggc';

UPDATE t_p61203256_auto_catalog_site.products
SET slug = 'android-magnitola-topway-ts105-10-4-64-gb-ips-2k'
WHERE id = 1367 AND slug = '10-dyuymovaya-android-magnitola-topway-ts105-8-yader-2-7-ggc';

UPDATE t_p61203256_auto_catalog_site.products
SET slug = 'android-magnitola-topway-ts105-9-6-128-gb-ips-2k'
WHERE id = 1368 AND slug = '9-dyuymovaya-android-magnitola-topway-ts105-8-yader-2-7-gg-2';
