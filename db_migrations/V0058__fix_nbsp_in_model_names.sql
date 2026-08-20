-- Chery: в справочнике марок названия моделей записаны с неразрывным
-- пробелом (код 160) вместо обычного — «Tiggo 4», «Arrizo 6».
-- Внешне неотличимо, но для сверки это разные строки.

UPDATE t_p61203256_auto_catalog_site.brands b
SET models = (
  SELECT COALESCE(jsonb_agg(DISTINCT translate(m.model, chr(160), ' ')), '[]'::jsonb)
  FROM jsonb_array_elements_text(b.models) AS m(model)
)
WHERE b.models::text LIKE '%' || chr(160) || '%';

-- То же самое в товарах — по всем маркам сразу
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = (
      SELECT COALESCE(jsonb_object_agg(
        b.key,
        (
          SELECT COALESCE(jsonb_agg(DISTINCT translate(m.model, chr(160), ' ')), '[]'::jsonb)
          FROM jsonb_array_elements_text(b.val) AS m(model)
        )
      ), '{}'::jsonb)
      FROM jsonb_each(p.fits) AS b(key, val)
      WHERE jsonb_typeof(b.val) = 'array'
    ),
    updated_at = now()
WHERE p.fits::text LIKE '%' || chr(160) || '%';
