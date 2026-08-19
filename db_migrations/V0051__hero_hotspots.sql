INSERT INTO settings (key, value) VALUES ('hotspots', '[
  {"key": "headunit", "label": "Android-магнитола", "href": "/search?q=Android%20магнитолы"},
  {"key": "dvr", "label": "Видеорегистратор", "href": "/search?q=Видеорегистраторы"},
  {"key": "camera", "label": "Камера заднего вида", "href": "/search?q=Камеры%20заднего%20вида"},
  {"key": "parking", "label": "Парктроники", "href": "/search?q=Парктроники"},
  {"key": "frame", "label": "Рамка и жгут", "href": "/search?q=Переходные%20рамки%20для%20магнитол"},
  {"key": "car", "label": "Подобрать по машине", "href": "/#select"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;