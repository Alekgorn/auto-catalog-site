-- Подбор проводки: технические возможности, сохраняемые функции и настройки авто
--
-- Два разных блока у проводки:
--   wire_tech  — с чем проводка умеет работать (фильтр: кому НЕ подойдёт)
--   wire_keeps — что останется работать у клиента (объяснение цены)
-- Их нельзя объединять: первое прячет товар, второе показывает с пометкой.

ALTER TABLE t_p61203256_auto_catalog_site.products
  ADD COLUMN IF NOT EXISTS wire_tech JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS wire_keeps JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS wire_level VARCHAR(16) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS wire_note TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN t_p61203256_auto_catalog_site.products.wire_tech IS
  'Технические возможности: {"power":"yes","amp":"any",...} значения yes/no/any';
COMMENT ON COLUMN t_p61203256_auto_catalog_site.products.wire_keeps IS
  'Сохраняемые функции: {"climate":true,"wheel":true,...}';
COMMENT ON COLUMN t_p61203256_auto_catalog_site.products.wire_level IS
  'Уровень совместимости: full | basic | limited';
COMMENT ON COLUMN t_p61203256_auto_catalog_site.products.wire_note IS
  'Описание совместимости — этот текст видит покупатель';

-- Настройки подбора на уровне «марка + модель + годы».
-- Civic 2006 и Civic 2015 — разные строки: проводки у них разные.
CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.vehicle_wiring (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(64) NOT NULL,
  model VARCHAR(96) NOT NULL,
  year_from INTEGER NOT NULL DEFAULT 1990,
  year_to INTEGER NOT NULL DEFAULT 2100,
  -- fixed — проводка известна точно, вопросов нет
  -- select — вариантов несколько, нужны уточняющие вопросы
  mode VARCHAR(16) NOT NULL DEFAULT 'select',
  wire_slug VARCHAR(160) NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  -- Какие параметры реально влияют на выбор именно для этой машины.
  -- Галка не значит «в машине есть камера», значит «камера решает, что брать»
  ask JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS vehicle_wiring_key
  ON t_p61203256_auto_catalog_site.vehicle_wiring (brand, model, year_from, year_to);

CREATE INDEX IF NOT EXISTS vehicle_wiring_brand
  ON t_p61203256_auto_catalog_site.vehicle_wiring (brand, model);

COMMENT ON TABLE t_p61203256_auto_catalog_site.vehicle_wiring IS
  'Настройки подбора проводки для машины: фиксированная проводка или вопросы';