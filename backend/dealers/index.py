import json
import os
import re

import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}


def get_schema() -> str:
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def normalize_phone(raw: str) -> str:
    """Приводит номер к виду 79991234567 — так он хранится в базе."""
    digits = re.sub(r'\D', '', str(raw or ''))
    if digits.startswith('8'):
        digits = '7' + digits[1:]
    if len(digits) == 10:
        digits = '7' + digits
    return digits


def handler(event: dict, context) -> dict:
    """Проверяет номер телефона дилера и включает дилерский режим."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    phone = normalize_phone(body.get('phone'))

    if len(phone) != 11:
        return {
            'statusCode': 400,
            'headers': CORS,
            'body': json.dumps({'ok': False, 'error': 'Введите номер полностью'}, ensure_ascii=False),
        }

    schema = get_schema()
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        safe_phone = phone.replace("'", "")
        cur.execute(
            f"SELECT id, phone, name, is_active FROM {schema}.dealers "
            f"WHERE phone = '{safe_phone}' LIMIT 1"
        )
        row = cur.fetchone()

        if not row or not row['is_active']:
            return {
                'statusCode': 200,
                'headers': CORS,
                'body': json.dumps(
                    {
                        'ok': False,
                        'error': 'Номер не найден в базе дилеров. Оставьте заявку — менеджер откроет доступ.',
                    },
                    ensure_ascii=False,
                ),
            }

        cur.execute(f"UPDATE {schema}.dealers SET last_login = now() WHERE id = {int(row['id'])}")
        conn.commit()

        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps(
                {'ok': True, 'name': row['name'] or '', 'phone': row['phone']},
                ensure_ascii=False,
            ),
        }
    finally:
        conn.close()
