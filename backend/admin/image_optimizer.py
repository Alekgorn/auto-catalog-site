"""Подготовка картинок для сайта: перевод в WebP и уменьшение размера."""

import io

from PIL import Image, ImageOps

# Товарные фото показываются в карточке размером с ладонь и на странице
# товара — 1000 точек по большей стороне хватает даже на экранах с высокой
# плотностью. Всё, что больше, посетитель качает впустую.
MAX_SIDE = 1000
QUALITY = 78
MIN_GAIN = 0.95


def optimize(raw: bytes, ext: str) -> tuple[bytes, str, str]:
    """Возвращает (данные, расширение, content-type) готового файла.

    SVG и анимация остаются как есть — их нельзя пережать без потери сути.
    """
    if ext == 'svg':
        return raw, 'svg', 'image/svg+xml'

    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        return raw, ext, _mime(ext)

    if getattr(img, 'is_animated', False):
        return raw, ext, _mime(ext)

    img = ImageOps.exif_transpose(img)

    has_alpha = img.mode in ('RGBA', 'LA') or (
        img.mode == 'P' and 'transparency' in img.info
    )
    img = img.convert('RGBA' if has_alpha else 'RGB')

    if max(img.size) > MAX_SIDE:
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)

    buf = io.BytesIO()
    # method=4 — чуть дольше сжимает, но файл заметно легче
    img.save(buf, format='WEBP', quality=QUALITY, method=4)
    data = buf.getvalue()

    if len(data) >= len(raw) * MIN_GAIN and ext in ('jpg', 'jpeg', 'webp'):
        return raw, ext, _mime(ext)

    return data, 'webp', 'image/webp'


def _mime(ext: str) -> str:
    return f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}"