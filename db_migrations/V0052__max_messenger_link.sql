UPDATE settings
SET value = jsonb_set(
  value,
  '{max}',
  '"https://max.ru/u/f9LHodD0cOLbhyaAq7otztBIIIdXwDbKppEWDhWbgAYw_b8hOY71Qcw14Sg"'::jsonb
)
WHERE key = 'contacts';