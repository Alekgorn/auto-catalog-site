-- Набор полей характеристик для категории: ["Экран", "Память", ...]
ALTER TABLE t_p61203256_auto_catalog_site.categories
    ADD COLUMN IF NOT EXISTS spec_fields JSONB NOT NULL DEFAULT '[]'::jsonb;
