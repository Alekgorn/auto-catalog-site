-- Пример-заготовку прячем обратно: на сайте остаётся только настоящая
-- работа по Opel Corsa, которую завёл владелец.
UPDATE t_p61203256_auto_catalog_site.installs
   SET is_active = FALSE
 WHERE slug = 'primer-ustanovki-kia-rio';
