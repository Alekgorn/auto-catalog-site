-- Ссылки на карточки товара в маркетплейсах.
ALTER TABLE t_p61203256_auto_catalog_site.products
    ADD COLUMN IF NOT EXISTS ozon_url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS wb_url TEXT NOT NULL DEFAULT '';
