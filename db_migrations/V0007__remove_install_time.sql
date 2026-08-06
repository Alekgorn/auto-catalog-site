UPDATE t_p61203256_auto_catalog_site.products
SET specs = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(specs) AS elem
  WHERE elem->>0 <> 'Время установки'
)
WHERE specs @> '[["Время установки"]]'::jsonb
   OR EXISTS (
     SELECT 1 FROM jsonb_array_elements(specs) e WHERE e->>0 = 'Время установки'
   );

UPDATE t_p61203256_auto_catalog_site.products
SET specs = jsonb_set(specs, '{0}', specs->0)
WHERE specs IS NULL;

UPDATE t_p61203256_auto_catalog_site.products
SET description = jsonb_build_array(
  description->>0,
  'Комплект поставляется с крепежом и инструкцией. После установки выдаём отметку в заказ-наряде, гарантия на изделие и работы — ' || warranty || '.',
  description->>2
)
WHERE jsonb_array_length(description) = 3
  AND description->>1 LIKE '%Среднее время работ%';
