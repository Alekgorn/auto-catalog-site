UPDATE t_p61203256_auto_catalog_site.settings
SET value = '{"metrika": "", "webmaster": "", "webvisor": true}'::jsonb,
    updated_at = NOW()
WHERE key = 'analytics';