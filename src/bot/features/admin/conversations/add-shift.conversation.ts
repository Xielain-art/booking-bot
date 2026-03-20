import { InlineKeyboard } from 'grammy'
import type { Conversation } from '@grammyjs/conversations'
import dayjs from 'dayjs'
import type { Context } from '#root/bot/context.js'
import { AppointmentService } from '#root/services/appointments.service.js'
import { getWeekDays } from '#root/bot/helpers/calendar.js'
import { adminMenu } from '../menus/admin-main.menu.js'
import { i18n } from '#root/bot/i18n.js'

export type AdminConversation = Conversation<Context, Context>

export async function addShiftConversation(conversation: AdminConversation, ctx: Context) {
    const locale = ctx.from?.language_code || 'ru';
    const t = (key: string, vars?: any) => i18n.t(locale, key, vars);

    let startDate = dayjs().format('YYYY-MM-DD');
    let selectedDateStr: string | null = null;
    
    while (!selectedDateStr) {
        const weekDays = getWeekDays(startDate);
        const keyboard = new InlineKeyboard();
        
        let btnCount = 0;
        weekDays.forEach(day => {
            keyboard.text(day.display, `date_${day.dateStr}`);
            btnCount++;
            if (btnCount % 2 === 0) keyboard.row();
        });
        if (btnCount % 2 !== 0) keyboard.row();
        
        keyboard.text(t('add-shift-btn-prev'), `prev_${startDate}`).text(t('add-shift-btn-next'), `next_${startDate}`);
        keyboard.row().text(t('btn-cancel'), 'back_to_admin');

        await ctx.editMessageText(t('add-shift-select-date'), {
            reply_markup: keyboard, parse_mode: "HTML"
        });

        const callbackCtx = await conversation.waitForCallbackQuery(/^(date|prev|next|back_to_admin)/);
        const data = callbackCtx.callbackQuery.data;
        await callbackCtx.answerCallbackQuery(); 

        if (data === 'back_to_admin') {
            await callbackCtx.editMessageText(t('admin-panel-title'), { reply_markup: adminMenu, parse_mode: "HTML" });
            return; 
        }

        if (data.startsWith('prev_')) {
            startDate = dayjs(startDate).subtract(7, 'day').format('YYYY-MM-DD');
            ctx = callbackCtx; 
        } else if (data.startsWith('next_')) {
            startDate = dayjs(startDate).add(7, 'day').format('YYYY-MM-DD');
            ctx = callbackCtx;
        } else if (data.startsWith('date_')) {
            selectedDateStr = data.replace('date_', '');
            ctx = callbackCtx;
            break; 
        }
    }

    const displayDate = dayjs(selectedDateStr).format('DD.MM.YY');
    await ctx.editMessageText(t('add-shift-enter-time', { date: displayDate }), { parse_mode: "HTML" });

    const msg = await conversation.waitFor('message:text');
    const slots = (msg.message.text || '').split(' ').map(tkn => tkn.trim()).filter(tkn => tkn.includes(':'));

    if (slots.length === 0) {
        await ctx.reply(t('add-shift-no-time-entered'), { reply_markup: new InlineKeyboard().text(t('btn-back-to-admin'), "back_to_admin") });
        return;
    }

    try {
        await AppointmentService.setWorkingDay({ date: selectedDateStr, slots });
        await ctx.reply(t('add-shift-success', { date: displayDate, slots: slots.join(', ') }), {
            reply_markup: new InlineKeyboard().text(t('btn-back-to-admin'), "back_to_admin"), parse_mode: "HTML"
        });
    } catch (e) { await ctx.reply(t('add-shift-db-error')); }
}
