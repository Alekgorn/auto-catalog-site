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

DEFAULT_MODEL = 'gpt-4o-mini'
DEFAULT_BASE = 'https://api.openai.com/v1'
MAX_BYTES = 6 * 1024 * 1024

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


def ask_ai(data_url: str) -> dict:
    key = os.environ.get('OPENAI_API_KEY', '').strip()
    if not key:
        return {'error': 'no_key'}

    base = os.environ.get('AI_BASE_URL', '').strip().rstrip('/')
    if not base.startswith('http'):
        base = DEFAULT_BASE
    if not base.endswith('/chat/completions'):
        base = base + '/chat/completions'
    model = os.environ.get('AI_MODEL', '').strip() or DEFAULT_MODEL

    r = requests.post(
        base,
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
        return {'error': 'ai_failed', 'status': r.status_code, 'detail': r.text[:400]}

    text = r.json()['choices'][0]['message']['content']
    match = re.search(r'\{.*\}', text, re.S)
    if not match:
        return {'error': 'bad_answer'}
    return json.loads(match.group(0))


def handler(event: dict, context) -> dict:
    """Распознаёт марку и модель автомобиля по фото торпедо или штатной магнитолы."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return resp(405, {'error': 'method not allowed'})

    body = json.loads(event.get('body') or '{}')
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