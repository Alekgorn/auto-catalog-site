-- Продолжение чистки: предыдущая правка за один проход исправляла
-- только одну марку у товара. Здесь каждая марка правится отдельно.
-- Заодно убираем неразрывные пробелы (код 160), попавшие при импорте.

-- Mazda: уточнения японских названий из справочника
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(p.fits, '{Mazda}', (
      SELECT COALESCE(jsonb_agg(DISTINCT
        CASE m.model
          WHEN '3' THEN '3 (Axela)'
          WHEN '6' THEN '6 (Atenza)'
          WHEN 'MX-5' THEN 'MX-5 (Miata/Roadster)'
          ELSE m.model
        END), '[]'::jsonb)
      FROM jsonb_array_elements_text(p.fits->'Mazda') AS m(model)
    )), updated_at = now()
WHERE p.fits ? 'Mazda';

-- Mercedes-Benz: латинские классы к русским названиям справочника
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(p.fits, '{Mercedes-Benz}', (
      SELECT COALESCE(jsonb_agg(DISTINCT
        CASE m.model
          WHEN 'C-Class' THEN 'C-Класс'
          WHEN 'E-Class' THEN 'E-Класс'
          WHEN 'S-Class' THEN 'S-Класс'
          WHEN 'V-Class' THEN 'V-Класс'
          WHEN 'G-Class' THEN 'G-Класс'
          WHEN '600 (W100).' THEN '600 (W100)'
          ELSE m.model
        END), '[]'::jsonb)
      FROM jsonb_array_elements_text(p.fits->'Mercedes-Benz') AS m(model)
    )), updated_at = now()
WHERE p.fits ? 'Mercedes-Benz';

-- Mitsubishi
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(p.fits, '{Mitsubishi}', (
      SELECT COALESCE(jsonb_agg(DISTINCT
        CASE m.model WHEN 'Outlander XL' THEN 'Outlander' ELSE m.model END
      ), '[]'::jsonb)
      FROM jsonb_array_elements_text(p.fits->'Mitsubishi') AS m(model)
    )), updated_at = now()
WHERE p.fits ? 'Mitsubishi';

-- Lada: знак вопроса вместо русской «х» в «4х4 Urban»
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(p.fits, '{Lada (ВАЗ)}', (
      SELECT COALESCE(jsonb_agg(DISTINCT
        CASE m.model WHEN '4?4 Urban' THEN '4х4 Urban' ELSE m.model END
      ), '[]'::jsonb)
      FROM jsonb_array_elements_text(p.fits->'Lada (ВАЗ)') AS m(model)
    )), updated_at = now()
WHERE p.fits ? 'Lada (ВАЗ)';

-- Jeep: обозначения кузовов, побитые по запятой при импорте
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(p.fits, '{Jeep}', (
      SELECT COALESCE(jsonb_agg(DISTINCT
        CASE m.model
          WHEN 'CJ-Series (CJ-5' THEN 'CJ-5'
          WHEN 'CJ-7)' THEN 'CJ-7'
          WHEN 'Grand Cherokee (ZJ' THEN 'Grand Cherokee'
          WHEN 'WJ' THEN 'Grand Cherokee'
          WHEN 'WK' THEN 'Grand Cherokee'
          WHEN 'WK2' THEN 'Grand Cherokee'
          WHEN 'WL)' THEN 'Wrangler'
          WHEN 'Cherokee (XJ)' THEN 'Cherokee'
          WHEN 'Gladiator (JT)' THEN 'Gladiator'
          WHEN 'Willys CJ-2A' THEN 'Willys'
          WHEN 'Willys CJ-3A' THEN 'Willys'
          WHEN 'Willys CJ-3B' THEN 'Willys'
          WHEN 'Willys M170' THEN 'Willys'
          WHEN 'Willys M38' THEN 'Willys'
          WHEN 'Willys MB' THEN 'Willys'
          ELSE m.model
        END), '[]'::jsonb)
      FROM jsonb_array_elements_text(p.fits->'Jeep') AS m(model)
    )), updated_at = now()
WHERE p.fits ? 'Jeep';

-- Chery: неразрывный пробел в «Tiggo 4» и «Tiggo 5»
UPDATE t_p61203256_auto_catalog_site.products p
SET fits = jsonb_set(p.fits, '{Chery}', (
      SELECT COALESCE(jsonb_agg(DISTINCT
        translate(m.model, chr(160), ' ')
      ), '[]'::jsonb)
      FROM jsonb_array_elements_text(p.fits->'Chery') AS m(model)
    )), updated_at = now()
WHERE p.fits ? 'Chery';
