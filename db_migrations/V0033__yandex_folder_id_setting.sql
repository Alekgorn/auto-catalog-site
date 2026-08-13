INSERT INTO settings (key, value, updated_at)
VALUES ('yandex_folder_id', '"b1gg6d5ivqn1ud08uglm"'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();