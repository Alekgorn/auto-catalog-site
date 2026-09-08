UPDATE t_p61203256_auto_catalog_site.products
SET level_key = CASE
  WHEN name ILIKE '%TS10S%' OR name ILIKE '%TS20%' OR name ILIKE '%7870%' THEN 'top'
  WHEN name ILIKE '%TS105%' OR name ILIKE '%G85%' OR name ILIKE '%7862%' THEN 'pro'
  WHEN name ILIKE '%TS18%' THEN 'mid'
  WHEN name ILIKE '%T100%' OR name ILIKE '%T133%' OR name ILIKE '%TS7%' THEN 'base'
  ELSE ''
END
WHERE category = 'Android магнитолы' AND level_key = '';