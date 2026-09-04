-- Выводим из работы поля старой схемы подбора проводок.
--
-- Их сменили две вещи попроще: галочки wire_features («что проводка
-- подключает») и wire_hint («что написать покупателю» у рамки). Старые
-- поля остались после трёх подходов подряд и только путали — в карточке
-- жили два справочника с похожими названиями.
--
-- Удалить сами колонки платформа не разрешает (защита от потери данных),
-- поэтому чистим содержимое и помечаем поля как устаревшие. Из кода и
-- карточки товара они убраны полностью, читать их больше некому.
--
-- Проверено перед очисткой: ни один товар не держится на wire_level в
-- одиночку — у всех трёх заполнены галочки, так что размеченными они
-- останутся. Содержимое сохранено в
-- backups/removed-wire-fields-2026-09-04.json.
UPDATE products
SET wire_tech = '{}'::jsonb,
    wire_keeps = '{}'::jsonb,
    wire_level = '',
    wire_note = ''
WHERE wire_tech::text NOT IN ('{}', 'null')
   OR wire_keeps::text NOT IN ('{}', 'null')
   OR COALESCE(wire_level, '') <> ''
   OR COALESCE(wire_note, '') <> '';

COMMENT ON COLUMN products.wire_tech IS
    'УСТАРЕЛО. Замена — wire_features. Не читается с 04.09.2026';
COMMENT ON COLUMN products.wire_keeps IS
    'УСТАРЕЛО. Замена — wire_features. Не читается с 04.09.2026';
COMMENT ON COLUMN products.wire_level IS
    'УСТАРЕЛО. Размеченность определяется по wire_features';
COMMENT ON COLUMN products.wire_note IS
    'УСТАРЕЛО. Замена — wire_hint у рамки';
