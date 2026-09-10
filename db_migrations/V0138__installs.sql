-- Установки: выполненные работы с фото «было/стало» и видео.
--
-- Отдельная таблица, а не блоки внутри товара: одна установка — это
-- всегда комплект (магнитола + рамка + проводка), и складывая её в
-- карточку, пришлось бы либо привязывать к чему-то одному, либо
-- загружать те же фото трижды. Плюс за год работ у одной популярной
-- магнитолы накопятся десятки установок — в карточке они превратятся
-- в сотни картинок подряд.
CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.installs (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(96) UNIQUE NOT NULL,
    -- Машина: по ней человек узнаёт свой случай
    brand VARCHAR(64) NOT NULL DEFAULT '',
    model VARCHAR(96) NOT NULL DEFAULT '',
    year INTEGER NOT NULL DEFAULT 0,
    -- Заголовок: обычно собирается из машины, но можно задать свой
    title VARCHAR(255) NOT NULL DEFAULT '',
    -- Краткое описание — прежде всего для поиска
    excerpt TEXT NOT NULL DEFAULT '',
    -- Пара «было/стало»: снимки строго из одной точки
    before_image TEXT NOT NULL DEFAULT '',
    after_image TEXT NOT NULL DEFAULT '',
    -- Остальные снимки процесса
    gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Вертикальный ролик: YouTube Shorts, VK, Rutube или свой файл
    video TEXT NOT NULL DEFAULT '',
    -- Строка от мастера: «кнопки на руле сохранены» — самое ценное,
    -- из одних фотографий этого не видно
    comment TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Какие товары стояли в этой установке. Связь многие-ко-многим:
-- одна установка показывается сразу на всех товарах комплекта.
CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.install_products (
    install_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    PRIMARY KEY (install_id, product_id)
);

CREATE INDEX IF NOT EXISTS installs_active_sort
    ON t_p61203256_auto_catalog_site.installs (is_active, sort_order, id);

CREATE INDEX IF NOT EXISTS install_products_product
    ON t_p61203256_auto_catalog_site.install_products (product_id);
