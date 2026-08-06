import json
import os
import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}


def get_schema() -> str:
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    """Публичный каталог: список активных товаров и справочник марок автомобилей."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') != 'GET':
        return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'method not allowed'})}

    schema = get_schema()
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT slug, name, category, price, old_price, mount, install, warranty, "
            f"year_from, year_to, badge, images, description, specs, kit, fits "
            f"FROM {schema}.products WHERE is_active = TRUE ORDER BY sort_order, id"
        )
        rows = cur.fetchall()
        products = [
            {
                'id': r['slug'],
                'name': r['name'],
                'category': r['category'],
                'price': r['price'],
                'oldPrice': r['old_price'],
                'mount': r['mount'],
                'install': r['install'],
                'warranty': r['warranty'],
                'years': [r['year_from'], r['year_to']],
                'badge': r['badge'],
                'images': r['images'],
                'description': r['description'],
                'specs': r['specs'],
                'kit': r['kit'],
                'fits': r['fits'],
            }
            for r in rows
        ]

        cur.execute(f"SELECT name, models FROM {schema}.brands ORDER BY sort_order, id")
        brands = [{'name': b['name'], 'models': b['models']} for b in cur.fetchall()]
        cur.close()
    finally:
        conn.close()

    return {
        'statusCode': 200,
        'headers': CORS,
        'isBase64Encoded': False,
        'body': json.dumps({'products': products, 'brands': brands}, ensure_ascii=False),
    }
