-- База дилеров: доступ к дилерским ценам по номеру телефона.
CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.dealers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL DEFAULT '',
    comment VARCHAR(255) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dealers_phone
    ON t_p61203256_auto_catalog_site.dealers (phone);
