-- Убираем повторы моделей внутри совместимости.
-- Одна и та же модель встречалась в списке дважды — следы ручного
-- редактирования. На подбор это не влияло, но раздувало данные и мешало
-- сверять «выбрано / всего»: товар выглядел полнее, чем есть.
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = (
  SELECT jsonb_object_agg(k, models)
  FROM (
    SELECT k, (SELECT jsonb_agg(DISTINCT m)
                 FROM jsonb_array_elements_text(p.fits->k) m) AS models
    FROM jsonb_object_keys(p.fits) k
  ) t
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_object_keys(p.fits) k
  WHERE jsonb_array_length(p.fits->k) <> (
    SELECT count(DISTINCT m) FROM jsonb_array_elements_text(p.fits->k) m
  )
);
