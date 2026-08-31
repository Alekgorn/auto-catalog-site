-- Ревизия файлового хранилища.
--
-- Файлов больше десяти тысяч, за один вызов функции их не обойти:
-- хранилище отдаёт список страницами, а функция живёт секунды. Поэтому
-- сканирование идёт порциями, а промежуточный результат копится здесь.
-- Таблица пересоздаётся при каждом новом сканировании — это не архив,
-- а рабочий черновик последнего отчёта.
CREATE TABLE IF NOT EXISTS storage_files (
  key         TEXT PRIMARY KEY,
  size_bytes  BIGINT      NOT NULL DEFAULT 0,
  modified_at TIMESTAMPTZ,
  -- Ссылается ли на файл сайт: заполняется после обхода всего хранилища,
  -- потому что до конца обхода мы просто не знаем полной картины
  used        BOOLEAN
);

-- Состояние обхода: докуда дошли и когда начали. Одна строка.
CREATE TABLE IF NOT EXISTS storage_scan (
  id          INT PRIMARY KEY DEFAULT 1,
  cursor_key  TEXT,
  done        BOOLEAN     NOT NULL DEFAULT FALSE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  CONSTRAINT storage_scan_single CHECK (id = 1)
);

CREATE INDEX IF NOT EXISTS storage_files_used_idx ON storage_files (used);
