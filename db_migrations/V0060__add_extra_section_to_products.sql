ALTER TABLE t_p61203256_auto_catalog_site.products
  ADD COLUMN IF NOT EXISTS extra jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE t_p61203256_auto_catalog_site.products
  ADD COLUMN IF NOT EXISTS extra_title character varying(160) NOT NULL DEFAULT ''::character varying;