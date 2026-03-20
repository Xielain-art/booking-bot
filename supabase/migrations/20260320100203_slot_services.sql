-- 1. Исправляем баг перезаписи смен! Теперь массивы времени ОБЪЕДИНЯЮТСЯ и сортируются.
CREATE OR REPLACE FUNCTION set_working_day(p_date date, p_slots text[]) RETURNS void AS $$
BEGIN
  INSERT INTO working_days (work_date, slots)
  VALUES (p_date, p_slots)
  ON CONFLICT (work_date) DO UPDATE
  SET slots = ARRAY(
    SELECT DISTINCT unnest(working_days.slots || EXCLUDED.slots)
    ORDER BY 1
  );
END;
$$ LANGUAGE plpgsql;

-- 2. Создаем таблицу для привязки конкретной услуги к конкретному времени
CREATE TABLE IF NOT EXISTS slot_services (
  work_date date NOT NULL,
  time_slot text NOT NULL,
  service_id bigint REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (work_date, time_slot),
  FOREIGN KEY (work_date) REFERENCES working_days(work_date) ON DELETE CASCADE
);

-- 3. Функция для установки или снятия привязки (если service_id = NULL, привязка снимается)
CREATE OR REPLACE FUNCTION bind_service_to_slot(p_date date, p_time text, p_service_id bigint) RETURNS void AS $$
BEGIN
  IF p_service_id IS NULL THEN
    DELETE FROM slot_services WHERE work_date = p_date AND time_slot = p_time;
  ELSE
    INSERT INTO slot_services (work_date, time_slot, service_id)
    VALUES (p_date, p_time, p_service_id)
    ON CONFLICT (work_date, time_slot) DO UPDATE SET service_id = EXCLUDED.service_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE slot_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on slot_services" ON slot_services FOR SELECT USING (true);