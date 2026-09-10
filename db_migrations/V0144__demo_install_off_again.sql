-- Проверку закончили — прячем пример обратно. Запись и её привязки
-- остаются в базе как образец заполнения; владелец удалит их из
-- админки, когда заведёт настоящие работы.
UPDATE t_p61203256_auto_catalog_site.installs
   SET is_active = FALSE
 WHERE slug = 'primer-ustanovki-kia-rio';
