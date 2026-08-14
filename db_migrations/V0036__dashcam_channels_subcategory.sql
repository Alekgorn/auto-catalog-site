-- Тип регистратора: по числу каналов записи
UPDATE t_p61203256_auto_catalog_site.products
SET subcategory = 'Одноканальные'
WHERE slug IN ('videoregistrator-full-hd-shtatnoe-mesto', 'videoregistrator-radar-detektorom-gps');

UPDATE t_p61203256_auto_catalog_site.products
SET subcategory = 'Двухканальные'
WHERE slug = 'videoregistrator-zerkalo-kameroy-zadnego';

INSERT INTO t_p61203256_auto_catalog_site.products
(slug, name, category, subcategory, price, old_price, warranty, badge, images, description, specs, kit, fits, sort_order, sku, popularity, stock)
VALUES
('videoregistrator-dvuhkanalnyy-salonnoy-kameroy',
 'Видеорегистратор двухканальный с салонной камерой',
 'Видеорегистраторы', 'Двухканальные', 6900, 8400, '1 год', NULL,
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/a31666ff-1782-4809-aba8-74860ea280c7.jpg"]'::jsonb,
 '["Две камеры в одном корпусе: основная снимает дорогу впереди в Full HD, вторая разворачивается и пишет салон. Выбор таксистов и тех, кто часто возит пассажиров — спорную ситуацию в машине тоже видно.","Обе записи ведутся одновременно и хранятся отдельными файлами. Инфракрасная подсветка салона снимает в полной темноте, не слепя пассажиров."]'::jsonb,
 '[["Разрешение:","Full HD 1920x1080 + HD салон"],["Каналы:","2 (дорога и салон)"],["Подсветка салона","инфракрасная"],["Карта памяти","до 256 ГБ"]]'::jsonb,
 '["Регистратор","Крепление на стекло","Кабель питания 3,5 м","Инструкция"]'::jsonb,
 '{}'::jsonb, 23, 'gw-dvr2ch', 880, 'на складе'),

('videoregistrator-kompaktnyy-1080p-wifi',
 'Видеорегистратор компактный 1080p с Wi-Fi',
 'Видеорегистраторы', 'Одноканальные', 3400, 4500, '1 год', NULL,
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/a31666ff-1782-4809-aba8-74860ea280c7.jpg"]'::jsonb,
 '["Совсем небольшой корпус без экрана — прячется за зеркалом и из салона почти не виден. Настройка и просмотр роликов идут через приложение на телефоне по Wi-Fi.","Нужный фрагмент скачивается на смартфон за пару минут прямо на месте происшествия — не нужно вынимать карту памяти и искать компьютер."]'::jsonb,
 '[["Разрешение:","Full HD 1920x1080, 30 к/с"],["Каналы:","1 (дорога)"],["Wi-Fi","есть, приложение"],["Угол обзора","150 градусов"]]'::jsonb,
 '["Регистратор","Крепление 3M","Кабель питания 3,5 м","Инструкция"]'::jsonb,
 '{}'::jsonb, 19, 'gw-dvrwifi', 860, 'на складе');
