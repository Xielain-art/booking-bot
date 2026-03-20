import { Composer } from 'grammy'
import { createConversation } from '@grammyjs/conversations'
import type { Context } from '#root/bot/context.js'
import { config } from '#root/config.js'

// Import Conversations
import { addShiftConversation } from './conversations/add-shift.conversation.js'
import { addServiceConversation } from './conversations/add-service.conversation.js'
import { editServicePriceConversation } from './conversations/edit-service-price.conversation.js'
import { rescheduleAppointmentConversation, pendingReschedule } from './conversations/reschedule.conversation.js'

// Import Menus
import { adminMenu } from './menus/admin-main.menu.js'
import { servicesListMenu } from './menus/services-list.menu.js'

export const adminFeature = new Composer<Context>()

adminFeature.use(createConversation(addShiftConversation, "addShiftConversation"));
adminFeature.use(createConversation(addServiceConversation, "addServiceConversation"));
adminFeature.use(createConversation(editServicePriceConversation, "editServicePriceConversation"));
adminFeature.use(createConversation(rescheduleAppointmentConversation, "rescheduleAppointmentConversation"));

adminFeature.use(adminMenu);

adminFeature.command('admin', async (ctx) => {
    if (!config.botAdmins.includes(ctx.from?.id || 0)) return ctx.reply(ctx.t('admin-no-rights'));
    await ctx.reply(ctx.t('admin-panel-title'), { reply_markup: adminMenu, parse_mode: "HTML" });
});

adminFeature.callbackQuery('back_to_admin', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery.message) {
        await ctx.editMessageText(ctx.t('admin-panel-title'), { reply_markup: adminMenu, parse_mode: 'HTML' });
    } else {
        await ctx.reply(ctx.t('admin-panel-title'), { reply_markup: adminMenu, parse_mode: 'HTML' });
    }
});

adminFeature.callbackQuery('back_to_services', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.callbackQuery.message) {
        await ctx.editMessageText(ctx.t('menu-services-desc'), { reply_markup: servicesListMenu, parse_mode: 'HTML' });
    } else {
        await ctx.reply(ctx.t('menu-services-desc'), { reply_markup: servicesListMenu, parse_mode: 'HTML' });
    }
});

// Bridge handler: Grammy menus cannot call ctx.conversation.enter() directly,
// so rescue buttons post a plain InlineKeyboard with 'do_reschedule:ID' callback,
// which is caught here where ctx.conversation IS available.
adminFeature.callbackQuery(/^do_reschedule:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const appointmentId = Number(ctx.match[1]);
    if (!appointmentId || isNaN(appointmentId)) return;
    
    // Store in module-level Map (reliable across Grammy conversation replays)
    const userId = ctx.from?.id;
    if (userId) pendingReschedule.set(userId, appointmentId);
    
    await ctx.deleteMessage();
    await ctx.conversation.enter('rescheduleAppointmentConversation');
});

