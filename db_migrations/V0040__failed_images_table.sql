-- Ссылки на чужие картинки, которые не удалось перенести к нам.
-- Нужны, чтобы не пытаться скачивать их снова и снова на каждом заходе
-- и чтобы показать владельцу каталога понятный список проблемных ссылок.
CREATE TABLE IF NOT EXISTS failed_images (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL DEFAULT '',
    product_slug TEXT NOT NULL DEFAULT '',
    tries INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS failed_images_url_idx ON failed_images (url);
