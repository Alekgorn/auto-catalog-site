-- Машины, под которые не удалось собрать комплект.
-- Пишем КАЖДЫЙ показ заглушки, даже если человек ничего не оставил:
-- владельцу магазина важно видеть спрос, а не только заявки.
CREATE TABLE IF NOT EXISTS missing_fit_requests (
  id serial PRIMARY KEY,
  brand varchar(64) NOT NULL,
  model varchar(96) NOT NULL,
  year integer NOT NULL DEFAULT 0,
  -- Сценарий, в котором упёрлись
  scenario varchar(96) NOT NULL DEFAULT '',
  -- Контакт из формы «сообщить, когда появится». Пусто — просто заход
  contact varchar(128) NOT NULL DEFAULT '',
  -- Сколько раз эту машину искали: повторные заходы копим в одну строку
  hits integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Одна машина — одна строка, повторы увеличивают счётчик
CREATE UNIQUE INDEX IF NOT EXISTS missing_fit_car
  ON missing_fit_requests (brand, model, year);

CREATE INDEX IF NOT EXISTS missing_fit_recent
  ON missing_fit_requests (updated_at DESC);