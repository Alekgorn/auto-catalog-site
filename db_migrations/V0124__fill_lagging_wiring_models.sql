-- Дописываем модели, отставшие от справочника.
--
-- Правило отбора строгое: берём только пары «товар + марка», где выбрано
-- 90% и более моделей марки (значит, брали «всю марку»), и дописываем
-- лишь те модели, которые появились в справочнике ПОЗЖЕ последней правки
-- товара. Модель, существовавшая на момент правки и не выбранная, —
-- осознанный отказ менеджера, её не трогаем.
--
-- Момент появления модели определяем по первому товару, где её выбрали:
-- отдельной даты у справочника нет.

UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(
      p.fits,
      ARRAY[d.marka],
      (p.fits->d.marka) || d.novye
    )
FROM (
  SELECT
    pary.slug,
    pary.marka,
    jsonb_agg(to_jsonb(po.model)) AS novye
  FROM (
    SELECT
      p2.slug,
      p2.updated_at,
      k AS marka,
      p2.fits->k AS vybr,
      jsonb_array_length(p2.fits->k) AS vybrano,
      (SELECT jsonb_array_length(b2.models)
         FROM t_p61203256_auto_catalog_site.brands b2
        WHERE b2.name = k) AS vsego
    FROM t_p61203256_auto_catalog_site.products p2,
         jsonb_object_keys(p2.fits) k
    WHERE p2.category = 'Переходники для подключения магнитол'
  ) pary
  JOIN (
    SELECT b.name AS bmarka, m AS model, min(p3.updated_at) AS vpervye
    FROM t_p61203256_auto_catalog_site.brands b
    CROSS JOIN LATERAL jsonb_array_elements_text(b.models) m
    JOIN t_p61203256_auto_catalog_site.products p3
      ON p3.fits ? b.name AND (p3.fits->b.name) ? m
    GROUP BY b.name, m
  ) po ON po.bmarka = pary.marka
  WHERE pary.vsego > 0
    AND pary.vybrano::float / pary.vsego >= 0.9
    AND pary.vybrano < pary.vsego
    AND NOT (pary.vybr ? po.model)
    AND po.vpervye > pary.updated_at
  GROUP BY pary.slug, pary.marka
) d
WHERE p.slug = d.slug;
