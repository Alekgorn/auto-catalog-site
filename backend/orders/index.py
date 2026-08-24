import json
import os

import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}


def q(value) -> str:
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def qjson(value) -> str:
    return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"


def handler(event: dict, context) -> dict:
    """Приём заявок с сайта: разовая заявка на товар или заказ из корзины."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'method not allowed'})}

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        body = {}

    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    # Машина, под которую не собрался комплект.
    # Пишем каждый показ заглушки, даже без контакта: владельцу магазина
    # важно видеть, какие авто вообще ищут, а не только оставленные заявки.
    if str(body.get('kind', '')) == 'missing-fit':
        brand = str(body.get('brand', '')).strip()[:64]
        model = str(body.get('model', '')).strip()[:96]
        if not brand or not model:
            return {
                'statusCode': 400,
                'headers': CORS,
                'body': json.dumps({'error': 'Не указана машина'}, ensure_ascii=False),
            }
        try:
            year = int(body.get('year') or 0)
        except (TypeError, ValueError):
            year = 0
        contact = str(body.get('contact', '')).strip()[:128]
        scenario = str(body.get('scenario', '')).strip()[:96]

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        try:
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {schema}.missing_fit_requests "
                f"(brand, model, year, scenario, contact) "
                f"VALUES ({q(brand)}, {q(model)}, {year}, {q(scenario)}, {q(contact)}) "
                f"ON CONFLICT (brand, model, year) DO UPDATE SET "
                f"hits = {schema}.missing_fit_requests.hits + 1, "
                # Контакт не затираем пустым: заход без заявки не должен
                # стирать оставленный ранее телефон
                f"contact = CASE WHEN {q(contact)} = '' "
                f"THEN {schema}.missing_fit_requests.contact ELSE {q(contact)} END, "
                f"scenario = CASE WHEN {q(scenario)} = '' "
                f"THEN {schema}.missing_fit_requests.scenario ELSE {q(scenario)} END, "
                f"updated_at = NOW() RETURNING id"
            )
            row_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
        finally:
            conn.close()

        return {
            'statusCode': 200,
            'headers': CORS,
            'isBase64Encoded': False,
            'body': json.dumps({'ok': True, 'id': row_id}, ensure_ascii=False),
        }

    name = str(body.get('name', '')).strip()
    phone = str(body.get('phone', '')).strip()
    if len(name) < 2:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите имя'}, ensure_ascii=False)}
    digits = ''.join(ch for ch in phone if ch.isdigit())
    if len(digits) < 10:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите телефон'}, ensure_ascii=False)}

    raw_items = body.get('items') or []
    items = []
    total = 0
    for it in raw_items[:50]:
        try:
            price = int(it.get('price', 0))
            qty = max(1, int(it.get('qty', 1)))
        except (TypeError, ValueError):
            price, qty = 0, 1
        items.append({
            'slug': str(it.get('slug', ''))[:64],
            'name': str(it.get('name', ''))[:255],
            'price': price,
            'qty': qty,
        })
        total += price * qty

    kind = 'cart' if len(items) > 1 else 'single'

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {schema}.orders (kind, name, phone, comment, vehicle, items, total, source) "
            f"VALUES ({q(kind)}, {q(name[:128])}, {q(phone[:64])}, "
            f"{q(str(body.get('comment', ''))[:2000])}, {q(str(body.get('vehicle', ''))[:128])}, "
            f"{qjson(items)}, {total}, {q(str(body.get('source', ''))[:64])}) RETURNING id"
        )
        order_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
    finally:
        conn.close()

    return {
        'statusCode': 200,
        'headers': CORS,
        'isBase64Encoded': False,
        'body': json.dumps({'ok': True, 'id': order_id, 'total': total}, ensure_ascii=False),
    }