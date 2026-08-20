-- Рамка DH 007T: при импорте название «Daihatsu Move Canbus» разобрали
-- неверно — «Move» попало в марку, «Canbus» в модель. Из-за этого товар
-- не находился при подборе, а марки «Move» не существует.

UPDATE t_p61203256_auto_catalog_site.products
SET fits = '{"Daihatsu": ["Move Canbus"]}'::jsonb,
    updated_at = now()
WHERE sku = 'DH 007T' AND fits ? 'Move';
