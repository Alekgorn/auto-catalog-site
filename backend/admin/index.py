import base64
import hashlib
import io
import json
import re
import os
import secrets
import uuid
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}

SESSION_DAYS = 7
XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


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


def _s3():
    # Загружаем тяжёлые библиотеки только когда они реально нужны:
    # иначе выгрузка каталога тратит секунды на импорт и упирается в таймаут
    import boto3

    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def upload_image(data_url: str) -> str:
    header, _, payload = data_url.partition(',')
    ext = 'jpg'
    if 'png' in header:
        ext = 'png'
    elif 'webp' in header:
        ext = 'webp'
    elif 'svg' in header:
        ext = 'svg'
    raw = base64.b64decode(payload)
    from image_optimizer import optimize

    body, ext, content_type = optimize(raw, ext)
    key = f"catalog/{uuid.uuid4().hex}.{ext}"
    s3 = _s3()
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=body,
        ContentType=content_type,
        CacheControl='public, max-age=31536000, immutable',
    )
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


CDN_PREFIX = 'https://cdn.poehali.dev/projects/'


def _is_own_cdn(url: str) -> bool:
    key = os.environ.get('AWS_ACCESS_KEY_ID', '')
    return url.startswith(f'{CDN_PREFIX}{key}/bucket/')


def _cdn_key(url: str) -> str:
    key = os.environ.get('AWS_ACCESS_KEY_ID', '')
    return url.split(f'{CDN_PREFIX}{key}/bucket/', 1)[1].split('?')[0]


def reoptimize_url(url: str) -> str:
    """Скачивает картинку с CDN, пережимает в WebP и кладёт рядом новым файлом."""
    if not _is_own_cdn(url) or url.lower().split('?')[0].endswith(('.webp', '.svg')):
        return url

    src_key = _cdn_key(url)
    s3 = _s3()
    try:
        raw = s3.get_object(Bucket='files', Key=src_key)['Body'].read()
    except Exception:
        return url

    ext = src_key.rsplit('.', 1)[-1].lower()
    from image_optimizer import optimize

    data, new_ext, content_type = optimize(raw, ext)
    if new_ext != 'webp':
        return url

    new_key = f"catalog/{uuid.uuid4().hex}.webp"
    s3.put_object(
        Bucket='files',
        Key=new_key,
        Body=data,
        ContentType=content_type,
        CacheControl='public, max-age=31536000, immutable',
    )
    return f"{CDN_PREFIX}{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{new_key}"


def row_to_product(r: dict) -> dict:
    return {
        'id': r['id'],
        'slug': r['slug'],
        'sku': r.get('sku') or '',
        'name': r['name'],
        'category': r['category'],
        'price': r['price'],
        'oldPrice': r['old_price'],
        'proPrice': r.get('pro_price'),
        'ozonUrl': r.get('ozon_url') or '',
        'wbUrl': r.get('wb_url') or '',
        'install': r['install'],
        'warranty': r['warranty'],
        'yearFrom': r['year_from'],
        'yearTo': r['year_to'],
        'badge': r['badge'],
        'images': r['images'],
        'description': r['description'],
        'specs': r['specs'],
        'kit': r['kit'],
        'notes': r.get('notes') or [],
        'fits': r['fits'],
        'sortOrder': r['sort_order'],
        'popularity': r.get('popularity') or 0,
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


SLUG_LIMIT = 60

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
}

# Предлоги, союзы и «вода» — в адресе не нужны
SLUG_STOP = set("""
    dlya na s so i v vo k ko po ot do iz u o ob pri za pod nad a no ili zhe li by
    eto kak chto vse ves vsya vseh tip tipa vid vida goda godov god let
    shtuk sht komplekte takzhe ochen bolee samyy svoy nash vash lyuboy raznyh
    prochee drugoe novyy universalnyy
""".split())

# Перед числом предлог оставляем: «с 2016» и «до 2016» — разные товары
SLUG_KEEP_BEFORE_NUM = {'s', 'do', 'ot', 'po', 'pod', 'nad', 'iz'}


def slugify(text: str, limit: int = SLUG_LIMIT) -> str:
    """Название → короткий SEO-адрес на латинице, только значимые слова."""
    translit = ''.join(TRANSLIT.get(ch, ch) for ch in str(text or '').lower())
    words = [w for w in re.split(r'[^a-z0-9]+', translit) if w]

    kept = []
    seen = set()
    for i, w in enumerate(words):
        nxt = words[i + 1] if i + 1 < len(words) else ''
        keep_prefix = w in SLUG_KEEP_BEFORE_NUM and nxt.isdigit()
        if w in SLUG_STOP and not keep_prefix and kept:
            continue
        if w in seen and not w.isdigit():
            continue
        seen.add(w)
        kept.append(w)

    source = kept or words[:1]
    if not source:
        return 'tovar'

    slug = ''
    for w in source:
        candidate = w if not slug else slug + '-' + w
        if len(candidate) > limit:
            break
        slug = candidate
    return slug or source[0][:limit]


XLS_COLUMNS = [
    ('slug', 'Код (не менять)', 30),
    ('sku', 'Артикул', 16),
    ('name', 'Название', 46),
    ('category', 'Категория', 18),
    ('price', 'Цена', 12),
    ('oldPrice', 'Старая цена', 13),
    ('proPrice', 'Цена дилера', 13),
    ('warranty', 'Гарантия', 12),
    ('install', 'Установка', 18),
    ('ozonUrl', 'Ссылка Ozon', 34),
    ('wbUrl', 'Ссылка Wildberries', 34),
    ('yearFrom', 'Год с', 8),
    ('yearTo', 'Год по', 8),
    ('badge', 'Метка', 12),
    ('popularity', 'Популярность', 14),
    ('sortOrder', 'Порядок', 10),
    ('isActive', 'На сайте (да/нет)', 17),
    ('fits', 'Совместимость', 60),
    ('images', 'Фото (ссылки через ;)', 40),
    ('description', 'Описание (абзацы через |)', 50),
    ('specs', 'Характеристики (Имя=Значение;)', 50),
    ('kit', 'Комплектация (через ;)', 40),
]


def fits_to_text(fits: dict) -> str:
    return ' | '.join(
        f"{brand}: {', '.join(models)}" for brand, models in (fits or {}).items()
    )


def text_to_fits(text: str) -> dict:
    out: dict = {}
    for chunk in str(text or '').split('|'):
        if ':' not in chunk:
            continue
        brand, _, models = chunk.partition(':')
        brand = brand.strip()
        items = [m.strip() for m in models.split(',') if m.strip()]
        if brand and items:
            out[brand] = items
    return out


def specs_to_text(specs: list) -> str:
    parts = []
    for row in specs or []:
        if isinstance(row, (list, tuple)) and len(row) >= 2:
            parts.append(f"{row[0]}={row[1]}")
    return '; '.join(parts)


def text_to_specs(text: str) -> list:
    out = []
    for chunk in str(text or '').split(';'):
        if '=' not in chunk:
            continue
        k, _, v = chunk.partition('=')
        if k.strip():
            out.append([k.strip(), v.strip()])
    return out


def list_to_text(items: list, sep: str = '; ') -> str:
    return sep.join(str(i) for i in (items or []))


def text_to_list(text: str, sep: str) -> list:
    return [p.strip() for p in str(text or '').split(sep) if p.strip()]


def build_xlsx(products: list, brands: list, categories: list = None) -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    head_font = Font(bold=True, color='FFFFFF', size=10)
    head_fill = PatternFill('solid', fgColor='1B1B1B')
    lock_fill = PatternFill('solid', fgColor='E01B0C')

    ws = wb.active
    ws.title = 'Товары'
    for i, (key, title, width) in enumerate(XLS_COLUMNS, start=1):
        cell = ws.cell(row=1, column=i, value=title)
        cell.font = head_font
        cell.fill = lock_fill if key == 'slug' else head_fill
        cell.alignment = Alignment(vertical='center', wrap_text=True)
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.row_dimensions[1].height = 32
    ws.freeze_panes = 'C2'

    for r, p in enumerate(products, start=2):
        values = {
            'slug': p.get('slug', ''),
            'sku': p.get('sku', ''),
            'name': p.get('name', ''),
            'category': p.get('category', ''),
            'price': p.get('price', 0),
            'oldPrice': p.get('oldPrice'),
            'proPrice': p.get('proPrice'),
            'warranty': p.get('warranty', ''),
            'install': p.get('install', ''),
            'ozonUrl': p.get('ozonUrl', ''),
            'wbUrl': p.get('wbUrl', ''),
            'yearFrom': p.get('yearFrom', ''),
            'yearTo': p.get('yearTo', ''),
            'badge': p.get('badge') or '',
            'popularity': p.get('popularity', 0),
            'sortOrder': p.get('sortOrder', 100),
            'isActive': 'да' if p.get('isActive', True) else 'нет',
            'fits': fits_to_text(p.get('fits') or {}),
            'images': list_to_text(p.get('images') or []),
            'description': ' | '.join(p.get('description') or []),
            'specs': specs_to_text(p.get('specs') or []),
            'kit': list_to_text(p.get('kit') or []),
        }
        for i, (key, _t, _w) in enumerate(XLS_COLUMNS, start=1):
            ws.cell(row=r, column=i, value=values.get(key))

    wsb = wb.create_sheet('Марки и модели')
    for i, title in enumerate(['Марка', 'Модели (через запятую)'], start=1):
        cell = wsb.cell(row=1, column=i, value=title)
        cell.font = head_font
        cell.fill = head_fill
    wsb.column_dimensions['A'].width = 22
    wsb.column_dimensions['B'].width = 80
    wsb.freeze_panes = 'A2'
    for r, b in enumerate(brands, start=2):
        wsb.cell(row=r, column=1, value=b.get('name', ''))
        wsb.cell(row=r, column=2, value=', '.join(b.get('models') or []))

    wsc = wb.create_sheet('Категории')
    for i, title in enumerate(
        ['Категория', 'Порядок', 'Характеристики категории (через запятую)'], start=1
    ):
        cell = wsc.cell(row=1, column=i, value=title)
        cell.font = head_font
        cell.fill = head_fill
    wsc.column_dimensions['A'].width = 30
    wsc.column_dimensions['B'].width = 10
    wsc.column_dimensions['C'].width = 60
    wsc.freeze_panes = 'A2'
    for r, c in enumerate(categories or [], start=2):
        wsc.cell(row=r, column=1, value=c.get('name', ''))
        wsc.cell(row=r, column=2, value=c.get('sortOrder', (r - 1) * 10))
        wsc.cell(row=r, column=3, value=', '.join(c.get('specFields') or []))

    wsh = wb.create_sheet('Как заполнять')
    tips = [
        ['Подсказка', 'Что важно знать'],
        ['Столбец «Код»', 'Не меняйте и не удаляйте — по нему товар находится при загрузке. Для нового товара оставьте пустым.'],
        ['Новый товар', 'Добавьте строку внизу, заполните название, категорию и цену. Код создастся сам.'],
        ['Цены', 'Числа. Пробелы, запятую и знак рубля уберём сами: «15 900,00 ₽» прочитается как 15900. Пустая «Старая цена» — скидки нет.'],
        ['Установка', 'Куда ставится: «в штатное место», «в ручку багажника». Показывается в карточке.'],
        ['Ozon и Wildberries', 'Ссылки на товар на маркетплейсах. Пусто — кнопка не показывается.'],
        ['На сайте', '«да» — товар виден покупателям, «нет» — скрыт.'],
        ['Совместимость', 'Формат: Lada: Vesta SW Cross, Granta | Kia: Rio, Seltos'],
        ['Фото', 'Ссылки на картинки через точку с запятой.'],
        ['Описание', 'Абзацы разделяйте вертикальной чертой |. Внутри самого текста черту не используйте — она разорвёт абзац.'],
        ['Характеристики', 'Формат: Гарантия=5 лет; Материал=сталь 2 мм'],
        ['Комплектация', 'Пункты через точку с запятой.'],
        ['Марки и модели', 'Отдельный лист. Модели одной марки — через запятую.'],
        ['Категории', 'Отдельный лист. Порядок задаёт вид фильтра на сайте. Характеристики категории показываются в каталоге под товаром.'],
        ['Загрузка', 'Ничего не удаляется: совпавшие по коду товары обновятся, новые добавятся.'],
        ['Лишние столбцы', 'Можно удалить ненужные столбцы — эти поля у товара останутся прежними. Столбцы «Код», «Название», «Категория» нужны всегда.'],
    ]
    for r, row in enumerate(tips, start=1):
        for c, val in enumerate(row, start=1):
            cell = wsh.cell(row=r, column=c, value=val)
            if r == 1:
                cell.font = head_font
                cell.fill = head_fill
            cell.alignment = Alignment(vertical='top', wrap_text=True)
    wsh.column_dimensions['A'].width = 26
    wsh.column_dimensions['B'].width = 90

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def parse_xlsx(data: bytes) -> tuple:
    from openpyxl import load_workbook

    wb = load_workbook(io.BytesIO(data), data_only=True)
    products = []
    brands = []
    categories = []

    titles = {t: k for k, t, _w in XLS_COLUMNS}

    if 'Товары' in wb.sheetnames:
        ws = wb['Товары']
    else:
        ws = wb.worksheets[0]

    header = [str(c.value or '').strip() for c in ws[1]]
    index = {}
    for i, title in enumerate(header):
        key = titles.get(title)
        if key:
            index[key] = i

    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or all(v in (None, '') for v in row):
            continue

        def get(key, default=''):
            i = index.get(key)
            if i is None or i >= len(row):
                return default
            v = row[i]
            return default if v is None else v

        name = str(get('name')).strip()
        if not name:
            continue

        def as_int(key, default=None):
            # Из 1С и Excel цены приходят как «15 900,00» или «15 900.00 ₽»
            raw = str(get(key, '')).strip()
            raw = raw.replace(' ', '').replace('\u00a0', '').replace(',', '.')
            raw = re.sub(r'[^0-9.\-]', '', raw)
            if raw in ('', '-', '.'):
                return default
            try:
                return int(round(float(raw)))
            except ValueError:
                return default

        active_raw = str(get('isActive', 'да')).strip().lower()
        products.append({
            'slug': str(get('slug')).strip(),
            'sku': str(get('sku')).strip(),
            'name': name,
            'category': str(get('category')).strip(),
            'price': as_int('price', 0) or 0,
            'oldPrice': as_int('oldPrice'),
            'proPrice': as_int('proPrice'),
            'warranty': str(get('warranty')).strip(),
            'install': str(get('install')).strip(),
            'ozonUrl': str(get('ozonUrl')).strip(),
            'wbUrl': str(get('wbUrl')).strip(),
            'yearFrom': as_int('yearFrom', 2010),
            'yearTo': as_int('yearTo', 2026),
            'badge': str(get('badge')).strip() or None,
            'popularity': as_int('popularity', 0) or 0,
            'sortOrder': as_int('sortOrder', 100) or 100,
            'isActive': active_raw not in ('нет', 'no', 'false', '0', 'скрыт'),
            'fits': text_to_fits(get('fits')),
            'images': text_to_list(get('images'), ';'),
            'description': text_to_list(get('description'), '|'),
            'specs': text_to_specs(get('specs')),
            'kit': text_to_list(get('kit'), ';'),
            # Какие столбцы реально были в файле — остальные поля не трогаем
            '_columns': sorted(index.keys()),
        })

    if 'Марки и модели' in wb.sheetnames:
        wsb = wb['Марки и модели']
        for row in wsb.iter_rows(min_row=2, values_only=True):
            if not row or not row[0]:
                continue
            models = str(row[1] or '')
            brands.append({
                'name': str(row[0]).strip(),
                'models': [m.strip() for m in models.split(',') if m.strip()],
            })

    if 'Категории' in wb.sheetnames:
        wsc = wb['Категории']
        for row in wsc.iter_rows(min_row=2, values_only=True):
            if not row or not row[0]:
                continue
            fields = str(row[2] or '') if len(row) > 2 else ''
            try:
                order = int(row[1]) if len(row) > 1 and row[1] is not None else 0
            except (TypeError, ValueError):
                order = 0
            categories.append({
                'name': str(row[0]).strip(),
                'sortOrder': order,
                'specFields': [f.strip() for f in fields.split(',') if f.strip()],
            })

    return products, brands, categories


def build_brands_xlsx(brands: list) -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    head_font = Font(bold=True, color='FFFFFF', size=10)
    head_fill = PatternFill('solid', fgColor='1B1B1B')

    ws = wb.active
    ws.title = 'Марки и модели'
    for i, (title, width) in enumerate(
        [('Марка', 26), ('Модель', 40), ('Порядок марки', 15)], start=1
    ):
        cell = ws.cell(row=1, column=i, value=title)
        cell.font = head_font
        cell.fill = head_fill
        cell.alignment = Alignment(vertical='center')
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.row_dimensions[1].height = 26
    ws.freeze_panes = 'A2'

    row = 2
    for i, b in enumerate(brands or []):
        bname = str(b.get('name', '')).strip()
        if not bname:
            continue
        models = [str(m).strip() for m in (b.get('models') or []) if str(m).strip()]
        if not models:
            ws.cell(row=row, column=1, value=bname)
            ws.cell(row=row, column=3, value=(i + 1) * 10)
            row += 1
            continue
        for m in models:
            ws.cell(row=row, column=1, value=bname)
            ws.cell(row=row, column=2, value=m)
            ws.cell(row=row, column=3, value=(i + 1) * 10)
            row += 1

    wsh = wb.create_sheet('Как заполнять')
    tips = [
        ['Подсказка', 'Что важно знать'],
        ['Одна строка', 'Одна строка — одна пара «марка + модель». Марка повторяется столько раз, сколько у неё моделей.'],
        ['Новая марка', 'Просто добавьте строки внизу: впишите название марки и модель. Марка создастся сама.'],
        ['Новая модель', 'Добавьте строку с уже существующей маркой и новым названием модели.'],
        ['Переименование', 'Меняйте название прямо в ячейке. Учтите: у товаров совместимость привязана к старому названию.'],
        ['Порядок марки', 'Число, по которому марки сортируются в подборе. Меньше — выше. Можно оставить пустым.'],
        ['Марка без моделей', 'Оставьте столбец «Модель» пустым — марка появится в списке без моделей.'],
        ['Загрузка', 'Марки из файла заменяют список целиком: чего нет в файле — того не будет на сайте.'],
        ['Дубли', 'Одинаковые пары «марка + модель» схлопываются автоматически, можно не следить.'],
    ]
    for r, line in enumerate(tips, start=1):
        for c, val in enumerate(line, start=1):
            cell = wsh.cell(row=r, column=c, value=val)
            if r == 1:
                cell.font = head_font
                cell.fill = head_fill
            cell.alignment = Alignment(vertical='top', wrap_text=True)
    wsh.column_dimensions['A'].width = 26
    wsh.column_dimensions['B'].width = 95

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def parse_brands_xlsx(data: bytes) -> list:
    from openpyxl import load_workbook

    wb = load_workbook(io.BytesIO(data), data_only=True)
    ws = wb['Марки и модели'] if 'Марки и модели' in wb.sheetnames else wb.worksheets[0]

    header = [str(c.value or '').strip().lower() for c in ws[1]]
    wide = 'модели (через запятую)' in header

    order: dict = {}
    models_by_brand: dict = {}

    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        bname = str(row[0]).strip()
        if not bname:
            continue
        raw = str(row[1] or '') if len(row) > 1 else ''
        items = (
            [m.strip() for m in raw.split(',') if m.strip()]
            if wide
            else ([raw.strip()] if raw.strip() else [])
        )
        bucket = models_by_brand.setdefault(bname, [])
        for m in items:
            if m not in bucket:
                bucket.append(m)
        if bname not in order:
            sort_raw = str(row[2] or '').strip() if len(row) > 2 else ''
            try:
                order[bname] = int(float(sort_raw)) if sort_raw else len(order) * 10 + 10
            except ValueError:
                order[bname] = len(order) * 10 + 10

    return [
        {'name': name, 'models': models_by_brand[name]}
        for name in sorted(models_by_brand, key=lambda n: (order.get(n, 999), n))
    ]


def replace_brands(conn, brands: list) -> int:
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {schema()}.brands")
    saved = 0
    for i, b in enumerate(brands):
        name = str(b.get('name', '')).strip()[:64]
        if not name:
            continue
        models = [str(m).strip() for m in (b.get('models') or []) if str(m).strip()]
        cur.execute(
            f"INSERT INTO {schema()}.brands (name, models, sort_order) "
            f"VALUES ({q(name)}, {qjson(models)}, {(i + 1) * 10}) "
            f"ON CONFLICT (name) DO UPDATE SET models = EXCLUDED.models, "
            f"sort_order = EXCLUDED.sort_order"
        )
        saved += 1
    conn.commit()
    cur.close()
    return saved


def make_slug(name: str, taken: set) -> str:
    """Уникальный SEO-адрес товара. При совпадении добавляем номер."""
    base = slugify(name) or 'tovar'
    slug = base
    n = 2
    while slug in taken:
        suffix = f'-{n}'
        slug = base[: SLUG_LIMIT - len(suffix)].rstrip('-') + suffix
        n += 1
    taken.add(slug)
    return slug


def import_categories(conn, items: list) -> int:
    """Сохраняет лист «Категории»: порядок и набор характеристик."""
    if not items:
        return 0
    cur = conn.cursor()
    saved = 0
    for i, item in enumerate(items):
        name = str(item.get('name', '')).strip()[:128]
        if not name:
            continue
        order = int(item.get('sortOrder') or 0) or (i + 1) * 10
        fields = [
            str(f).strip()[:64] for f in (item.get('specFields') or []) if str(f).strip()
        ]
        cur.execute(f"SELECT id FROM {schema()}.categories WHERE name = {q(name)}")
        if cur.fetchone():
            cur.execute(
                f"UPDATE {schema()}.categories SET sort_order = {order}, "
                f"spec_fields = {qjson(fields)}, is_active = TRUE WHERE name = {q(name)}"
            )
        else:
            slug = 'cat-' + uuid.uuid4().hex[:8]
            cur.execute(
                f"INSERT INTO {schema()}.categories (slug, name, sort_order, spec_fields) "
                f"VALUES ({q(slug)}, {q(name)}, {order}, {qjson(fields)})"
            )
        saved += 1
    conn.commit()
    cur.close()
    return saved


def import_rows(conn, in_products: list, in_brands: list, mode: str) -> dict:
    cur = conn.cursor()
    created = 0
    updated = 0

    skipped: list = []

    cur.execute(f"SELECT slug FROM {schema()}.products")
    taken = {row[0] for row in cur.fetchall()}

    for i, p in enumerate(in_products):
        name = str(p.get('name', '')).strip()[:255]
        if not name:
            continue
        slug = str(p.get('slug', '')).strip()[:64] or make_slug(name, taken)
        sku = str(p.get('sku', '')).strip()[:64] or slug.upper()[:64]
        fields = {
            'slug': q(slug),
            'sku': q(sku),
            'name': q(name),
            'category': q(str(p.get('category', '')).strip()[:64] or 'Другое'),
            'price': qint(p.get('price'), 0),
            'old_price': qint(p.get('oldPrice')),
            'pro_price': qint(p.get('proPrice')),
            'ozon_url': q(str(p.get('ozonUrl', ''))),
            'wb_url': q(str(p.get('wbUrl', ''))),
            'install': q(str(p.get('install', ''))[:64]),
            'warranty': q(str(p.get('warranty', ''))[:64]),
            'year_from': qint(p.get('yearFrom'), 2010),
            'year_to': qint(p.get('yearTo'), 2026),
            'badge': q((str(p.get('badge'))[:32] if p.get('badge') else None)),
            'images': qjson(p.get('images') or []),
            'description': qjson(p.get('description') or []),
            'specs': qjson(p.get('specs') or []),
            'kit': qjson(p.get('kit') or []),
            'notes': qjson(p.get('notes') or []),
            'fits': qjson(p.get('fits') or {}),
            'sort_order': qint(p.get('sortOrder'), (i + 1) * 10),
            'popularity': qint(p.get('popularity'), 0),
            'is_active': 'TRUE' if p.get('isActive', True) else 'FALSE',
        }

        # Столбца нет в файле — у существующего товара оставляем прежнее значение
        full_fields = dict(fields)
        present = p.get('_columns')
        if present:
            keep = {
                'slug': 'slug', 'sku': 'sku', 'name': 'name', 'category': 'category',
                'price': 'price', 'oldPrice': 'old_price', 'proPrice': 'pro_price',
                'ozonUrl': 'ozon_url', 'wbUrl': 'wb_url', 'install': 'install',
                'warranty': 'warranty', 'yearFrom': 'year_from', 'yearTo': 'year_to',
                'badge': 'badge', 'images': 'images', 'description': 'description',
                'specs': 'specs', 'kit': 'kit', 'fits': 'fits',
                'sortOrder': 'sort_order', 'popularity': 'popularity',
                'isActive': 'is_active',
            }
            allowed = {keep[k] for k in present if k in keep}
            allowed |= {'slug', 'sku', 'name', 'category'}
            fields = {k: v for k, v in fields.items() if k in allowed}

        try:
            cur.execute(f"SELECT id FROM {schema()}.products WHERE slug = {q(slug)}")
            found = cur.fetchone()
            if found:
                if mode == 'skip':
                    continue
                sets = ', '.join(f"{k} = {v}" for k, v in fields.items())
                cur.execute(
                    f"UPDATE {schema()}.products SET {sets}, updated_at = NOW() "
                    f"WHERE id = {found[0]}"
                )
                updated += 1
            else:
                cur.execute(
                    f"INSERT INTO {schema()}.products ({', '.join(full_fields.keys())}) "
                    f"VALUES ({', '.join(full_fields.values())})"
                )
                created += 1
        except Exception as exc:
            # Одна кривая строка не должна ронять всю загрузку
            conn.rollback()
            cur = conn.cursor()
            skipped.append(f'строка {i + 2} ({name[:40]}): {str(exc).strip()[:90]}')

    for i, b in enumerate(in_brands):
        bname = str(b.get('name', '')).strip()[:64]
        if not bname:
            continue
        models = [str(m).strip() for m in (b.get('models') or []) if str(m).strip()]
        cur.execute(
            f"INSERT INTO {schema()}.brands (name, models, sort_order) "
            f"VALUES ({q(bname)}, {qjson(models)}, {(i + 1) * 10}) "
            f"ON CONFLICT (name) DO UPDATE SET models = EXCLUDED.models"
        )

    # Категории из загруженных товаров должны появиться в справочнике
    cur.execute(
        f"INSERT INTO {schema()}.categories (slug, name, sort_order) "
        f"SELECT 'cat-' || substr(md5(random()::text), 1, 8), src.category, 999 "
        f"FROM (SELECT DISTINCT category FROM {schema()}.products "
        f"WHERE category IS NOT NULL AND category <> '') AS src "
        f"WHERE NOT EXISTS (SELECT 1 FROM {schema()}.categories c WHERE c.name = src.category)"
    )

    conn.commit()
    cur.close()
    result = {'created': created, 'updated': updated}
    if skipped:
        result['skipped'] = len(skipped)
        result['problems'] = skipped[:10]
    return result


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

        if action == 'optimize-images':
            """Пережимает фото товаров в WebP порциями, чтобы уложиться в таймаут."""
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                f"SELECT id, images FROM {schema()}.products "
                f"WHERE images::text ~* '\\.(png|jpe?g)' ORDER BY id"
            )
            rows = cur.fetchall()

            def heavy(u: str) -> bool:
                return u.lower().split('?')[0].endswith(('.png', '.jpg', '.jpeg'))

            left = sum(len([u for u in (r['images'] or []) if heavy(u)]) for r in rows)

            if method == 'GET':
                cur.close()
                return resp(200, {'left': left})

            # За один вызов пережимаем ровно одно фото — лимит функции 2 секунды
            saved = 0
            for r in rows:
                urls = r['images'] or []
                idx = next((i for i, u in enumerate(urls) if heavy(u)), None)
                if idx is None:
                    continue
                new_url = reoptimize_url(urls[idx])
                if new_url == urls[idx]:
                    continue
                urls[idx] = new_url
                cur.execute(
                    f"UPDATE {schema()}.products SET images = {qjson(urls)} "
                    f"WHERE id = {r['id']}"
                )
                conn.commit()
                saved = 1
                break

            cur.close()
            return resp(200, {'done': saved, 'saved': saved, 'left': max(left - saved, 0)})

        if action == 'bulk' and method == 'POST':
            ids = [int(i) for i in (body.get('ids') or []) if str(i).isdigit()]
            if not ids:
                return resp(400, {'error': 'Не выбрано ни одного товара'})
            id_list = ','.join(str(i) for i in ids)
            op = str(body.get('op', ''))
            cur = conn.cursor()

            if op == 'category':
                category = str(body.get('category', '')).strip()[:64]
                if not category:
                    cur.close()
                    return resp(400, {'error': 'Не указана категория'})
                cur.execute(
                    f"UPDATE {schema()}.products SET category = {q(category)}, "
                    f"updated_at = NOW() WHERE id IN ({id_list})"
                )
            elif op == 'delete':
                cur.execute(f"DELETE FROM {schema()}.product_guides WHERE product_id IN ({id_list})")
                cur.execute(f"DELETE FROM {schema()}.products WHERE id IN ({id_list})")
            elif op in ('show', 'hide'):
                flag = 'TRUE' if op == 'show' else 'FALSE'
                cur.execute(
                    f"UPDATE {schema()}.products SET is_active = {flag}, "
                    f"updated_at = NOW() WHERE id IN ({id_list})"
                )
            else:
                cur.close()
                return resp(400, {'error': 'Неизвестное действие'})

            conn.commit()
            cur.close()
            return resp(200, {'ok': True, 'affected': len(ids)})

        if action == 'categories':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            if method == 'GET':
                cur.execute(
                    f"SELECT c.name, c.sort_order, c.is_active, c.spec_fields, "
                    f"(SELECT COUNT(*) FROM {schema()}.products p WHERE p.category = c.name) AS products "
                    f"FROM {schema()}.categories c WHERE c.is_active "
                    f"ORDER BY c.sort_order, c.name"
                )
                items = [
                    {
                        'name': r['name'],
                        'sortOrder': r['sort_order'],
                        'products': int(r['products']),
                        'specFields': r['spec_fields'] or [],
                    }
                    for r in cur.fetchall()
                ]
                cur.close()
                return resp(200, {'categories': items})

            if method == 'PUT':
                items = body.get('categories') or []
                # Прячем все, затем возвращаем присланные — так удаление не теряет товары
                cur.execute(f"UPDATE {schema()}.categories SET is_active = FALSE")
                for i, item in enumerate(items):
                    name = str(item.get('name', '')).strip()[:128]
                    if not name:
                        continue
                    old = str(item.get('oldName', '')).strip()[:128]
                    order = (i + 1) * 10
                    fields = [
                        str(f).strip()[:64]
                        for f in (item.get('specFields') or [])
                        if str(f).strip()
                    ]
                    if old and old != name:
                        # Переименование — тянем за собой товары
                        cur.execute(
                            f"UPDATE {schema()}.products SET category = {q(name)}, "
                            f"updated_at = NOW() WHERE category = {q(old)}"
                        )
                        cur.execute(
                            f"UPDATE {schema()}.categories SET name = {q(name)}, "
                            f"sort_order = {order}, is_active = TRUE, "
                            f"spec_fields = {qjson(fields)} WHERE name = {q(old)}"
                        )
                        continue
                    cur.execute(
                        f"SELECT id FROM {schema()}.categories WHERE name = {q(name)}"
                    )
                    if cur.fetchone():
                        cur.execute(
                            f"UPDATE {schema()}.categories SET sort_order = {order}, "
                            f"is_active = TRUE, spec_fields = {qjson(fields)} "
                            f"WHERE name = {q(name)}"
                        )
                    else:
                        slug = 'cat-' + uuid.uuid4().hex[:8]
                        cur.execute(
                            f"INSERT INTO {schema()}.categories "
                            f"(slug, name, sort_order, spec_fields) "
                            f"VALUES ({q(slug)}, {q(name)}, {order}, {qjson(fields)})"
                        )
                conn.commit()
                cur.close()
                return resp(200, {'ok': True})

            cur.close()
            return resp(400, {'error': 'Неизвестное действие'})

        if action == 'dealers':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            if method == 'GET':
                cur.execute(
                    f"SELECT id, phone, name, comment, is_active, last_login, created_at "
                    f"FROM {schema()}.dealers ORDER BY created_at DESC"
                )
                items = [
                    {
                        'id': r['id'],
                        'phone': r['phone'],
                        'name': r['name'],
                        'comment': r['comment'],
                        'isActive': r['is_active'],
                        'lastLogin': r['last_login'].isoformat() if r['last_login'] else None,
                        'createdAt': r['created_at'].isoformat() if r['created_at'] else None,
                    }
                    for r in cur.fetchall()
                ]
                cur.close()
                return resp(200, {'dealers': items})

            if method == 'POST':
                phone = re.sub(r'\D', '', str(body.get('phone', '')))
                if phone.startswith('8'):
                    phone = '7' + phone[1:]
                if len(phone) == 10:
                    phone = '7' + phone
                if len(phone) != 11:
                    cur.close()
                    return resp(400, {'error': 'Введите номер полностью'})

                name = str(body.get('name', ''))[:160]
                comment = str(body.get('comment', ''))[:255]
                cur.execute(
                    f"INSERT INTO {schema()}.dealers (phone, name, comment) "
                    f"VALUES ({q(phone)}, {q(name)}, {q(comment)}) "
                    f"ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, "
                    f"comment = EXCLUDED.comment, is_active = TRUE"
                )
                conn.commit()
                cur.close()
                return resp(200, {'ok': True})

            if method == 'DELETE':
                dealer_id = int(body.get('id') or 0)
                if dealer_id:
                    cur.execute(f"DELETE FROM {schema()}.dealers WHERE id = {dealer_id}")
                    conn.commit()
                cur.close()
                return resp(200, {'ok': True})

            if method == 'PUT':
                dealer_id = int(body.get('id') or 0)
                active = 'TRUE' if body.get('isActive') else 'FALSE'
                if dealer_id:
                    cur.execute(
                        f"UPDATE {schema()}.dealers SET is_active = {active} WHERE id = {dealer_id}"
                    )
                    conn.commit()
                cur.close()
                return resp(200, {'ok': True})

            cur.close()

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

        if action == 'brands-export-xlsx':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(
                f"SELECT name, models FROM {schema()}.brands ORDER BY sort_order, id"
            )
            brands = [{'name': b['name'], 'models': b['models']} for b in cur.fetchall()]
            cur.close()
            data = build_brands_xlsx(brands)
            return resp(200, {'file': base64.b64encode(data).decode('ascii')})

        if action == 'brands-import-xlsx':
            raw = str(body.get('file', ''))
            if ',' in raw and raw.startswith('data:'):
                raw = raw.split(',', 1)[1]
            try:
                blob = base64.b64decode(raw)
            except Exception:
                return resp(400, {'error': 'Файл не читается'})
            try:
                parsed = parse_brands_xlsx(blob)
            except Exception:
                return resp(400, {'error': 'Это не таблица Excel или структура изменена'})
            if not parsed:
                return resp(400, {'error': 'В таблице не нашлось ни одной марки'})
            saved = replace_brands(conn, parsed)
            models = sum(len(b['models']) for b in parsed)
            return resp(200, {'ok': True, 'brands': saved, 'models': models})

        if action == 'settings':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            if method == 'GET':
                cur.execute(f"SELECT key, value FROM {schema()}.settings")
                data = {s['key']: s['value'] for s in cur.fetchall()}
                cur.close()
                return resp(200, {'settings': data})
            if method == 'PUT':
                for key, value in (body.get('settings') or {}).items():
                    cur.execute(
                        f"INSERT INTO {schema()}.settings (key, value, updated_at) "
                        f"VALUES ({q(str(key)[:64])}, {qjson(value)}, NOW()) "
                        f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()"
                    )
                conn.commit()
                cur.close()
                return resp(200, {'ok': True})
            cur.close()
            return resp(400, {'error': 'Неизвестное действие'})

        if action == 'export':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(f"SELECT * FROM {schema()}.products ORDER BY sort_order, id")
            products = [row_to_product(r) for r in cur.fetchall()]
            cur.execute(f"SELECT name, models FROM {schema()}.brands ORDER BY sort_order, id")
            brands = [{'name': b['name'], 'models': b['models']} for b in cur.fetchall()]
            cur.close()
            for p in products:
                p.pop('id', None)
            return resp(200, {'version': 1, 'products': products, 'brands': brands})

        if action == 'import':
            stats = import_rows(
                conn,
                body.get('products') or [],
                body.get('brands') or [],
                str(body.get('mode', 'merge')),
            )
            return resp(200, {'ok': True, **stats})

        if action == 'export-xlsx':
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(f"SELECT * FROM {schema()}.products ORDER BY sort_order, id")
            products = [row_to_product(r) for r in cur.fetchall()]
            cur.execute(f"SELECT name, models FROM {schema()}.brands ORDER BY sort_order, id")
            brands = [{'name': b['name'], 'models': b['models']} for b in cur.fetchall()]
            cur.execute(
                f"SELECT name, sort_order, spec_fields FROM {schema()}.categories "
                f"WHERE is_active ORDER BY sort_order, name"
            )
            categories = [
                {
                    'name': c['name'],
                    'sortOrder': c['sort_order'],
                    'specFields': c['spec_fields'] or [],
                }
                for c in cur.fetchall()
            ]
            cur.close()
            data = build_xlsx(products, brands, categories)
            return resp(200, {'file': base64.b64encode(data).decode('ascii')})

        if action == 'import-xlsx':
            raw = str(body.get('file', ''))
            if ',' in raw and raw.startswith('data:'):
                raw = raw.split(',', 1)[1]
            try:
                blob = base64.b64decode(raw)
            except Exception:
                return resp(400, {'error': 'Файл не читается'})
            try:
                in_products, in_brands, in_categories = parse_xlsx(blob)
            except Exception:
                return resp(400, {'error': 'Это не таблица Excel или структура изменена'})
            if not in_products and not in_brands and not in_categories:
                return resp(400, {'error': 'В таблице не нашлось строк с товарами'})
            stats = import_rows(conn, in_products, in_brands, str(body.get('mode', 'merge')))
            saved_cats = import_categories(conn, in_categories)
            return resp(
                200,
                {
                    'ok': True,
                    'brands': len(in_brands),
                    'categories': saved_cats,
                    **stats,
                },
            )

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
            slug = str(body.get('slug', '')).strip()
            if not slug:
                cur_s = conn.cursor()
                cur_s.execute(f"SELECT slug FROM {schema()}.products")
                taken = {r[0] for r in cur_s.fetchall()}
                cur_s.close()
                slug = make_slug(name, taken)
            category = str(body.get('category', '')).strip() or 'Другое'
            fields = {
                'slug': q(slug),
                'sku': q(str(body.get('sku', '')).strip() or slug.upper()),
                'name': q(name),
                'category': q(category),
                'price': qint(body.get('price'), 0),
                'old_price': qint(body.get('oldPrice')),
                'pro_price': qint(body.get('proPrice')),
                'ozon_url': q(str(body.get('ozonUrl', ''))),
                'wb_url': q(str(body.get('wbUrl', ''))),
                'install': q(str(body.get('install', ''))),
                'warranty': q(str(body.get('warranty', ''))),
                'year_from': qint(body.get('yearFrom'), 2010),
                'year_to': qint(body.get('yearTo'), 2026),
                'badge': q(body.get('badge') or None),
                'images': qjson(body.get('images') or []),
                'description': qjson(body.get('description') or []),
                'specs': qjson(body.get('specs') or []),
                'kit': qjson(body.get('kit') or []),
                'notes': qjson(body.get('notes') or []),
                'fits': qjson(body.get('fits') or {}),
                'sort_order': qint(body.get('sortOrder'), 100),
                'popularity': qint(body.get('popularity'), 0),
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