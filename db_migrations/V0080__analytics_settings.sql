INSERT INTO t_p61203256_auto_catalog_site.settings (key, value, updated_at)
VALUES ('analytics', '{"metrika": "101026698", "webmaster": "", "webvisor": true}'::jsonb, NOW())
ON CONFLICT (key) DO NOTHING;