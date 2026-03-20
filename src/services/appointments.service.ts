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
      p_date: valid.date,
      p_time: valid.time,
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

  async getAppointmentsByDate(dateRaw: string) {
    const date = v.parse(DateSchema, dateRaw)
    const { data, error } = await supabase.rpc('get_appointments_by_date', { p_date: date })

    if (error)
      throw new Error(`Ошибка БД: ${error.message}`)
    return v.parse(AdminAppointmentsListSchema, data || [])
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
}
