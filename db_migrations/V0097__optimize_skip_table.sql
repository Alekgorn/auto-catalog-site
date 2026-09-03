-- Фото, которые пережимать бессмысленно: WebP-версия получается не легче
-- оригинала. Без такой отметки счётчик оптимизации застревал — каждый
-- вызов брал то же фото и снова упирался в тот же отказ.
CREATE TABLE IF NOT EXISTS t_p61203256_auto_catalog_site.optimize_skip (
  url TEXT PRIMARY KEY,
  reason VARCHAR(120) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);