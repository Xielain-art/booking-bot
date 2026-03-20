-- Функция для изменения статуса записи на "completed" (выполнено)
CREATE OR REPLACE FUNCTION mark_appointment_completed(p_appointment_id bigint) 
RETURNS void AS $$
BEGIN
  UPDATE appointments 
  SET status = 'completed' 
  WHERE id = p_appointment_id AND status = 'active';
END;
$$ LANGUAGE plpgsql;
