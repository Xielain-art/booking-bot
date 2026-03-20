import { supabase } from '#root/db/supabase.js'
import {
  AdminAppointmentsListSchema,
  BookAppointmentInput,
  ClientAppointmentsListSchema,
  CreateShiftInput,
  DateSchema,
  TimeSchema,
} from '#root/schemas/appointments.schema.js'
import * as v from 'valibot'
import dayjs from 'dayjs'

export const AppointmentService = {
  async getFreeSlots(dateRaw: string): Promise<string[]> {
    const date = v.parse(DateSchema, dateRaw)
    const { data, error } = await supabase.rpc('get_free_slots', { p_date: date })

    if (error)
      throw new Error(`Ошибка поиска слотов: ${error.message}`)
    return data ? data.map(d => d.available_time) : []
  },

  async bookAppointment(params: v.InferInput<typeof BookAppointmentInput>): Promise<boolean> {
    const valid = v.parse(BookAppointmentInput, params)

    const { data: isSuccess, error } = await supabase.rpc('book_appointment', {
      p_tg_id: valid.tgId,
      p_name: valid.name,
      p_username: valid.username,   
      p_phone: valid.phone,          
      p_date: valid.date,
      p_time: valid.time,
      p_service_id: valid.serviceId, 
    })
    
    if (error)
      throw new Error(`Ошибка записи: ${error.message}`)
    return isSuccess ?? false
  },

  async getClientAppointments(tgId: number) {
    const { data, error } = await supabase.rpc('get_client_appointments', { p_tg_id: tgId })
    if (error)
      throw new Error(`Ошибка БД: ${error.message}`)

    return v.parse(ClientAppointmentsListSchema, data || [])
  },

  async cancelByClient(appointmentId: number, tgId: number): Promise<boolean> {
    const { data: isSuccess, error } = await supabase.rpc('cancel_appointment_by_client', {
      p_appointment_id: appointmentId,
      p_tg_id: tgId,
    })

    if (error)
      throw new Error(`Ошибка отмены: ${error.message}`)
    return isSuccess ?? false
  },

  async getWorkingDaysInMonth(year: number, month: number): Promise<number[]> {
    const { data, error } = await supabase.rpc('get_working_days_in_month', {
      p_year: year,
      p_month: month,
    })

    if (error)
      throw new Error(`Ошибка БД: ${error.message}`)
    return data ? data.map(row => Number(row.working_date.split('-')[2])) : []
  },

  async setWorkingDay(params: v.InferInput<typeof CreateShiftInput>): Promise<void> {
    const valid = v.parse(CreateShiftInput, params)
    const { error } = await supabase.rpc('set_working_day', {
      p_date: valid.date,
      p_slots: valid.slots,
    })

    if (error)
      throw new Error(`Ошибка создания смены: ${error.message}`)
  },

  async getAppointmentsByDate(dateRaw: string): Promise<any[]> {
    const date = v.parse(DateSchema, dateRaw)
    const { data, error } = await supabase.rpc('get_appointments_by_date', { p_date: date })

    if (error)
      throw new Error(`Ошибка БД: ${error.message}`)
    
    return data || []
  },

  async getAllUpcomingAppointments(page: number = 0, limit: number = 8): Promise<{ data: any[], count: number }> {
    const today = dayjs().format('YYYY-MM-DD');
    const start = page * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('appointments')
      .select('id, time_slot, client_name, client_username, client_phone, work_date, status, services(name, price, duration_minutes)', { count: 'exact' })
      .gte('work_date', today)
      .eq('status', 'active')
      .order('work_date', { ascending: true })
      .order('time_slot', { ascending: true })
      .range(start, end);

    if (error) throw new Error(`Ошибка БД: ${error.message}`);
    return { data: data || [], count: count || 0 };
  },

  async getCompletedAppointments(page: number = 0, limit: number = 8): Promise<{ data: any[], count: number }> {
    const start = page * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('appointments')
      .select('id, time_slot, client_name, client_username, client_phone, work_date, status, services(name, price, duration_minutes)', { count: 'exact' })
      .eq('status', 'completed')
      .order('work_date', { ascending: false })
      .order('time_slot', { ascending: false })
      .range(start, end);

    if (error) throw new Error(`Ошибка БД: ${error.message}`);
    return { data: data || [], count: count || 0 };
  },

  async markAsCompleted(appointmentId: number): Promise<void> {
    const { error } = await supabase.rpc('mark_appointment_completed', {
      p_appointment_id: appointmentId,
    });
    if (error) throw new Error(`Ошибка изменения статуса: ${error.message}`);
  },

  async rescheduleAppointment(appointmentId: number, newDate: string, newTime: string): Promise<boolean> {
    const { data: isSuccess, error } = await supabase.rpc('reschedule_appointment', {
      p_id: appointmentId,
      p_new_date: newDate,
      p_new_time: newTime
    });

    if (error) throw new Error(`Ошибка переноса: ${error.message}`);
    return isSuccess ?? false;
  },

  async getAppointmentById(id: number): Promise<any | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, time_slot, client_name, client_username, client_phone, work_date, status, services(name, price, duration_minutes)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Ошибка БД: ${error.message}`);
    return data || null;
  },

  async deleteWorkingDay(dateRaw: string): Promise<void> {
    const date = v.parse(DateSchema, dateRaw)
    const { error } = await supabase.rpc('delete_working_day', { p_date: date })
    if (error)
      throw new Error(`Ошибка удаления дня: ${error.message}`)
  },

  async getDaySlots(dateRaw: string): Promise<string[]> {
    const date = v.parse(DateSchema, dateRaw)
    const { data, error } = await supabase.rpc('get_day_slots', { p_date: date })
    if (error)
      throw new Error(`Ошибка получения слотов дня: ${error.message}`)
    return data || []
  },

  async removeTimeSlot(dateRaw: string, timeRaw: string): Promise<void> {
    const date = v.parse(DateSchema, dateRaw)
    const time = v.parse(TimeSchema, timeRaw)
    const { error } = await supabase.rpc('remove_time_slot', { p_date: date, p_time: time })
    if (error)
      throw new Error(`Ошибка удаления времени: ${error.message}`)
  },

  async cancelByAdmin(appointmentId: number): Promise<void> {
    const { error } = await supabase.rpc('cancel_appointment_by_admin', {
      p_appointment_id: appointmentId,
    })
    if (error)
      throw new Error(`Ошибка отмены админом: ${error.message}`)
  },

  async getWorkingDays(): Promise<string[]> {
    const today = dayjs().format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('working_days')
      .select('work_date, slots')
      .gte('work_date', today) 
      .order('work_date', { ascending: true });

    if (error || !data) {
      console.error('Ошибка получения списка смен:', error);
      return [];
    }

    return data
      .filter(row => row.slots && row.slots.length > 0)
      .map(row => row.work_date);
  },


  async getServices(onlyActive: boolean = false): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_services', { p_only_active: onlyActive })
    if (error) throw new Error(`Ошибка получения услуг: ${error.message}`)
    return data || []
  },

  async addService(name: string, duration: number, price: number): Promise<void> {
    const { error } = await supabase.rpc('add_service', { 
      p_name: name, p_duration: duration, p_price: price 
    })
    if (error) throw new Error(`Ошибка добавления услуги: ${error.message}`)
  },

  async updateService(id: number, name: string, duration: number, price: number, isActive: boolean): Promise<void> {
    const { error } = await supabase.rpc('update_service', { 
      p_id: id, p_name: name, p_duration: duration, p_price: price, p_is_active: isActive 
    })
    if (error) throw new Error(`Ошибка обновления услуги: ${error.message}`)
  },

  async getSlotBindings(dateRaw: string): Promise<Record<string, number | null>> {
    const date = v.parse(DateSchema, dateRaw)
    const { data, error } = await supabase.from('slot_services').select('time_slot, service_id').eq('work_date', date)
    if (error) return {}
    
    const result: Record<string, number | null> = {}
    
    data?.forEach(d => {
      result[d.time_slot] = d.service_id
    })
    
    return result
  },

  async bindServiceToSlot(dateRaw: string, timeRaw: string, serviceId: number | null): Promise<void> {
    const date = v.parse(DateSchema, dateRaw)
    const time = v.parse(TimeSchema, timeRaw)
    const { error } = await supabase.rpc('bind_service_to_slot', {
      p_date: date, 
      p_time: time, 
      p_service_id: serviceId as number 
    })
    if (error) throw new Error(`Ошибка привязки: ${error.message}`)
  }
}