-- Контакты для отправки фото торпедо: Telegram и MAX.
-- Поле max добавляем к существующим контактам, ничего не затирая.
UPDATE settings
SET value = value || '{"telegram": "https://t.me/Alekgorn", "max": "+79119639671"}'::jsonb
WHERE key = 'contacts';
