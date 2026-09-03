-- Руль и кузов как условия подбора.
--
-- Праворульных машин в стране много, и жгуты у них другие: в каталоге
-- «левый руль» упомянут у 170 товаров, «правый» — у 106, но только
-- текстом в описании. Формализуем.
--
-- Пусто = подходит любому варианту, поэтому существующие товары
-- переразмечать не нужно — они продолжат подходить всем.
ALTER TABLE t_p61203256_auto_catalog_site.products
  ADD COLUMN IF NOT EXISTS wire_wheel VARCHAR(8) NOT NULL DEFAULT '';

COMMENT ON COLUMN t_p61203256_auto_catalog_site.products.wire_wheel IS
  'Сторона руля: left | right. Пусто — подходит любой';

-- Рамка тоже привязана к кузову и рулю: на хэтчбек и седан панели разные.
-- А раз рамку покупатель выбирает раньше проводки, по ней можно понять
-- кузов машины и не задавать лишний вопрос.
COMMENT ON COLUMN t_p61203256_auto_catalog_site.products.wire_bodies IS
  'Кузова товара: ["sedan","hatchback"]. Пусто — любой. Работает и для рамок';

-- Сторона руля у машины: если владелец праворульной Хонды, часть
-- проводок ему не подойдёт независимо от остальных параметров
ALTER TABLE t_p61203256_auto_catalog_site.vehicle_wiring
  ADD COLUMN IF NOT EXISTS wheel VARCHAR(8) NOT NULL DEFAULT '';

COMMENT ON COLUMN t_p61203256_auto_catalog_site.vehicle_wiring.wheel IS
  'Сторона руля машины: left | right. Пусто — встречаются оба варианта';