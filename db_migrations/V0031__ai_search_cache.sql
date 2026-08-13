CREATE TABLE IF NOT EXISTS ai_search_cache (
    id SERIAL PRIMARY KEY,
    query_key VARCHAR(200) NOT NULL UNIQUE,
    query_raw VARCHAR(300) NOT NULL DEFAULT '',
    slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
    explain VARCHAR(300) NOT NULL DEFAULT '',
    hits INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_search_key ON ai_search_cache (query_key);