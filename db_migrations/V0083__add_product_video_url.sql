ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '';
COMMENT ON COLUMN products.video_url IS 'Видео товара: ссылка на свой файл в S3 или на YouTube/Rutube';