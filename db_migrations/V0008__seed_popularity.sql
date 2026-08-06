UPDATE t_p61203256_auto_catalog_site.products SET popularity = 90 WHERE badge = 'Хит';
UPDATE t_p61203256_auto_catalog_site.products SET popularity = 70 WHERE badge = 'Акция';
UPDATE t_p61203256_auto_catalog_site.products SET popularity = 40 WHERE badge IS NULL AND popularity = 0;
