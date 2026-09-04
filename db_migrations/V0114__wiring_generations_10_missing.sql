-- Добираем поколения, потерянные при заливке.
-- Проверка на дубли шла по марке, модели, годам и рулю — без кузова.
-- Из-за этого Civic 2006-2011 седан с левым рулём не вставился: на тех же
-- годах и руле уже стоял хэтчбек. А это разные машины и разные проводки.
INSERT INTO vehicle_wiring
  (brand, model, year_from, year_to, mode, wire_slug, reason, ask, bodies, wheel)
SELECT v.b, v.m, v.y0, v.y1, 'select', '', '',
  '{"amp":false,"camera":false,"can":false}'::jsonb,
  CASE WHEN v.bd='[]' THEN '[]'::jsonb
       ELSE ('["'||btrim(v.bd,'[]')||'"]')::jsonb END, v.wh
FROM (VALUES
('Honda','Civic',2006,2011,'[sedan]','left'),
('Honda','Civic',2012,2017,'[]','left'),
('Chevrolet','Lacetti',2004,2013,'[sedan]',''),
('BMW','X5',2006,2013,'[crossover]','left'),
('Mercedes-Benz','E-Класс',2009,2016,'[coupe]','right')
) AS v(b, m, y0, y1, bd, wh)
WHERE NOT EXISTS (SELECT 1 FROM vehicle_wiring w
  WHERE w.brand=v.b AND w.model=v.m AND w.year_from=v.y0
    AND w.year_to=v.y1 AND w.wheel=v.wh
    AND w.bodies = CASE WHEN v.bd='[]' THEN '[]'::jsonb
                        ELSE ('["'||btrim(v.bd,'[]')||'"]')::jsonb END);
