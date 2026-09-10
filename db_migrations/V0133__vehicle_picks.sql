CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.vehicle_picks (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(64) NOT NULL,
    model VARCHAR(96) NOT NULL,
    year INTEGER NOT NULL DEFAULT 0,
    place VARCHAR(24) NOT NULL DEFAULT 'home',
    scenario VARCHAR(64) NOT NULL DEFAULT '',
    hits INTEGER NOT NULL DEFAULT 1,
    first_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS vehicle_picks_uniq
    ON t_p61203256_auto_catalog_site.vehicle_picks (brand, model, year, place, scenario);

CREATE INDEX IF NOT EXISTS vehicle_picks_last_at
    ON t_p61203256_auto_catalog_site.vehicle_picks (last_at DESC);
