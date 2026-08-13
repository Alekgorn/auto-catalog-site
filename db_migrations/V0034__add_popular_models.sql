UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Solaris', 'ix35', 'Getz', 'i20', 'i30', 'i40', 'Matrix'])) s
) WHERE name = 'Hyundai';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Ceed', 'ProCeed', 'XCeed', 'Opirus', 'Sonet', 'Sephia'])) s
) WHERE name = 'Kia';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Auris', 'Vitz', 'Ractis', 'Alphard', 'Vellfire', 'Estima', 'Ipsum', 'Caldina', 'Passo', 'Premio', 'Allion', 'Noah', 'Voxy', 'Probox', 'Harrier', 'Rush', 'Verso', 'Funcargo'])) s
) WHERE name = 'Toyota';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['March', 'Wingroad', 'Presage', 'Lafesta', 'Stagea', 'Laurel', 'Vanette', 'Safari', 'Expert', 'Liberty', 'Bassara', 'Tino'])) s
) WHERE name = 'Nissan';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Demio', 'Axela', 'Atenza', 'Familia', 'Capella', 'Premacy', 'Millenia', 'Titan', 'CX-4'])) s
) WHERE name = 'Mazda';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Sharan', 'Touran', 'Caravelle', 'CC'])) s
) WHERE name = 'Volkswagen';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Octavia Tour'])) s
) WHERE name = 'Skoda';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Dokker'])) s
) WHERE name = 'Renault';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Epica', 'Lanos', 'Niva', 'Rezzo'])) s
) WHERE name = 'Chevrolet';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['EcoSport'])) s
) WHERE name = 'Ford';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Pajero Sport', 'Eclipse Cross'])) s
) WHERE name = 'Mitsubishi';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Escudo'])) s
) WHERE name = 'Suzuki';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Airwave', 'Element'])) s
) WHERE name = 'Honda';

UPDATE brands SET models = (
  SELECT jsonb_agg(m ORDER BY m)
  FROM (SELECT jsonb_array_elements_text(models) AS m
        UNION SELECT unnest(ARRAY['Vesta SW', 'Vesta SW Cross', 'Vesta Cross', 'Niva Travel', '2110', '2112', '2115', '2109', '21099'])) s
) WHERE name = 'Lada (ВАЗ)';