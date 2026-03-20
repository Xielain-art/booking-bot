import dayjs from 'dayjs'
import { AppointmentService } from '#root/services/appointments.service.js'

export async function renderAdminDayReport(dateStr: string, t: (key: string, vars?: any) => string): Promise<string> {
    try {
        const appts = await AppointmentService.getAppointmentsByDate(dateStr)
        const allSlots = await AppointmentService.getDaySlots(dateStr)
        const bindings = await AppointmentService.getSlotBindings(dateStr)
        const services = await AppointmentService.getServices(false)
        
        let text = t('admin-report-title', { date: dayjs(dateStr).format('DD.MM.YY') })
        
        if (appts.length > 0) {
            text += t('admin-report-appts-count') + `\n\n`
        }

        if (allSlots.length > 0) {
            text += t('admin-report-slots-title') + `\n`
            allSlots.forEach(slot => {
                const boundServiceId = bindings[slot]
                if (boundServiceId) {
                    const sName = services.find(s => s.id === boundServiceId)?.name || 'Неизвестно'
                    text += t('admin-report-slot-specific', { time: slot, service: sName }) + `\n`
                } else {
                    text += t('admin-report-slot-any', { time: slot }) + `\n`
                }
            })
        } else {
            text += t('admin-report-no-slots')
        }
        
        return text
    } catch (e) {
        return `❌ Ошибка загрузки базы данных.`
    }
}

export function renderAppointmentDetails(appt: any, t: (key: string, vars?: any) => string): string {
    const serviceOpts = appt.services || {}; // if loaded via getAppointmentById
    const serviceName = serviceOpts.name || appt.service_name || 'Неизвестно';
    const price = serviceOpts.price || '0';
    const duration = serviceOpts.duration_minutes || '0';

    return t('admin-appointment-details', {
        name: appt.client_name,
        phone: appt.client_phone || '---',
        username: appt.client_username ? `@${appt.client_username.replace('@', '')}` : '---',
        date: dayjs(appt.work_date).format('DD.MM.YY'),
        time: appt.time_slot,
        service: serviceName,
        price,
        duration
    });
}