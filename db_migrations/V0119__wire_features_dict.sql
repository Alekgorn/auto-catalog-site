-- Справочник признаков подключения: что именно проводка подключает.
--
-- Раньше список был зашит в коде (питание, акустика, кнопки на руле,
-- усилитель, камера, CAN). Добавить туда новый пункт мог только
-- разработчик — теперь это обычный справочник, редактируемый в админке.
--
-- Формат: [{id, label, ask}]. ask=true — по признаку спрашиваем
-- покупателя при подборе, false — просто пишем в карточке.
INSERT INTO settings (key, value, updated_at)
VALUES (
    'wire_features',
    '[
      {"id": "power",  "label": "Питание",           "ask": false},
      {"id": "sound",  "label": "Акустика",          "ask": false},
      {"id": "wheel",  "label": "Кнопки на руле",    "ask": false},
      {"id": "amp",    "label": "Штатный усилитель", "ask": true},
      {"id": "camera", "label": "Штатная камера",    "ask": true},
      {"id": "can",    "label": "CAN-шина",          "ask": true}
    ]'::jsonb,
    NOW()
)
ON CONFLICT (key) DO NOTHING;
