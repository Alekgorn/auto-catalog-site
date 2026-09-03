-- Кузов переезжает в строку подбора проводки.
--
-- Отдельная графа кузовов у моделей была неудобной: кузов имеет смысл
-- только вместе с годами. Civic до 2011 — хэтчбек, после — седан, и это
-- одна и та же модель. Держать кузов отдельно от годов значит терять связь.
ALTER TABLE t_p61203256_auto_catalog_site.vehicle_wiring
  ADD COLUMN IF NOT EXISTS bodies JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN t_p61203256_auto_catalog_site.vehicle_wiring.bodies IS
  'Кузова этого поколения: ["hatchback"]. Пусто — любой';

-- Одна модель = несколько строк (поколения). Ключ по годам уже это
-- позволяет, но нужен идентификатор строки для правки и удаления из админки:
-- иначе поменять годы у существующей записи невозможно — она найдётся
-- по старому ключу и создастся дубль.
CREATE INDEX IF NOT EXISTS vehicle_wiring_lookup
  ON t_p61203256_auto_catalog_site.vehicle_wiring (brand, model, year_from);