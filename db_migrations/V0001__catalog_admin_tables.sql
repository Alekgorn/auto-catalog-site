CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.products (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    old_price INTEGER,
    mount VARCHAR(255) NOT NULL DEFAULT '',
    install VARCHAR(64) NOT NULL DEFAULT '',
    warranty VARCHAR(64) NOT NULL DEFAULT '',
    year_from INTEGER NOT NULL DEFAULT 2010,
    year_to INTEGER NOT NULL DEFAULT 2026,
    badge VARCHAR(32),
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    description JSONB NOT NULL DEFAULT '[]'::jsonb,
    specs JSONB NOT NULL DEFAULT '[]'::jsonb,
    kit JSONB NOT NULL DEFAULT '[]'::jsonb,
    fits JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON t_p61203256_auto_catalog_site.products (is_active, sort_order);

CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.admin_sessions (
    token VARCHAR(128) PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    models JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 100
);
