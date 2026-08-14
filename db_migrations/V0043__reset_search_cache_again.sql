-- Сбрасываем память поиска ещё раз: изменилось правило отбора,
-- прежние ответы содержат лишние товары.
UPDATE ai_search_cache SET slugs = '[]'::jsonb, explain = '' WHERE TRUE;
