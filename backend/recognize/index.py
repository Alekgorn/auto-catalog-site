import base64
import difflib
import json
import os
import re

import psycopg2
import psycopg2.extras
import requests

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

# Поиск по смыслу: сколько товаров показываем и насколько длинный запрос принимаем
SEARCH_LIMIT = 12
QUERY_LIMIT = 160

SEARCH_PROMPT = (
    'Ты подбираешь товары в магазине автоэлектроники по запросу покупателя. '
    'Тебе дан список товаров в формате «номер | название | раздел». '
    'Выбери только те, что действительно отвечают запросу, самые подходящие первыми. '
    'Учитывай смысл: «хочу тише» — это шумоизоляция, «чтобы играло громче» — акустика, '
    '«не вижу при парковке» — камеры и парктроники. '
    'Если подходящих товаров нет, верни пустой список — не выдумывай. '
    'Ответь строго JSON без пояснений: '
    '{"items": [номера подходящих товаров, до 12], "explain": "чем помогли, до 12 слов по-русски"}.'
)

DEFAULT_MODEL = 'gpt-4o-mini'
PROXY_BASE = 'https://api.proxyapi.ru/openai/v1'
OPENAI_BASE = 'https://api.openai.com/v1'
MAX_BYTES = 6 * 1024 * 1024

# YandexGPT — российский сервис, используется для поиска по смыслу.
# Картинки он не понимает, поэтому распознавание фото остаётся на OpenAI.
YANDEX_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
YANDEX_MODEL = 'yandexgpt-lite'

PROMPT = (
    'На фото — салон автомобиля: торпедо, приборная панель или штатная магнитола. '
    'Определи марку и модель машины по форме панели, магнитолы, дефлекторов, логотипу на руле. '
    'Ответь строго JSON без пояснений: '
    '{"brand": "марка латиницей", "model": "модель", "yearFrom": число, "yearTo": число, '
    '"confidence": "high|medium|low", "note": "краткое пояснение по-русски, до 15 слов"}. '
    'Марку пиши как принято латиницей: Toyota, Kia, Lada, Volkswagen. '
    'Если марка видна, а модель нет — model оставь пустой строкой. '
    'Если это не салон автомобиля — верни {"brand": "", "model": "", "confidence": "low", '
    '"note": "на фото не видно салон автомобиля"}.'
)


def get_schema() -> str:
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def resp(code: int, payload: dict) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def load_brands() -> dict:
    """Справочник марок и моделей из каталога."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"SELECT name, models FROM {get_schema()}.brands ORDER BY name")
        return {r['name']: (r['models'] or []) for r in cur.fetchall()}
    finally:
        conn.close()


def pick(value: str, options: list) -> str:
    """Подбирает ближайший вариант из справочника каталога."""
    if not value:
        return ''
    low = value.strip().lower()
    for o in options:
        if o.lower() == low:
            return o
    for o in options:
        ol = o.lower()
        if ol.startswith(low) or low.startswith(ol) or low in ol or ol in low:
            return o
    close = difflib.get_close_matches(low, [o.lower() for o in options], n=1, cutoff=0.72)
    if close:
        for o in options:
            if o.lower() == close[0]:
                return o
    return ''


def candidates() -> list:
    """Пары «ключ + адрес сервиса». Поля могли перепутать местами — учитываем это."""
    key = os.environ.get('OPENAI_API_KEY', '').strip()
    other = os.environ.get('AI_BASE_URL', '').strip()

    keys = [k for k in (key, other) if k and not k.startswith('http')]
    bases = [b for b in (other, key) if b.startswith('http')]
    bases += [PROXY_BASE, OPENAI_BASE]

    pairs = []
    for k in keys:
        for b in bases:
            b = b.rstrip('/')
            if not b.endswith('/chat/completions'):
                b += '/chat/completions'
            if (k, b) not in pairs:
                pairs.append((k, b))
    return pairs[:4]


def call_ai(key: str, url: str, data_url: str) -> dict:
    model = os.environ.get('AI_MODEL', '').strip() or DEFAULT_MODEL
    r = requests.post(
        url,
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        json={
            'model': model,
            'max_tokens': 300,
            'temperature': 0,
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': PROMPT},
                        {'type': 'image_url', 'image_url': {'url': data_url, 'detail': 'low'}},
                    ],
                }
            ],
        },
        timeout=40,
    )
    if r.status_code != 200:
        return {'error': 'ai_failed', 'status': r.status_code, 'detail': r.text[:300]}

    text = r.json()['choices'][0]['message']['content']
    match = re.search(r'\{.*\}', text, re.S)
    if not match:
        return {'error': 'bad_answer'}
    return json.loads(match.group(0))


def ask_ai(data_url: str) -> dict:
    pairs = candidates()
    if not pairs:
        return {'error': 'no_key'}

    last = {'error': 'ai_failed'}
    for key, url in pairs:
        result = call_ai(key, url, data_url)
        if not result.get('error'):
            return result
        last = result
        print('recognize try failed:', url, result.get('status'), str(result.get('detail'))[:120])
    return last


def sq(value: str) -> str:
    """Значение в кавычках для SQL: одинарные кавычки удваиваем."""
    return "'" + str(value).replace("'", "''") + "'"


def normalize_query(text: str) -> str:
    """Ключ для запоминания: «Магнитола  НА Камри!» и «магнитола на камри» — одно и то же."""
    low = re.sub(r'[^a-zа-я0-9\s-]', ' ', text.lower().replace('ё', 'е'))
    return ' '.join(sorted(low.split()))[:200]


def load_catalog() -> list:
    """Активные товары для подбора: название и раздел."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT slug, name, category FROM {get_schema()}.products "
            f"WHERE is_active = TRUE ORDER BY sort_order, id"
        )
        return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def cache_get(key: str) -> dict:
    """Уже отвечали на такой запрос — платить второй раз не нужно."""
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT slugs, explain FROM {get_schema()}.ai_search_cache "
            f"WHERE query_key = {sq(key)}"
        )
        row = cur.fetchone()
        if not row:
            return {}
        cur.execute(
            f"UPDATE {get_schema()}.ai_search_cache SET hits = hits + 1 "
            f"WHERE query_key = {sq(key)}"
        )
        conn.commit()
        return {'slugs': row['slugs'] or [], 'explain': row['explain'] or ''}
    finally:
        conn.close()


def cache_put(key: str, raw: str, slugs: list, explain: str) -> None:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {get_schema()}.ai_search_cache (query_key, query_raw, slugs, explain) "
            f"VALUES ({sq(key)}, {sq(raw[:300])}, "
            f"{sq(json.dumps(slugs, ensure_ascii=False))}, {sq(explain[:300])}) "
            f"ON CONFLICT (query_key) DO UPDATE "
            f"SET slugs = EXCLUDED.slugs, explain = EXCLUDED.explain"
        )
        conn.commit()
    finally:
        conn.close()


def call_ai_text(key: str, url: str, prompt: str) -> dict:
    model = os.environ.get('AI_MODEL', '').strip() or DEFAULT_MODEL
    r = requests.post(
        url,
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
        json={
            'model': model,
            'max_tokens': 300,
            'temperature': 0,
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=25,
    )
    if r.status_code != 200:
        return {'error': 'ai_failed', 'status': r.status_code, 'detail': r.text[:300]}
    text = r.json()['choices'][0]['message']['content']
    match = re.search(r'\{.*\}', text, re.S)
    if not match:
        return {'error': 'bad_answer'}
    return json.loads(match.group(0))


def call_yandex(prompt: str) -> dict:
    """Запрос к YandexGPT. У него свой формат ответа, приводим к общему виду."""
    key = os.environ.get('YANDEX_API_KEY', '').strip()
    folder = os.environ.get('YANDEX_FOLDER_ID', '').strip()
    if not key or not folder:
        return {'error': 'no_key'}

    model = os.environ.get('YANDEX_MODEL', '').strip() or YANDEX_MODEL
    r = requests.post(
        YANDEX_URL,
        headers={'Authorization': f'Api-Key {key}', 'Content-Type': 'application/json'},
        json={
            'modelUri': f'gpt://{folder}/{model}',
            'completionOptions': {'stream': False, 'temperature': 0, 'maxTokens': 400},
            'messages': [{'role': 'user', 'text': prompt}],
        },
        timeout=25,
    )
    if r.status_code != 200:
        return {'error': 'ai_failed', 'status': r.status_code, 'detail': r.text[:300]}

    text = r.json()['result']['alternatives'][0]['message']['text']
    match = re.search(r'\{.*\}', text, re.S)
    if not match:
        return {'error': 'bad_answer'}
    return json.loads(match.group(0))


def ai_provider() -> str:
    """
    Какой сервис использовать для поиска: yandex, openai или auto.
    Сначала смотрим настройку из админки, затем переменную окружения.
    """
    choice = ''
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            cur = conn.cursor()
            cur.execute(
                f"SELECT value FROM {get_schema()}.settings WHERE key = 'ai_search_provider'"
            )
            row = cur.fetchone()
            if row and row[0]:
                choice = str(row[0]).strip().strip('"').lower()
        finally:
            conn.close()
    except Exception as exc:
        print('ai provider setting failed:', str(exc)[:120])

    if choice not in ('yandex', 'openai', 'auto'):
        choice = os.environ.get('AI_SEARCH_PROVIDER', '').strip().lower()
    return choice if choice in ('yandex', 'openai') else 'auto'


def ask_ai_text(prompt: str) -> dict:
    """
    Поиск по смыслу. По умолчанию сначала пробуем YandexGPT (российский сервис),
    а если ключа нет или он не ответил — уходим на OpenAI.
    """
    choice = ai_provider()

    if choice in ('yandex', 'auto'):
        result = call_yandex(prompt)
        if not result.get('error'):
            result['provider'] = 'yandex'
            return result
        # Яндекс не ответил — не оставляем покупателя без поиска и уходим
        # на второй сервис. Причину пишем в логи, чтобы было видно, что чинить
        if result.get('error') != 'no_key':
            print('yandex search failed:', result.get('status'), str(result.get('detail'))[:200])

    pairs = candidates()
    if not pairs:
        return {'error': 'no_key'}
    last = {'error': 'ai_failed'}
    for key, url in pairs:
        result = call_ai_text(key, url, prompt)
        if not result.get('error'):
            result['provider'] = 'openai'
            return result
        last = result
        print('ai search try failed:', url, result.get('status'), str(result.get('detail'))[:120])
    return last


def smart_search(query: str) -> dict:
    """Подбор товаров по смыслу запроса. Повторные запросы берём из памяти."""
    query = query.strip()[:QUERY_LIMIT]
    if len(query) < 3:
        return {'error': 'short'}

    key = normalize_query(query)
    cached = cache_get(key)
    if cached:
        return {'slugs': cached['slugs'], 'explain': cached['explain'], 'cached': True}

    products = load_catalog()
    if not products:
        return {'slugs': [], 'explain': ''}

    lines = [
        f"{i + 1} | {p['name']} | {p['category']}" for i, p in enumerate(products)
    ]
    prompt = (
        f"{SEARCH_PROMPT}\n\nЗапрос покупателя: «{query}»\n\nТовары:\n" + '\n'.join(lines)
    )

    answer = ask_ai_text(prompt)
    if answer.get('error'):
        return answer

    numbers = answer.get('items') or []
    slugs = []
    for n in numbers[:SEARCH_LIMIT]:
        if isinstance(n, int) and 1 <= n <= len(products):
            slug = products[n - 1]['slug']
            if slug not in slugs:
                slugs.append(slug)

    explain = str(answer.get('explain') or '')[:300]
    cache_put(key, query, slugs, explain)
    return {
        'slugs': slugs,
        'explain': explain,
        'cached': False,
        'provider': answer.get('provider') or '',
    }


def handler(event: dict, context) -> dict:
    """Распознаёт авто по фото торпедо, а по действию search — подбирает товары по смыслу запроса."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return resp(405, {'error': 'method not allowed'})

    body = json.loads(event.get('body') or '{}')

    params = event.get('queryStringParameters') or {}
    if params.get('action') == 'search' or body.get('query'):
        found = smart_search(str(body.get('query') or ''))
        if found.get('error') == 'short':
            return resp(400, {'error': 'Запрос слишком короткий'})
        if found.get('error') == 'no_key':
            return resp(503, {'error': 'Поиск по смыслу пока не подключён'})
        if found.get('error'):
            print('ai search failed:', json.dumps(found, ensure_ascii=False)[:400])
            return resp(502, {'error': 'Не удалось разобрать запрос, попробуйте ещё раз'})
        return resp(200, found)

    image = (body.get('image') or '').strip()
    if not image.startswith('data:image'):
        return resp(400, {'error': 'Нужно фото салона автомобиля'})

    payload = image.partition(',')[2]
    if len(base64.b64decode(payload + '===')) > MAX_BYTES:
        return resp(400, {'error': 'Фото слишком большое, до 6 МБ'})

    guess = ask_ai(image)
    if guess.get('error') == 'no_key':
        return resp(503, {'error': 'Подбор по фото пока не подключён. Выберите марку вручную.'})
    if guess.get('error'):
        print('recognize failed:', json.dumps(guess, ensure_ascii=False)[:500])
        return resp(502, {'error': 'Не удалось распознать фото, попробуйте ещё раз'})

    brands = load_brands()
    brand = pick(str(guess.get('brand') or ''), list(brands.keys()))
    model = pick(str(guess.get('model') or ''), brands.get(brand, [])) if brand else ''

    confidence = str(guess.get('confidence') or 'low')
    if not brand:
        confidence = 'low'
    elif not model and confidence == 'high':
        confidence = 'medium'

    year_from = guess.get('yearFrom')
    year_to = guess.get('yearTo')
    year = None
    if isinstance(year_from, int) and isinstance(year_to, int) and year_to >= year_from:
        year = (year_from + year_to) // 2

    return resp(
        200,
        {
            'brand': brand,
            'model': model,
            'year': year,
            'yearFrom': year_from if isinstance(year_from, int) else None,
            'yearTo': year_to if isinstance(year_to, int) else None,
            'confidence': confidence,
            'note': str(guess.get('note') or '')[:160],
            'rawBrand': str(guess.get('brand') or ''),
            'rawModel': str(guess.get('model') or ''),
        },
    )