-- Дилерская цена: на 20% ниже цены продажи, округляем до 10 рублей.
UPDATE t_p61203256_auto_catalog_site.products
SET pro_price = GREATEST(ROUND(price * 0.8 / 10) * 10, 1)
WHERE price > 0;
