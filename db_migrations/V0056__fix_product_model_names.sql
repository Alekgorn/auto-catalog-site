-- Чистка названий моделей в товарах: приводим к справочнику марок.
-- Разные поставщики писали модель по-своему («Rav4» вместо «RAV4»),
-- часть названий побилась по запятой при импорте («WL)», «CJ-7)»).

UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(
      p.fits,
      ARRAY[r.brand],
      (
        SELECT COALESCE(jsonb_agg(DISTINCT x.v), '[]'::jsonb)
        FROM (
          SELECT COALESCE(fr.new_name, m.model) AS v
          FROM jsonb_array_elements_text(p.fits->r.brand) AS m(model)
          LEFT JOIN (VALUES
            ('Toyota', 'Rav4', 'RAV4'),
            ('Hyundai', 'IX35', 'ix35'),
            ('Hyundai', 'ix25', 'IX25'),
            ('Hyundai', 'IX45', 'ix45'),
            ('Hyundai', 'Genesis (до выделения в отдельный бренд)', 'Genesis'),
            ('Ford', 'C-MAX', 'C-Max'),
            ('Ford', 'Ecosport', 'EcoSport'),
            ('Lada (ВАЗ)', 'Xray', 'XRay'),
            ('Lada (ВАЗ)', '4?4 Urban', '4х4 Urban'),
            ('FIAT', 'Doblo', 'Doblò'),
            ('Mitsubishi', 'Outlander XL', 'Outlander'),
            ('Nissan', 'Z (350Z/370Z).', 'Z (350Z/370Z)'),
            ('Mazda', '3', '3 (Axela)'),
            ('Mazda', '6', '6 (Atenza)'),
            ('Mazda', 'MX-5', 'MX-5 (Miata/Roadster)'),
            ('Mercedes-Benz', 'C-Class', 'C-Класс'),
            ('Mercedes-Benz', 'E-Class', 'E-Класс'),
            ('Mercedes-Benz', 'S-Class', 'S-Класс'),
            ('Mercedes-Benz', 'V-Class', 'V-Класс'),
            ('Mercedes-Benz', 'G-Class', 'G-Класс'),
            ('Jeep', 'CJ-Series (CJ-5', 'CJ-5'),
            ('Jeep', 'CJ-7)', 'CJ-7'),
            ('Jeep', 'Grand Cherokee (ZJ', 'Grand Cherokee'),
            ('Jeep', 'WL)', 'Wrangler'),
            ('Jeep', 'WJ', 'Grand Cherokee'),
            ('Jeep', 'WK', 'Grand Cherokee'),
            ('Jeep', 'WK2', 'Grand Cherokee'),
            ('Jeep', 'Cherokee (XJ)', 'Cherokee'),
            ('Jeep', 'Gladiator (JT)', 'Gladiator'),
            ('Jeep', 'Willys CJ-2A', 'Willys'),
            ('Jeep', 'Willys CJ-3A', 'Willys'),
            ('Jeep', 'Willys CJ-3B', 'Willys'),
            ('Jeep', 'Willys M170', 'Willys'),
            ('Jeep', 'Willys M38', 'Willys'),
            ('Jeep', 'Willys MB', 'Willys')
          ) AS fr(brand, old_name, new_name)
            ON fr.brand = r.brand AND fr.old_name = m.model
        ) x
      )
    ),
    updated_at = now()
FROM (VALUES
  ('Toyota'), ('Hyundai'), ('Ford'), ('Lada (ВАЗ)'), ('FIAT'),
  ('Mitsubishi'), ('Nissan'), ('Mazda'), ('Mercedes-Benz'), ('Jeep')
) AS r(brand)
WHERE p.fits ? r.brand
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(p.fits->r.brand) AS m(model)
    JOIN (VALUES
      ('Toyota', 'Rav4'), ('Hyundai', 'IX35'), ('Hyundai', 'ix25'),
      ('Hyundai', 'IX45'), ('Hyundai', 'Genesis (до выделения в отдельный бренд)'),
      ('Ford', 'C-MAX'), ('Ford', 'Ecosport'),
      ('Lada (ВАЗ)', 'Xray'), ('Lada (ВАЗ)', '4?4 Urban'),
      ('FIAT', 'Doblo'), ('Mitsubishi', 'Outlander XL'),
      ('Nissan', 'Z (350Z/370Z).'), ('Mazda', '3'), ('Mazda', '6'),
      ('Mazda', 'MX-5'), ('Mercedes-Benz', 'C-Class'),
      ('Mercedes-Benz', 'E-Class'), ('Mercedes-Benz', 'S-Class'),
      ('Mercedes-Benz', 'V-Class'), ('Mercedes-Benz', 'G-Class'),
      ('Jeep', 'CJ-Series (CJ-5'), ('Jeep', 'CJ-7)'),
      ('Jeep', 'Grand Cherokee (ZJ'), ('Jeep', 'WL)'), ('Jeep', 'WJ'),
      ('Jeep', 'WK'), ('Jeep', 'WK2'), ('Jeep', 'Cherokee (XJ)'),
      ('Jeep', 'Gladiator (JT)'), ('Jeep', 'Willys CJ-2A'),
      ('Jeep', 'Willys CJ-3A'), ('Jeep', 'Willys CJ-3B'),
      ('Jeep', 'Willys M170'), ('Jeep', 'Willys M38'), ('Jeep', 'Willys MB')
    ) AS bad(brand, model_name)
      ON bad.brand = r.brand AND bad.model_name = m.model
  );
