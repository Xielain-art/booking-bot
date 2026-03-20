import { InlineKeyboard } from 'grammy'
import type { Conversation } from '@grammyjs/conversations'
import type { Context } from '#root/bot/context.js'
import { AppointmentService } from '#root/services/appointments.service.js'
import dayjs from 'dayjs'
import { i18n } from '#root/bot/i18n.js'

type AdminConversation = Conversation<Context, Context>

export const pendingReschedule = new Map<number, number>()

function buildDaysKeyboard(workingDays: string[], page: number, limit: number): InlineKeyboard {
    const totalPages = Math.ceil(workingDays.length / limit)
    const pageDays = workingDays.slice(page * limit, (page + 1) * limit)
    const keyboard = new InlineKeyboard()

    pageDays.forEach((dateStr, i) => {
        const d = dayjs(dateStr)
        keyboard.text(`📅 ${d.format('DD.MM.YY')}`, `rday_${dateStr}`)
        if ((i + 1) % 2 === 0) keyboard.row()
    })
    if (pageDays.length % 2 !== 0) keyboard.row()

    if (totalPages > 1) {
        keyboard.text(page > 0 ? '⬅️' : ' ', page > 0 ? `rpage_${page - 1}` : 'rnoop')
        keyboard.text(`${page + 1}/${totalPages}`, 'rnoop')
        keyboard.text(page < totalPages - 1 ? '➡️' : ' ', page < totalPages - 1 ? `rpage_${page + 1}` : 'rnoop')
        keyboard.row()
    }

    keyboard.text('❌ Отменить перенос', 'rcancel')
    return keyboard
}

export async function rescheduleAppointmentConversation(conversation: AdminConversation, ctx: Context) {
    const locale = ctx.from?.language_code || 'ru'
    const t = (key: string, vars?: any) => i18n.t(locale, key, vars)

    const userId = ctx.from?.id

    const appointmentId = await conversation.external(() =>
        userId ? pendingReschedule.get(userId) : undefined
    )

    if (!appointmentId) {
        await ctx.reply('❌ Ошибка: не удалось определить запись. Попробуйте снова.')
        return
    }

    const workingDays = await conversation.external(() => AppointmentService.getWorkingDays())

    if (workingDays.length === 0) {
        await ctx.reply('📭 <b>Нет доступных рабочих дней для переноса.</b>', {
            parse_mode: 'HTML',
            reply_markup: new InlineKeyboard().text('🔙 Главное меню', 'back_to_admin')
        })
        return
    }

    const limit = 8
    let page = 0

    const dateMsg = await ctx.reply('📅 <b>Выберите новую дату:</b>', {
        parse_mode: 'HTML',
        reply_markup: buildDaysKeyboard(workingDays, page, limit)
    })

    let selectedDate = ''
    while (!selectedDate) {
        const cb = await conversation.waitForCallbackQuery(/^(rday_|rpage_|rnoop|rcancel)/)
        await cb.answerCallbackQuery()
        const data = cb.callbackQuery.data

        if (data === 'rcancel') {
            await cb.editMessageText('❌ Перенос отменён.', { reply_markup: new InlineKeyboard().text('🔙 Главное меню', 'back_to_admin') })
            return
        }
        if (data === 'rnoop') continue

        if (data.startsWith('rpage_')) {
            const newPage = Number(data.replace('rpage_', ''))
            if (newPage >= 0 && newPage < Math.ceil(workingDays.length / limit)) {
                page = newPage
                await cb.editMessageText('📅 <b>Выберите новую дату:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: buildDaysKeyboard(workingDays, page, limit)
                })
            }
            continue
        }

        if (data.startsWith('rday_')) {
            selectedDate = data.replace('rday_', '')
            ctx = cb
            break
        }
    }

    const freeSlots = await conversation.external(() => AppointmentService.getFreeSlots(selectedDate))

    if (freeSlots.length === 0) {
        await ctx.editMessageText(
            `📭 <b>На ${dayjs(selectedDate).format('DD.MM.YY')} нет свободных слотов.</b>`,
            { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('❌ Отменить перенос', 'rcancel') }
        )
        const cb = await conversation.waitForCallbackQuery('rcancel')
        await cb.answerCallbackQuery()
        await cb.editMessageText('❌ Перенос отменён.', { reply_markup: new InlineKeyboard().text('🔙 Главное меню', 'back_to_admin') })
        return
    }

    const slotsKeyboard = new InlineKeyboard()
    freeSlots.forEach((slot: string, i: number) => {
        slotsKeyboard.text(`🕒 ${slot}`, `rtime_${slot}`)
        if ((i + 1) % 3 === 0) slotsKeyboard.row()
    })
    if (freeSlots.length % 3 !== 0) slotsKeyboard.row()
    slotsKeyboard.text('❌ Отменить перенос', 'rcancel')

    await ctx.editMessageText(
        `🕒 <b>Свободные слоты на ${dayjs(selectedDate).format('DD.MM.YY')}:</b>`,
        { parse_mode: 'HTML', reply_markup: slotsKeyboard }
    )

    let newTime = ''
    while (!newTime) {
        const cb = await conversation.waitForCallbackQuery(/^(rtime_|rcancel)/)
        await cb.answerCallbackQuery()
        const data = cb.callbackQuery.data

        if (data === 'rcancel') {
            await cb.editMessageText('❌ Перенос отменён.', { reply_markup: new InlineKeyboard().text('🔙 Главное меню', 'back_to_admin') })
            return
        }
        if (data.startsWith('rtime_')) {
            newTime = data.replace('rtime_', '')
            ctx = cb
            break
        }
    }

    const success = await conversation.external(() =>
        AppointmentService.rescheduleAppointment(appointmentId, selectedDate, newTime)
    )

    if (success) {
        await ctx.editMessageText(
            `✅ <b>Запись перенесена!</b>\n\n📅 Дата: <b>${dayjs(selectedDate).format('DD.MM.YYYY')}</b>\n🕒 Время: <b>${newTime}</b>`,
            { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 В главное меню', 'back_to_admin') }
        )
    } else {
        await ctx.editMessageText(
            '❌ <b>Слот уже занят.</b> Выберите другое время.',
            { parse_mode: 'HTML', reply_markup: new InlineKeyboard().text('🔙 Главное меню', 'back_to_admin') }
        )
    }
}
