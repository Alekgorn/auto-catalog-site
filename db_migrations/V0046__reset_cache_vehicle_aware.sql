-- Поиск теперь учитывает совместимость с авто, прежние ответы устарели.
UPDATE ai_search_cache SET slugs = '[]'::jsonb, explain = '' WHERE TRUE;
