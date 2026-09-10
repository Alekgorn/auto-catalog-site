-- Где выполнена установка.
--
-- Работы делают партнёрские сервисы, и адрес публикуется с их
-- разрешения. Разрешение могут не дать или отозвать, поэтому показ
-- адреса — отдельный выключатель: данные остаются в базе, но на сайт
-- не попадают. Без него пришлось бы стирать адрес и вбивать заново.
ALTER TABLE t_p61203256_auto_catalog_site.installs
    -- Название сервиса: «Автозвук на Ленина»
    ADD COLUMN IF NOT EXISTS place_name VARCHAR(160) NOT NULL DEFAULT '',
    -- Адрес строкой, как его пишут люди
    ADD COLUMN IF NOT EXISTS place_address VARCHAR(255) NOT NULL DEFAULT '',
    -- Почему ставили именно там: «у них подъёмник и опыт с этой маркой»
    ADD COLUMN IF NOT EXISTS place_note TEXT NOT NULL DEFAULT '',
    -- Точка на карте: «55.751244,37.618423». Пусто — карту не рисуем,
    -- показываем один адрес текстом
    ADD COLUMN IF NOT EXISTS place_coords VARCHAR(64) NOT NULL DEFAULT '',
    -- Разрешение партнёра. Выключено — на сайте нет ни адреса, ни карты
    ADD COLUMN IF NOT EXISTS place_shown BOOLEAN NOT NULL DEFAULT FALSE;
