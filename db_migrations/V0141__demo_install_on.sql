-- Временно показываем пример, чтобы проверить вёрстку блока вживую.
-- Следующей миграцией вернём в скрытые.
UPDATE t_p61203256_auto_catalog_site.installs
   SET is_active = TRUE
 WHERE slug = 'primer-ustanovki-kia-rio';
