-- Новые разделы каталога под сценарии использования:
-- видеорегистраторы, шумоизоляция и камеры 360.
-- Android-магнитолы и «Акустика и шумоизоляция» уже есть — включаем их в работу.

UPDATE t_p61203256_auto_catalog_site.categories
SET is_active = TRUE
WHERE slug IN ('golovnye-ustroystva', 'akustika-shumka', 'kamery-parktroniki');

INSERT INTO t_p61203256_auto_catalog_site.categories
  (slug, name, parent_slug, description, image, sort_order, is_active, spec_fields)
VALUES
  ('videoregistratory', 'Видеорегистраторы', '',
   'Видеорегистраторы в штатное место, на зеркало и с радар-детектором.',
   'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/a31666ff-1782-4809-aba8-74860ea280c7.jpg',
   45, TRUE, '["Разрешение:", "Экран:"]'::jsonb),
  ('shumoizolyaciya-cat', 'Шумоизоляция', '',
   'Виброизоляция и шумопоглотитель для дверей, арок и пола.',
   'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/85ad6840-2087-4f1e-92c3-4a3f37eb8f50.jpg',
   115, TRUE, '["Толщина:", "Площадь:"]'::jsonb),
  ('kamery-360', 'Камеры 360', '',
   'Системы кругового обзора: вид сверху и полный контроль вокруг авто.',
   'https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/1ce68f6d-90c1-440f-b766-2cf62e97f8a9.jpg',
   42, TRUE, '["Камеры:", "Разрешение:"]'::jsonb)
ON CONFLICT DO NOTHING;
