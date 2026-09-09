INSERT INTO t_p61203256_auto_catalog_site.articles
 (slug, title, h1, meta_title, meta_description, excerpt, blocks, tags, published_at, sort_order, is_active)
SELECT
 'sravnenie-tda7708-i-si4755',
 'Сравнение TDA7708 и Si4755: какой FM-тюнер для автомобиля лучше',
 'Сравнение радиомодулей TDA7708 и Si4755: какой FM-тюнер для автомобиля лучше?',
 'Сравнение TDA7708 и Si4755: какой радиомодуль для авто лучше | Характеристики и обзор',
 'Сравнение радиомодулей TDA7708 от STMicroelectronics и Si4755 от Silicon Labs. Характеристики, качество приёма, применение в автомобильных магнитолах. Какой чип выбрать?',
 'Разбираем два самых популярных радиочипа в автомагнитолах: чем отличаются, что с качеством приёма и стоит ли переплачивать.',
 '[]'::jsonb,
 '["радиомодуль", "обзор"]'::jsonb,
 '2026-09-10', 10, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM t_p61203256_auto_catalog_site.articles
  WHERE slug = 'sravnenie-tda7708-i-si4755'
);
