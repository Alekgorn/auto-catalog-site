CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_key
    ON t_p61203256_auto_catalog_site.categories (name);
