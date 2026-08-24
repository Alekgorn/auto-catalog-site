-- Тип подбора товара:
--   'vehicle'   — подбирается по машине (марка/модель/год решают)
--   'universal' — подходит любой машине, списки моделей не нужны
--   ''          — не задано, берём умолчание из категории
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit_mode varchar(16) NOT NULL DEFAULT '';

-- Умолчание для всех товаров категории
ALTER TABLE categories ADD COLUMN IF NOT EXISTS fit_mode varchar(16) NOT NULL DEFAULT 'universal';