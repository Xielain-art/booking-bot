import { Composer } from 'grammy'
import { createConversation } from '@grammyjs/conversations'
import type { Context } from '#root/bot/context.js'
import { config } from '#root/config.js'

// Import Conversations
import { addShiftConversation } from './conversations/add-shift.conversation.js'
import { addServiceConversation } from './conversations/add-service.conversation.js'
import { editServicePriceConversation } from './conversations/edit-service-price.conversation.js'

// Import Menus
import { adminMenu } from './menus/admin-main.menu.js'

export const adminFeature = new Composer<Context>()

// Register Conversations
adminFeature.use(createConversation(addShiftConversation, "addShiftConversation"));
adminFeature.use(createConversation(addServiceConversation, "addServiceConversation"));
adminFeature.use(createConversation(editServicePriceConversation, "editServicePriceConversation"));

adminFeature.command('admin', async (ctx) => {
    if (!config.botAdmins.includes(ctx.from?.id || 0)) return ctx.reply(ctx.t('admin-no-rights'));
    await ctx.reply(ctx.t('admin-panel-title'), { reply_markup: adminMenu, parse_mode: "HTML" });
});

adminFeature.callbackQuery("back_to_admin", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(ctx.t('admin-panel-title'), { reply_markup: adminMenu, parse_mode: "HTML" });
});
