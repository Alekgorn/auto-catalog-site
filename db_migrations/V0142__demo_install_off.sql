-- Вёрстку проверили — прячем пример обратно. Запись остаётся в базе
-- как образец заполнения: видно, какие поля за что отвечают. Удалить
-- можно из админки одной кнопкой.
UPDATE t_p61203256_auto_catalog_site.installs
   SET is_active = FALSE
 WHERE slug = 'primer-ustanovki-kia-rio';
