-- Чистка совместимости в товарах: приводим марки к названиям справочника.
-- Товары от разных поставщиков писали марку по-своему («Fiat» вместо «FIAT»),
-- из-за чего они не находились при подборе по авто.

-- Fiat -> FIAT
UPDATE t_p61203256_auto_catalog_site.products
SET fits = (fits - 'Fiat') || jsonb_build_object('FIAT', fits->'Fiat')
WHERE fits ? 'Fiat' AND NOT fits ? 'FIAT';

-- KIA -> Kia
UPDATE t_p61203256_auto_catalog_site.products
SET fits = (fits - 'KIA') || jsonb_build_object('Kia', fits->'KIA')
WHERE fits ? 'KIA' AND NOT fits ? 'Kia';

-- CITROEN -> Citroen
UPDATE t_p61203256_auto_catalog_site.products
SET fits = (fits - 'CITROEN') || jsonb_build_object('Citroen', fits->'CITROEN')
WHERE fits ? 'CITROEN' AND NOT fits ? 'Citroen';

-- PEUGEOT -> Peugeot
UPDATE t_p61203256_auto_catalog_site.products
SET fits = (fits - 'PEUGEOT') || jsonb_build_object('Peugeot', fits->'PEUGEOT')
WHERE fits ? 'PEUGEOT' AND NOT fits ? 'Peugeot';

-- HUMMER -> Hummer
UPDATE t_p61203256_auto_catalog_site.products
SET fits = (fits - 'HUMMER') || jsonb_build_object('Hummer', fits->'HUMMER')
WHERE fits ? 'HUMMER' AND NOT fits ? 'Hummer';

-- BUICK -> Buick
UPDATE t_p61203256_auto_catalog_site.products
SET fits = (fits - 'BUICK') || jsonb_build_object('Buick', fits->'BUICK')
WHERE fits ? 'BUICK' AND NOT fits ? 'Buick';

-- Mini -> MINI
UPDATE t_p61203256_auto_catalog_site.products
SET fits = (fits - 'Mini') || jsonb_build_object('MINI', fits->'Mini')
WHERE fits ? 'Mini' AND NOT fits ? 'MINI';
