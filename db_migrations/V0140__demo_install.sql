-- Показательная установка для проверки вёрстки: без записей блок на
-- главной не отображается, и проверить его нельзя. Скрыта от
-- посетителей (is_active = FALSE) — владелец удалит её из админки,
-- когда заведёт настоящие работы.
INSERT INTO t_p61203256_auto_catalog_site.installs
    (slug, brand, model, year, title, excerpt, before_image, after_image,
     gallery, video, comment, place_name, place_address, place_note,
     place_coords, place_shown, sort_order, is_active)
VALUES (
    'primer-ustanovki-kia-rio',
    'Kia', 'Rio', 2017,
    'Kia Rio 2017',
    'Пример записи: как выглядит установка на сайте.',
    'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/bucket/catalog/003c981ecd954e65a45bd3186a5b25db.webp',
    'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/bucket/catalog/015de7e1fe334d1489e524b9ef30db7c.webp',
    '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/bucket/catalog/014135e30d624986b6f8eebd2f4e1b80.webp"]'::jsonb,
    '',
    'Кнопки на руле сохранены, штатная камера подхватилась без адаптера.',
    'Автозвук на Ленина',
    'Санкт-Петербург, Ленина 15',
    'Работают с этой маркой не первый год, есть стенд для проверки кнопок на руле.',
    '59.939095, 30.315868',
    TRUE, 100, FALSE
)
ON CONFLICT (slug) DO NOTHING;
