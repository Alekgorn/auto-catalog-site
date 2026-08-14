-- Временный товар для проверки переноса чужих картинок.
-- Удаляется следующей миграцией сразу после проверки.
INSERT INTO products (slug, sku, name, category, price, images, is_active)
VALUES (
    'zzz-proverka-perenosa-foto',
    'ZZZ-TEST-IMG',
    'Проверка переноса фото',
    'Другое',
    100,
    '["https://www.gstatic.com/webp/gallery/1.jpg", "https://example.com/net-takoy-kartinki.jpg", "https://cdn.poehali.dev/projects/x/bucket/catalog/uzhe-nash.webp"]'::jsonb,
    FALSE
)
ON CONFLICT (slug) DO NOTHING;
