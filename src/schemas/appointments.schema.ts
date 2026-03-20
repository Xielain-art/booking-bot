import * as v from 'valibot'

export const DateSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Ожидается дата в формате YYYY-MM-DD'),
)

export const TimeSchema = v.pipe(
  v.string(),
  v.regex(/^\d{2}:\d{2}$/, 'Ожидается время в формате HH:MM'),
)

export const BookAppointmentInput = v.object({
  tgId: v.number(),
  name: v.string(),
  username: v.string(),  
  phone: v.string(),        
  date: DateSchema,        
  time: TimeSchema,        
  serviceId: v.number(),   
});

export const CreateShiftInput = v.object({
  date: DateSchema,
  slots: v.pipe(v.array(TimeSchema), v.minLength(1, 'Нужен хотя бы 1 слот времени')),
})

export const ClientAppointmentSchema = v.object({
  appointment_id: v.number(),
  work_date: v.string(),
  time_slot: TimeSchema,
})
export const ClientAppointmentsListSchema = v.array(ClientAppointmentSchema)
export const AdminAppointmentSchema = v.object({
  time_slot: TimeSchema,
  client_name: v.string(),
  status: v.union([v.literal('active'), v.literal('cancelled'), v.literal('completed')]),
})
export const AdminAppointmentsListSchema = v.array(AdminAppointmentSchema)
