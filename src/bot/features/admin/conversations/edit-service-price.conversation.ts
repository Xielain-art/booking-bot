import { InlineKeyboard } from 'grammy'
import type { Conversation } from '@grammyjs/conversations'
import type { Context } from '#root/bot/context.js'
import { AppointmentService } from '#root/services/appointments.service.js'
import { i18n } from '#root/bot/i18n.js'
import { pendingServiceEdit } from '#root/bot/features/admin/menus/services-list.menu.js'

// import { servicesListMenu } from '../menus/services-list.menu.js'

export type AdminConversation = Conversation<Context, Context>

export async function editServicePriceConversation(conversation: AdminConversation, ctx: Context) {
    const locale = ctx.from?.language_code || 'ru';
    const t = (key: string, vars?: any) => i18n.t(locale, key, vars);

    const userId = ctx.from?.id;
    const serviceId = userId ? pendingServiceEdit.get(userId) : undefined;
    
    if (!serviceId) {
        await ctx.reply(t('edit-service-not-found'), { reply_markup: new InlineKeyboard().text(t('btn-back-to-admin'), "back_to_admin") });
        return;
    }

    await ctx.reply(t('edit-service-enter-price'), { parse_mode: "HTML" });
    
    const msg = await conversation.waitFor('message:text');
    const newPrice = parseInt(msg.message.text || '0');

    if (isNaN(newPrice) || newPrice <= 0) {
        await ctx.reply(t('edit-service-invalid-number'), { reply_markup: new InlineKeyboard().text(t('btn-back-to-admin'), "back_to_admin") });
        return;
    }

    try {
        const services = await AppointmentService.getServices(false);
        const s = services.find(x => Number(x.id) === Number(serviceId));
        if (s) {
            await AppointmentService.updateService(serviceId, s.name, s.duration_minutes, newPrice, s.is_active);
            await ctx.reply(t('edit-service-success', { price: newPrice }), { 
                reply_markup: new InlineKeyboard().text('🔙 Возврат', 'back_to_services') 
            });
        }
    } catch (e) { await ctx.reply(t('edit-service-db-error')); }
}
