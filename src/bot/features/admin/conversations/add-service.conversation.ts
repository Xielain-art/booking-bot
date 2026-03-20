import { InlineKeyboard } from 'grammy'
import type { Conversation } from '@grammyjs/conversations'
import type { Context } from '#root/bot/context.js'
import { AppointmentService } from '#root/services/appointments.service.js'
import { i18n } from '#root/bot/i18n.js'


export type AdminConversation = Conversation<Context, Context>

export async function addServiceConversation(conversation: AdminConversation, ctx: Context) {
    const locale = ctx.from?.language_code || 'ru';
    const t = (key: string, vars?: any) => i18n.t(locale, key, vars);

    await ctx.reply(t('add-service-enter-name'), { parse_mode: "HTML" });
    const nameMsg = await conversation.waitFor('message:text');
    const name = nameMsg.message.text || t('default-service-name');

    await ctx.reply(t('add-service-enter-price'), { parse_mode: "HTML" });
    const priceMsg = await conversation.waitFor('message:text');
    const price = parseInt(priceMsg.message.text || '0');
    const priceStr = priceMsg.message.text || '0';

    await ctx.reply(t('add-service-enter-duration'), { parse_mode: "HTML" });
    const durMsg = await conversation.waitFor('message:text');
    const durationStr = durMsg.message.text || '60';

    try {
        await AppointmentService.addService(name, Number(durationStr), Number(priceStr));
        await ctx.reply(t('add-service-success', { name }), {
            parse_mode: 'HTML',
            reply_markup: new InlineKeyboard().text('🔙 Возврат', 'back_to_services')
        });
    } catch (e) { await ctx.reply(t('generic-error')); }
}
