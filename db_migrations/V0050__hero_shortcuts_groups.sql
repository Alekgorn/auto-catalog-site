UPDATE settings SET value = 'false'::jsonb WHERE key = 'shortcuts_hidden';

UPDATE settings SET value = '[
  {"label": "Магнитолы", "category": "Android магнитолы", "icon": "Radio"},
  {"label": "Рамки и переходники", "category": "Переходные рамки для магнитол", "icon": "Frame"},
  {"label": "Проводка и разъёмы", "category": "Переходники для подключения магнитол", "icon": "Cable"},
  {"label": "Камеры и парковка", "category": "Камеры заднего вида", "icon": "Camera"},
  {"label": "Шумоизоляция", "category": "Шумоизоляция", "icon": "Volume2"},
  {"label": "Весь каталог", "category": "", "icon": "LayoutGrid"}
]'::jsonb WHERE key = 'shortcuts';