import base64
import gzip
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
            f"SELECT p.slug, p.sku, p.name, p.category, p.subcategory, p.price, p.old_price, p.pro_price, p.ozon_url, p.wb_url, p.install, p.warranty, "
            f"p.year_from, p.year_to, p.badge, p.images, p.video_url, p.description, p.specs, p.kit, p.fits, p.popularity, p.created_at, p.notes, p.extra, p.extra_title, p.stock_qty, p.stock_note, "
            # Подбор проводки: для каких машин и что сохраняет
            f"p.wire_tech, p.wire_keeps, p.wire_level, p.wire_note, p.wire_bodies, "
            # Тип подбора: своё значение товара важнее умолчания категории
            f"COALESCE(NULLIF(p.fit_mode, ''), c.fit_mode, 'universal') AS fit_mode "
            f"FROM {schema}.products p LEFT JOIN {schema}.categories c ON c.name = p.category "
            f"WHERE p.is_active = TRUE ORDER BY p.sort_order, p.id"
        )
        rows = cur.fetchall()
        products = [
            {
                'id': r['slug'],
                'sku': r['sku'] or r['slug'].upper(),
                'name': r['name'],
                'category': r['category'],
                'subcategory': r['subcategory'] or '',
                'price': r['price'],
                'oldPrice': r['old_price'],
                'proPrice': r['pro_price'],
                'ozonUrl': r['ozon_url'],
                'wbUrl': r['wb_url'],
                'install': r['install'],
                'warranty': r['warranty'],
                'years': [r['year_from'], r['year_to']],
                'badge': r['badge'],
                'images': r['images'],
                'videoUrl': r['video_url'] or '',
                'description': r['description'],
                'specs': r['specs'],
                'kit': r['kit'],
                'notes': r['notes'] or [],
                'extra': r['extra'] or [],
                'extraTitle': r['extra_title'] or '',
                'fits': r['fits'],
                'fitMode': r['fit_mode'],
                'wireTech': r['wire_tech'] or {},
                'wireKeeps': r['wire_keeps'] or {},
                'wireLevel': r['wire_level'] or '',
                'wireNote': r['wire_note'] or '',
                'wireBodies': r['wire_bodies'] or [],
                'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
                'popularity': r['popularity'],
                'stock': r['stock_qty'],
                'stockNote': r['stock_note'],
            }
            for r in rows
        ]

        cur.execute(
            f"SELECT name, models, model_bodies FROM {schema}.brands ORDER BY sort_order, id"
        )
        brands = [
            {
                'name': b['name'],
                'models': b['models'],
                # Тип кузова каждой модели: седан, хэтчбек, внедорожник и т.д.
                'modelBodies': b['model_bodies'] or {},
            }
            for b in cur.fetchall()
        ]

        cur.execute(
            f"SELECT id, slug, title, excerpt, cover, duration, difficulty, tools, blocks "
            f"FROM {schema}.guides WHERE is_active = TRUE ORDER BY sort_order, id"
        )
        guide_rows = cur.fetchall()

        cur.execute(
            f"SELECT g.slug AS guide_slug, p.slug AS product_slug "
            f"FROM {schema}.product_guides pg "
            f"JOIN {schema}.guides g ON g.id = pg.guide_id "
            f"JOIN {schema}.products p ON p.id = pg.product_id"
        )
        links = cur.fetchall()

        cur.execute(
            f"SELECT name, spec_fields FROM {schema}.categories WHERE is_active "
            f"ORDER BY sort_order, name"
        )
        cat_rows = cur.fetchall()
        category_rows = [c['name'] for c in cat_rows]
        category_specs = {
            c['name']: (c['spec_fields'] or []) for c in cat_rows if c['spec_fields']
        }

        cur.execute(f"SELECT key, value FROM {schema}.settings")
        settings = {s['key']: s['value'] for s in cur.fetchall()}
        cur.close()
    finally:
        conn.close()

    guide_products: dict = {}
    product_guides: dict = {}
    for link in links:
        guide_products.setdefault(link['guide_slug'], []).append(link['product_slug'])
        product_guides.setdefault(link['product_slug'], []).append(link['guide_slug'])

    guides = [
        {
            'slug': g['slug'],
            'title': g['title'],
            'excerpt': g['excerpt'],
            'cover': g['cover'],
            'duration': g['duration'],
            'difficulty': g['difficulty'],
            'tools': g['tools'],
            'blocks': g['blocks'],
            'products': guide_products.get(g['slug'], []),
        }
        for g in guide_rows
    ]

    for p in products:
        p['guides'] = product_guides.get(p['id'], [])

    payload = json.dumps(
        {
            'products': products,
            'brands': brands,
            'categories': category_rows,
            'categorySpecs': category_specs,
            'guides': guides,
            'settings': settings,
        },
        ensure_ascii=False,
    )

    # Каталог вырос за лимит ответа функции (4 МБ), поэтому отдаём его
    # сжатым — так помещаемся с большим запасом и грузится быстрее.
    # Клиенту, который сжатие не принимает, отвечаем как раньше.
    headers = event.get('headers') or {}
    accepts = str(
        headers.get('Accept-Encoding') or headers.get('accept-encoding') or ''
    ).lower()
    if 'gzip' in accepts:
        packed = gzip.compress(payload.encode('utf-8'), 6)
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Encoding': 'gzip'},
            'isBase64Encoded': True,
            'body': base64.b64encode(packed).decode('ascii'),
        }

    return {
        'statusCode': 200,
        'headers': CORS,
        'isBase64Encoded': False,
        'body': payload,
    }