ALTER TABLE t_p61203256_auto_catalog_site.products
  ADD COLUMN IF NOT EXISTS level_key character varying(32) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS products_level_key_idx
  ON t_p61203256_auto_catalog_site.products (level_key);