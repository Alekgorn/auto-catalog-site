-- Временно включаем пример и привязываем к двум товарам, чтобы
-- проверить вкладку «Установки» на живой странице. Следующей
-- миграцией вернём в скрытые.
UPDATE t_p61203256_auto_catalog_site.installs
   SET is_active = TRUE
 WHERE slug = 'primer-ustanovki-kia-rio';

INSERT INTO t_p61203256_auto_catalog_site.install_products (install_id, product_id)
SELECT i.id, p.id
  FROM t_p61203256_auto_catalog_site.installs i
  CROSS JOIN t_p61203256_auto_catalog_site.products p
 WHERE i.slug = 'primer-ustanovki-kia-rio'
   AND p.id IN (333, 334)
ON CONFLICT DO NOTHING;
