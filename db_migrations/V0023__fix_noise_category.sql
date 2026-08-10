-- «Шумоизоляция» — самостоятельный раздел с товарами, а не выключенный подраздел.
UPDATE t_p61203256_auto_catalog_site.categories
SET parent_slug = '',
    is_active = TRUE,
    sort_order = 115,
    description = 'Виброизоляция и шумопоглотитель для дверей, арок и пола.',
    image = 'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/85ad6840-2087-4f1e-92c3-4a3f37eb8f50.jpg'
WHERE slug = 'shumoizolyaciya';

-- Ранее созданный дубль выключаем, чтобы не двоился в каталоге.
UPDATE t_p61203256_auto_catalog_site.categories
SET is_active = FALSE
WHERE slug = 'shumoizolyaciya-cat';
