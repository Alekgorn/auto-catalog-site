ALTER TABLE t_p61203256_auto_catalog_site.products
  ADD COLUMN IF NOT EXISTS sku VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS popularity INTEGER NOT NULL DEFAULT 0;

UPDATE t_p61203256_auto_catalog_site.products
SET sku = upper(slug)
WHERE sku = '';

CREATE INDEX IF NOT EXISTS idx_products_sku ON t_p61203256_auto_catalog_site.products (sku);

CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO t_p61203256_auto_catalog_site.settings (key, value) VALUES
('card_fields', '["mount","warranty"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
