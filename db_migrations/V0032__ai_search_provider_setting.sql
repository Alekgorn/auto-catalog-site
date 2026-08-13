INSERT INTO settings (key, value, updated_at)
VALUES ('ai_search_provider', '"yandex"'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();