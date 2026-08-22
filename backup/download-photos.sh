#!/bin/sh
# Скачивает архив фотографий товаров и распаковывает его.
#
# Использование:
#   sh download-photos.sh            # скачать и распаковать в ./photos
#   sh download-photos.sh /путь/куда # распаковать в свою папку
#
# Нужен только curl и tar — есть в любой Linux/macOS системе.

set -e

DEST="${1:-photos}"
LIST="$(dirname "$0")/photos-archive-parts.txt"
TMP="$(mktemp -d)"
MD5="0cd43fc19611a4989f1fd6fe001ea37d"

echo "Скачиваю части архива (187 МБ)..."
i=0
total=$(wc -l < "$LIST" | tr -d ' ')
while read -r url; do
  i=$((i + 1))
  name=$(basename "$url")
  printf "\r  %s из %s" "$i" "$total"
  curl -sS --max-time 120 --retry 3 -o "$TMP/$name" "$url"
done < "$LIST"
echo ""

echo "Собираю архив..."
cat "$TMP"/part-* > "$TMP/photos.tar.gz"

echo "Проверяю целостность..."
got=$(md5sum "$TMP/photos.tar.gz" 2>/dev/null | cut -d' ' -f1 \
      || md5 -q "$TMP/photos.tar.gz")
if [ "$got" != "$MD5" ]; then
  echo "ОШИБКА: архив повреждён (ожидалось $MD5, получено $got)"
  rm -rf "$TMP"
  exit 1
fi

echo "Распаковываю в $DEST ..."
mkdir -p "$DEST"
tar -xzf "$TMP/photos.tar.gz" -C "$DEST"
rm -rf "$TMP"

echo "Готово: $(find "$DEST" -type f | wc -l | tr -d ' ') фотографий в папке $DEST"
