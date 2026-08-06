CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.orders (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(16) NOT NULL DEFAULT 'cart',
    name VARCHAR(128) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    vehicle VARCHAR(128) NOT NULL DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(24) NOT NULL DEFAULT 'new',
    admin_note TEXT NOT NULL DEFAULT '',
    source VARCHAR(64) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON t_p61203256_auto_catalog_site.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON t_p61203256_auto_catalog_site.orders (status);

CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.guides (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(96) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT '',
    duration VARCHAR(64) NOT NULL DEFAULT '',
    difficulty VARCHAR(64) NOT NULL DEFAULT '',
    tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_active ON t_p61203256_auto_catalog_site.guides (is_active, sort_order);

CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.product_guides (
    product_id INTEGER NOT NULL,
    guide_id INTEGER NOT NULL,
    PRIMARY KEY (product_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_pg_guide ON t_p61203256_auto_catalog_site.product_guides (guide_id);
