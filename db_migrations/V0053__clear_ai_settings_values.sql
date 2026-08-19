-- ИИ-поиск удалён из проекта, эти две настройки больше не читаются кодом.
-- Обнуляем их значения, чтобы в выгрузке настроек не оставалось мусора.
UPDATE settings SET value = '""'::jsonb WHERE key = 'ai_search_provider';

UPDATE settings SET value = '""'::jsonb WHERE key = 'yandex_folder_id';