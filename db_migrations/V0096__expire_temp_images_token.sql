UPDATE t_p61203256_auto_catalog_site.admin_sessions
SET expires_at = NOW() - INTERVAL '1 day'
WHERE token = 'tmp-check-images-2026';