-- Что подключает конкретная проводка — список отмеченных признаков.
--
-- Отдельная колонка, а не старая wire_tech: там значения были из трёх
-- состояний (да / нет / неважно), и смешивать их с галочками в одном
-- поле — верный способ однажды прочитать чужой формат и сломать подбор.
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS wire_features jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.wire_features IS
    'Отмеченные признаки подключения — id из справочника wire_features';

-- Переносим то немногое, что было размечено в старом формате: «да»
-- означало «проводка работает с этим», то есть галочку
UPDATE products
SET wire_features = (
    SELECT COALESCE(jsonb_agg(k), '[]'::jsonb)
    FROM jsonb_each_text(wire_tech) AS t(k, v)
    WHERE v = 'yes'
)
WHERE wire_tech IS NOT NULL
  AND wire_tech::text NOT IN ('{}', 'null');
