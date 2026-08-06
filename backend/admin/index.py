import base64
import hashlib
import json
import os
import secrets
import uuid
from datetime import datetime, timedelta

import boto3
import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}

SESSION_DAYS = 7


def resp(status: int, payload: dict) -> dict:
    return {
        'statusCode': status,
        'headers': CORS,
        'isBase64Encoded': False,
        'body': json.dumps(payload, ensure_ascii=False),
    }


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def schema() -> str:
    return os.environ.get('MAIN_DB_SCHEMA', 'public')


def q(value) -> str:
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def qjson(value) -> str:
    return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"


def qint(value, default=0) -> str:
    if value is None or value == '':
        return 'NULL'
    try:
        return str(int(value))
    except (TypeError, ValueError):
        return str(default)


def check_token(conn, token: str) -> bool:
    if not token:
        return False
    cur = conn.cursor()
    cur.execute(
        f"SELECT 1 FROM {schema()}.admin_sessions WHERE token = {q(token)} AND expires_at > NOW()"
    )
    ok = cur.fetchone() is not None
    cur.close()
    return ok


def upload_image(data_url: str) -> str:
    header, _, payload = data_url.partition(',')
    ext = 'jpg'
    if 'png' in header:
        ext = 'png'
    elif 'webp' in header:
        ext = 'webp'
    elif 'svg' in header:
        ext = 'svg'
    content_type = f"image/{'jpeg' if ext == 'jpg' else ext}"
    body = base64.b64decode(payload)
    key = f"catalog/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=body, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def row_to_product(r: dict) -> dict:
    return {
        'id': r['id'],
        'slug': r['slug'],
        'name': r['name'],
        'category': r['category'],
        'price': r['price'],
        'oldPrice': r['old_price'],
        'mount': r['mount'],
        'install': r['install'],
        'warranty': r['warranty'],
        'yearFrom': r['year_from'],
        'yearTo': r['year_to'],
        'badge': r['badge'],
        'images': r['images'],
        'description': r['description'],
        'specs': r['specs'],
        'kit': r['kit'],
        'fits': r['fits'],
        'sortOrder': r['sort_order'],
        'isActive': r['is_active'],
    }


def row_to_order(r: dict) -> dict:
    return {
        'id': r['id'],
        'kind': r['kind'],
        'name': r['name'],
        'phone': r['phone'],
        'comment': r['comment'],
        'vehicle': r['vehicle'],
        'items': r['items'],
        'total': r['total'],
        'status': r['status'],
        'adminNote': r['admin_note'],
        'source': r['source'],
        'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
    }


def row_to_guide(r: dict) -> dict:
    return {
        'id': r['id'],
        'slug': r['slug'],
        'title': r['title'],
        'excerpt': r['excerpt'],
        'cover': r['cover'],
        'duration': r['duration'],
        'difficulty': r['difficulty'],
        'tools': r['tools'],
        'blocks': r['blocks'],
        'sortOrder': r['sort_order'],
        'isActive': r['is_active'],
    }


def slugify(text: str) -> str:
    table = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    }
    out = []
    for ch in text.lower():
        if ch in table:
            out.append(table[ch])
        elif ch.isalnum():
            out.append(ch)
        else:
            out.append('-')
    slug = ''.join(out)
    while '--' in slug:
        slug = slug.replace('--', '-')
    return slug.strip('-')[:80] or 'guide-' + uuid.uuid4().hex[:6]


def handler(event: dict, context) -> dict:
    """Админка каталога: вход по паролю, список, создание, изменение и удаление товаров."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''
    raw_body = event.get('body') or '{}'
    try:
        body = json.loads(raw_body) if raw_body else {}
    except json.JSONDecodeError:
        body = {}

    conn = db()
    try:
        if action == 'login':
            password = str(body.get('password', ''))
            real = os.environ.get('ADMIN_PASSWORD', '')
            if not real:
                return resp(500, {'error': 'Пароль администратора не настроен'})
            if hashlib.sha256(password.encode()).hexdigest() != hashlib.sha256(real.encode()).hexdigest():
                return resp(401, {'error': 'Неверный пароль'})
            new_token = secrets.token_hex(32)
            expires = (datetime.utcnow() + timedelta(days=SESSION_DAYS)).strftime('%Y-%m-%d %H:%M:%S')
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {schema()}.admin_sessions (token, expires_at) VALUES ({q(new_token)}, {q(expires)})"
            )
            cur.execute(f"DELETE FROM {schema()}.admin_sessions WHERE expires_at < NOW()")
            conn.commit()
            cur.close()
            return resp(200, {'token': new_token})

        if not check_token(conn, token):
            return resp(401, {'error': 'Нужен вход'})

        if action == 'check':
            return resp(200, {'ok': True})

        if action == 'logout':
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {schema()}.admin_sessions WHERE token = {q(token)}")
            conn.commit()
            cur.close()
            return resp(200, {'ok': True})

        if action == 'upload':
            data_url = body.get('image', '')
            if not data_url.startswith('data:'):
                return resp(400, {'error': 'Некорректный файл'})
            return resp(200, {'url': upload_image(data_url)})

        if action == 'brands' and method == 'PUT':
            brands = body.get('brands', [])
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {schema()}.brands")
            for i, b in enumerate(brands):
                name = str(b.get('name', '')).strip()
                if not name:
                    continue
                models = [str(m).strip() for m in b.get('models', []) if str(m).strip()]
                cur.execute(
                    f"INSERT INTO {schema()}.brands (name, models, sort_order) "
                    f"VALUES ({q(name)}, {qjson(models)}, {(i + 1) * 10})"
                )
            conn.commit()
            cur.close()
            return resp(200, {'ok': True})

        if action == 'orders':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            if method == 'GET':
                cur.execute(
                    f"SELECT * FROM {schema()}.orders ORDER BY created_at DESC LIMIT 500"
                )
                orders = [row_to_order(r) for r in cur.fetchall()]
                cur.close()
                return resp(200, {'orders': orders})
            if method == 'PUT':
                oid = qint(body.get('id'))
                if oid == 'NULL':
                    return resp(400, {'error': 'Не указана заявка'})
                status = str(body.get('status', 'new'))[:24]
                note = str(body.get('adminNote', ''))[:2000]
                cur.execute(
                    f"UPDATE {schema()}.orders SET status = {q(status)}, "
                    f"admin_note = {q(note)}, updated_at = NOW() WHERE id = {oid} RETURNING *"
                )
                row = cur.fetchone()
                conn.commit()
                cur.close()
                if not row:
                    return resp(404, {'error': 'Заявка не найдена'})
                return resp(200, {'order': row_to_order(row)})
            if method == 'DELETE':
                cur.execute(f"DELETE FROM {schema()}.orders WHERE id = {qint(params.get('id'))}")
                conn.commit()
                cur.close()
                return resp(200, {'ok': True})
            cur.close()
            return resp(400, {'error': 'Неизвестное действие'})

        if action == 'guides':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            if method == 'GET':
                cur.execute(f"SELECT * FROM {schema()}.guides ORDER BY sort_order, id")
                guides = [row_to_guide(r) for r in cur.fetchall()]
                cur.execute(
                    f"SELECT g.id AS gid, p.id AS pid FROM {schema()}.product_guides pg "
                    f"JOIN {schema()}.guides g ON g.id = pg.guide_id "
                    f"JOIN {schema()}.products p ON p.id = pg.product_id"
                )
                links: dict = {}
                for row in cur.fetchall():
                    links.setdefault(row['gid'], []).append(row['pid'])
                for g in guides:
                    g['productIds'] = links.get(g['id'], [])
                cur.close()
                return resp(200, {'guides': guides})

            if method == 'DELETE':
                gid = qint(params.get('id'))
                cur.execute(f"DELETE FROM {schema()}.product_guides WHERE guide_id = {gid}")
                cur.execute(f"DELETE FROM {schema()}.guides WHERE id = {gid}")
                conn.commit()
                cur.close()
                return resp(200, {'ok': True})

            if method in ('POST', 'PUT'):
                title = str(body.get('title', '')).strip()
                if not title:
                    return resp(400, {'error': 'Укажите заголовок'})
                slug = str(body.get('slug', '')).strip() or slugify(title)
                fields = {
                    'slug': q(slug),
                    'title': q(title),
                    'excerpt': q(str(body.get('excerpt', ''))),
                    'cover': q(str(body.get('cover', ''))),
                    'duration': q(str(body.get('duration', ''))),
                    'difficulty': q(str(body.get('difficulty', ''))),
                    'tools': qjson(body.get('tools') or []),
                    'blocks': qjson(body.get('blocks') or []),
                    'sort_order': qint(body.get('sortOrder'), 100),
                    'is_active': 'TRUE' if body.get('isActive', True) else 'FALSE',
                }
                if method == 'POST':
                    cur.execute(
                        f"INSERT INTO {schema()}.guides ({', '.join(fields.keys())}) "
                        f"VALUES ({', '.join(fields.values())}) RETURNING *"
                    )
                else:
                    gid = qint(body.get('id'))
                    if gid == 'NULL':
                        return resp(400, {'error': 'Не указана инструкция'})
                    sets = ', '.join(f"{k} = {v}" for k, v in fields.items())
                    cur.execute(
                        f"UPDATE {schema()}.guides SET {sets}, updated_at = NOW() "
                        f"WHERE id = {gid} RETURNING *"
                    )
                row = cur.fetchone()
                if not row:
                    conn.rollback()
                    cur.close()
                    return resp(404, {'error': 'Инструкция не найдена'})
                guide_id = row['id']
                cur.execute(
                    f"DELETE FROM {schema()}.product_guides WHERE guide_id = {guide_id}"
                )
                for pid in body.get('productIds') or []:
                    pid_sql = qint(pid)
                    if pid_sql != 'NULL':
                        cur.execute(
                            f"INSERT INTO {schema()}.product_guides (product_id, guide_id) "
                            f"VALUES ({pid_sql}, {guide_id}) ON CONFLICT DO NOTHING"
                        )
                conn.commit()
                out = row_to_guide(row)
                out['productIds'] = [int(p) for p in (body.get('productIds') or [])]
                cur.close()
                return resp(200, {'guide': out})
            cur.close()
            return resp(400, {'error': 'Неизвестное действие'})

        if method == 'GET':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                f"SELECT * FROM {schema()}.products ORDER BY sort_order, id"
            )
            products = [row_to_product(r) for r in cur.fetchall()]
            cur.execute(f"SELECT name, models FROM {schema()}.brands ORDER BY sort_order, id")
            brands = [{'name': b['name'], 'models': b['models']} for b in cur.fetchall()]
            cur.execute(
                f"SELECT COUNT(*) AS c FROM {schema()}.orders WHERE status = 'new'"
            )
            new_orders = cur.fetchone()['c']
            cur.close()
            return resp(200, {'products': products, 'brands': brands, 'newOrders': new_orders})

        if method == 'DELETE':
            pid = params.get('id', '')
            cur = conn.cursor()
            cur.execute(f"DELETE FROM {schema()}.product_guides WHERE product_id = {qint(pid)}")
            cur.execute(f"DELETE FROM {schema()}.products WHERE id = {qint(pid)}")
            conn.commit()
            cur.close()
            return resp(200, {'ok': True})

        if method in ('POST', 'PUT'):
            name = str(body.get('name', '')).strip()
            if not name:
                return resp(400, {'error': 'Укажите название'})
            slug = str(body.get('slug', '')).strip() or 'p-' + uuid.uuid4().hex[:8]
            category = str(body.get('category', '')).strip() or 'Другое'
            fields = {
                'slug': q(slug),
                'name': q(name),
                'category': q(category),
                'price': qint(body.get('price'), 0),
                'old_price': qint(body.get('oldPrice')),
                'mount': q(str(body.get('mount', ''))),
                'install': q(str(body.get('install', ''))),
                'warranty': q(str(body.get('warranty', ''))),
                'year_from': qint(body.get('yearFrom'), 2010),
                'year_to': qint(body.get('yearTo'), 2026),
                'badge': q(body.get('badge') or None),
                'images': qjson(body.get('images') or []),
                'description': qjson(body.get('description') or []),
                'specs': qjson(body.get('specs') or []),
                'kit': qjson(body.get('kit') or []),
                'fits': qjson(body.get('fits') or {}),
                'sort_order': qint(body.get('sortOrder'), 100),
                'is_active': 'TRUE' if body.get('isActive', True) else 'FALSE',
            }
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            if method == 'POST':
                cols = ', '.join(fields.keys())
                vals = ', '.join(fields.values())
                cur.execute(
                    f"INSERT INTO {schema()}.products ({cols}) VALUES ({vals}) RETURNING *"
                )
            else:
                pid = qint(body.get('id'))
                if pid == 'NULL':
                    return resp(400, {'error': 'Не указан товар'})
                sets = ', '.join(f"{k} = {v}" for k, v in fields.items())
                cur.execute(
                    f"UPDATE {schema()}.products SET {sets}, updated_at = NOW() "
                    f"WHERE id = {pid} RETURNING *"
                )
            row = cur.fetchone()
            conn.commit()
            cur.close()
            if not row:
                return resp(404, {'error': 'Товар не найден'})
            return resp(200, {'product': row_to_product(row)})

        return resp(400, {'error': 'Неизвестное действие'})
    finally:
        conn.close()