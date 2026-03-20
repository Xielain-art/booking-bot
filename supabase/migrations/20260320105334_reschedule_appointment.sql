CREATE OR REPLACE FUNCTION reschedule_appointment(p_id bigint, p_new_date date, p_new_time text) 
RETURNS boolean AS $$
BEGIN
  -- Check if target slot is already active
  IF EXISTS (SELECT 1 FROM appointments WHERE work_date = p_new_date AND time_slot = p_new_time AND status = 'active') THEN
    RETURN false;
  END IF;
  
  UPDATE appointments 
  SET work_date = p_new_date, time_slot = p_new_time 
  WHERE id = p_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
