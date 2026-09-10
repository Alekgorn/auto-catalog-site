-- Проверочная запись, сделанная при настройке сбора: обнуляем счётчик,
-- чтобы она не искажала статистику спроса. Саму строку не трогаем —
-- при первом реальном выборе Kia Rio 2017 счёт пойдёт с нуля.
UPDATE t_p61203256_auto_catalog_site.vehicle_picks
   SET hits = 0
 WHERE brand = 'Kia' AND model = 'Rio' AND year = 2017 AND place = 'home';
