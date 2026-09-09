CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.articles (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(160) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    h1 TEXT NOT NULL DEFAULT '',
    meta_title TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT '',
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_active
    ON t_p61203256_auto_catalog_site.articles (is_active, sort_order, published_at DESC);
