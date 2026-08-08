"""Подготовка картинок для сайта: перевод в WebP и уменьшение размера."""

import io

from PIL import Image, ImageOps

MAX_SIDE = 1600
QUALITY = 82
MIN_GAIN = 0.9


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
    img.save(buf, format='WEBP', quality=QUALITY, method=3)
    data = buf.getvalue()

    if len(data) >= len(raw) * MIN_GAIN and ext in ('jpg', 'jpeg', 'webp'):
        return raw, ext, _mime(ext)

    return data, 'webp', 'image/webp'


def _mime(ext: str) -> str:
    return f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}"