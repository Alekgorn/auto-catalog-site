-- Android-магнитолы: бюджетные (до 15 000) и премиум (до 25 000).

INSERT INTO t_p61203256_auto_catalog_site.products
  (slug, sku, name, category, price, old_price, install, warranty,
   year_from, year_to, badge, images, description, specs, kit, fits,
   sort_order, is_active, popularity, subcategory, stock)
VALUES
-- ---------- бюджетные ----------
('android-magnitola-7-dyuymov-2gb-32gb', 'gw-and207',
 'Android магнитола 7 дюймов 2/32 ГБ, 2DIN',
 'Android-магнитолы', 8900, 11400, '', '1 год', 2005, 2026, 'ХИТ',
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/7bb9fbe7-04ba-4638-8ac8-b330dd9fe750.jpg"]'::jsonb,
 '["Базовая Android-магнитола под универсальную шахту 2DIN. Экран 7 дюймов, отзывчивый сенсор, Wi-Fi, Bluetooth и GPS-навигация. Подходит тем, кому нужен нормальный экран и музыка со смартфона без переплаты за лишние функции.", "Работает с камерой заднего вида, поддерживает кнопки на руле через CAN-адаптер. Устанавливается в штатное место через переходную рамку и жгут ISO — резать проводку не нужно."]'::jsonb,
 '[["Экран", "7 дюймов, 1024x600"], ["Память", "2 ГБ ОЗУ / 32 ГБ"], ["Типоразмер", "2DIN"], ["Связь", "Wi-Fi, Bluetooth"]]'::jsonb,
 '["Магнитола", "Жгут питания ISO", "GPS-антенна", "Микрофон", "Инструкция"]'::jsonb,
 '{"Lada (ВАЗ)": ["Granta", "Vesta", "Kalina", "Priora", "Largus", "XRay"], "Renault": ["Logan", "Duster", "Sandero", "Kaptur"], "Chevrolet": ["Aveo", "Lacetti", "Cruze"], "Nissan": ["Almera", "Note", "Tiida"]}'::jsonb,
 5, TRUE, 940, '', 'на складе'),

('android-magnitola-9-dyuymov-2gb-32gb', 'gw-and932',
 'Android магнитола 9 дюймов 2/32 ГБ',
 'Android-магнитолы', 12400, 15900, '', '1 год', 2008, 2026, NULL,
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/5a4e11cf-146b-4cfd-b667-618c4dff14cf.jpg"]'::jsonb,
 '["Android-магнитола с экраном 9 дюймов под штатную рамку популярных моделей. Разрешение 1280x720, ёмкостный сенсор, четырёхъядерный процессор. Быстро загружается, тянет навигацию и музыку одновременно.", "Есть Wi-Fi, Bluetooth, поддержка беспроводного CarPlay и Android Auto. Разъём под камеру заднего вида, вход для кнопок на руле, USB для флешки и модема."]'::jsonb,
 '[["Экран", "9 дюймов, 1280x720"], ["Память", "2 ГБ ОЗУ / 32 ГБ"], ["Процессор", "4 ядра"], ["Связь", "Wi-Fi, Bluetooth, CarPlay"]]'::jsonb,
 '["Магнитола", "Жгут питания ISO", "GPS-антенна", "Микрофон на клипсе", "Инструкция"]'::jsonb,
 '{"Kia": ["Rio", "Sportage", "Cerato", "Soul"], "Hyundai": ["Solaris", "Creta", "Elantra", "Tucson"], "Toyota": ["Corolla", "Camry", "RAV4"], "Volkswagen": ["Polo", "Golf", "Tiguan"], "Skoda": ["Octavia", "Rapid", "Fabia"]}'::jsonb,
 6, TRUE, 970, '', 'на складе'),

('android-magnitola-10-dyuymov-4gb-64gb', 'gw-and1064',
 'Android магнитола 10 дюймов 4/64 ГБ',
 'Android-магнитолы', 14800, NULL, '', '1 год', 2010, 2026, 'ХИТ',
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/5a4e11cf-146b-4cfd-b667-618c4dff14cf.jpg"]'::jsonb,
 '["Оптимальный вариант до 15 000: экран 10 дюймов, 4 ГБ оперативной и 64 ГБ встроенной памяти. Интерфейс не тормозит даже с несколькими приложениями, карты грузятся мгновенно.", "Поддержка беспроводного CarPlay и Android Auto, вход для камеры заднего вида и парктроников, управление с руля. Ставится в штатное место с переходной рамкой под вашу модель."]'::jsonb,
 '[["Экран", "10 дюймов, 1280x720 IPS"], ["Память", "4 ГБ ОЗУ / 64 ГБ"], ["Процессор", "8 ядер"], ["Связь", "Wi-Fi, Bluetooth 5.0, CarPlay"]]'::jsonb,
 '["Магнитола", "Жгут питания ISO", "GPS-антенна", "Микрофон", "USB-кабель", "Инструкция"]'::jsonb,
 '{"Kia": ["Rio", "Sportage", "Sorento", "Cerato", "Seltos"], "Hyundai": ["Solaris", "Creta", "Tucson", "Santa Fe", "Elantra"], "Toyota": ["Camry", "RAV4", "Corolla", "Land Cruiser Prado"], "Mazda": ["3 (Axela)", "6 (Atenza)", "CX-5"], "Nissan": ["Qashqai", "X-Trail"]}'::jsonb,
 7, TRUE, 990, '', 'на складе'),

-- ---------- премиум ----------
('android-magnitola-qled-13-dyuymov-8gb', 'gw-andq138',
 'Android магнитола QLED 13 дюймов 8/128 ГБ с DSP',
 'Android-магнитолы', 24900, 29900, '', '2 года', 2012, 2026, 'ХИТ',
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/9356cb7c-eae2-4982-9b28-9b69d1e26ca3.jpg"]'::jsonb,
 '["Флагманская магнитола с вертикальным QLED-экраном 13 дюймов в стиле Tesla. Яркая картинка, глубокий чёрный, отличная читаемость на солнце. 8 ГБ оперативной и 128 ГБ встроенной памяти — система работает без единой задержки.", "Встроенный DSP-процессор с настройкой звука по полосам: можно точно выстроить сцену под салон. Поддержка камер кругового обзора 360, беспроводной CarPlay и Android Auto, 4G-модем и два слота USB."]'::jsonb,
 '[["Экран", "13 дюймов QLED, 1920x1080"], ["Память", "8 ГБ ОЗУ / 128 ГБ"], ["Процессор", "8 ядер"], ["Звук", "DSP-процессор, 16 полос"], ["Связь", "4G, Wi-Fi, Bluetooth 5.0, CarPlay"]]'::jsonb,
 '["Магнитола", "Жгут питания ISO", "GPS-антенна", "Внешний микрофон", "4G-антенна", "USB-кабели", "Инструкция"]'::jsonb,
 '{"Toyota": ["Camry", "RAV4", "Land Cruiser", "Land Cruiser Prado", "Highlander"], "Kia": ["Sportage", "Sorento", "K5", "Seltos"], "Hyundai": ["Tucson", "Santa Fe", "Creta", "Elantra"], "Volkswagen": ["Tiguan", "Passat", "Teramont"], "BMW": ["3 Series", "5 Series", "X5"], "Mercedes-Benz": ["C-Class", "E-Class", "GLE"]}'::jsonb,
 8, TRUE, 1000, '', 'на складе'),

('android-magnitola-premium-12-dyuymov', 'gw-andp128',
 'Android магнитола 12,3 дюйма 8/128 ГБ, 4G и DSP',
 'Android-магнитолы', 22500, NULL, '', '2 года', 2012, 2026, NULL,
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/9356cb7c-eae2-4982-9b28-9b69d1e26ca3.jpg"]'::jsonb,
 '["Премиум-магнитола с экраном 12,3 дюйма и разрешением Full HD. Восьмиядерный процессор, 8 ГБ оперативной памяти — приложения переключаются мгновенно, навигация работает поверх музыки без подтормаживаний.", "DSP-процессор для тонкой настройки акустики, поддержка системы кругового обзора 360 градусов, встроенный 4G-модем с раздачей Wi-Fi. Подключается к штатным кнопкам руля и заводским камерам."]'::jsonb,
 '[["Экран", "12,3 дюйма IPS, 1920x1080"], ["Память", "8 ГБ ОЗУ / 128 ГБ"], ["Процессор", "8 ядер"], ["Звук", "DSP-процессор"], ["Связь", "4G, Wi-Fi, Bluetooth 5.0"]]'::jsonb,
 '["Магнитола", "Жгут питания ISO", "GPS-антенна", "Микрофон", "4G-антенна", "Инструкция"]'::jsonb,
 '{"Toyota": ["Camry", "RAV4", "Corolla", "Highlander"], "Kia": ["Sportage", "Sorento", "K5"], "Hyundai": ["Tucson", "Santa Fe", "Elantra"], "Mazda": ["CX-5", "6 (Atenza)"], "Audi": ["A4", "A6", "Q5"], "Skoda": ["Octavia", "Kodiaq"]}'::jsonb,
 9, TRUE, 960, '', 'на складе'),

('android-magnitola-premium-11-dyuymov-6gb', 'gw-andp116',
 'Android магнитола 11 дюймов 6/128 ГБ с CarPlay',
 'Android-магнитолы', 18700, 23400, '', '2 года', 2010, 2026, 'АКЦИЯ',
 '["https://cdn.poehali.dev/projects/e02f6838-189a-4b34-9b79-263263819d03/files/9356cb7c-eae2-4982-9b28-9b69d1e26ca3.jpg"]'::jsonb,
 '["Крупный экран 11 дюймов с IPS-матрицей и 6 ГБ оперативной памяти. Золотая середина между бюджетными и флагманскими моделями: большой дисплей и запас мощности, но без переплаты за максимальную комплектацию.", "Беспроводной CarPlay и Android Auto, поддержка камеры заднего вида и парктроников, кнопки на руле через CAN-адаптер. Есть выход на усилитель и сабвуфер."]'::jsonb,
 '[["Экран", "11 дюймов IPS, 1600x900"], ["Память", "6 ГБ ОЗУ / 128 ГБ"], ["Процессор", "8 ядер"], ["Связь", "Wi-Fi, Bluetooth 5.0, CarPlay"]]'::jsonb,
 '["Магнитола", "Жгут питания ISO", "GPS-антенна", "Микрофон", "Инструкция"]'::jsonb,
 '{"Kia": ["Rio", "Sportage", "Cerato", "Sorento"], "Hyundai": ["Solaris", "Creta", "Tucson"], "Toyota": ["Camry", "Corolla", "RAV4"], "Nissan": ["Qashqai", "X-Trail", "Murano"], "Chery": ["Tiggo 7", "Tiggo 8"]}'::jsonb,
 10, TRUE, 950, '', 'на складе')
ON CONFLICT DO NOTHING;
