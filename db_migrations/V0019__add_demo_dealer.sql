-- Тестовый дилер для проверки режима. Номер можно удалить в админке.
INSERT INTO t_p61203256_auto_catalog_site.dealers (phone, name, comment)
VALUES ('79119639671', 'Тестовый дилер', 'Пример записи — можно удалить')
ON CONFLICT (phone) DO NOTHING;
