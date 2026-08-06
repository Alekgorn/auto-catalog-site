UPDATE t_p61203256_auto_catalog_site.products SET images = (
  CASE category
    WHEN 'Фаркопы' THEN '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/fcf688e9-5495-4909-be55-168c2564db75.jpg","https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/f2b8d406-8103-4372-93fb-79a0bef9cd0b.jpg"]'::jsonb
    WHEN 'Багажники' THEN '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/4bd3a1e3-6cdb-45c5-acb8-fd0a9f503bc5.jpg","https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/f2b8d406-8103-4372-93fb-79a0bef9cd0b.jpg"]'::jsonb
    WHEN 'Пороги' THEN '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/3022b2c3-6f89-48b6-b0ce-b9977c4ef7db.jpg","https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/f2b8d406-8103-4372-93fb-79a0bef9cd0b.jpg"]'::jsonb
    WHEN 'Защита' THEN '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/d0077366-191f-49c5-b2b3-f6fce4e87c4d.jpg","https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/f2b8d406-8103-4372-93fb-79a0bef9cd0b.jpg"]'::jsonb
    WHEN 'Салон' THEN '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/e38bb980-05fa-4ea9-a5f5-7dd8c8832c79.jpg","https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/f2b8d406-8103-4372-93fb-79a0bef9cd0b.jpg"]'::jsonb
    ELSE '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/080bcf61-fb74-4ef1-9fd2-ba14e17e180d.jpg","https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/f2b8d406-8103-4372-93fb-79a0bef9cd0b.jpg"]'::jsonb
  END
) WHERE images = '[]'::jsonb;

UPDATE t_p61203256_auto_catalog_site.products SET description = jsonb_build_array(
  name || ' — позиция из категории «' || lower(category) || '». Изделие рассчитано под конкретный кузов: геометрия повторяет заводские размеры, поэтому установка идёт в ' || mount || ' без сверления и вмешательства в силовые элементы.',
  'Комплект поставляется с крепежом и инструкцией. Среднее время работ в нашем сервисе — ' || install || '. После установки выдаём отметку в заказ-наряде, гарантия на изделие и работы — ' || warranty || '.',
  'Перед отправкой каждая позиция проверяется по контрольному образцу кузова, а совместимость с вашей машиной мы подтверждаем по VIN при подтверждении заказа.'
) WHERE description = '[]'::jsonb;

UPDATE t_p61203256_auto_catalog_site.products SET specs = jsonb_build_array(
  jsonb_build_array('Категория', category),
  jsonb_build_array('Точки крепления', mount),
  jsonb_build_array('Годы выпуска авто', year_from::text || '—' || year_to::text),
  jsonb_build_array('Время установки', install),
  jsonb_build_array('Гарантия', warranty),
  jsonb_build_array('Сверление кузова', 'не требуется'),
  jsonb_build_array('Артикул', upper(slug)),
  jsonb_build_array('Наличие', 'на складе')
) WHERE specs = '[]'::jsonb;

UPDATE t_p61203256_auto_catalog_site.products SET kit = jsonb_build_array(
  name,
  'Крепёжный комплект под штатные точки',
  'Инструкция по установке',
  'Гарантийный талон'
) WHERE kit = '[]'::jsonb;
