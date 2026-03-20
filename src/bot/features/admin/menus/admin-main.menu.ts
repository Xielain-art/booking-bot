import { Menu } from '@grammyjs/menu'
import type { Context } from '#root/bot/context.js'
import { viewAppointmentsMenu, upcomingAppointmentsMenu, completedAppointmentsMenu } from './appointments.menu.js'
import { servicesListMenu } from './services-list.menu.js'

export const adminMenu = new Menu<Context>('admin-main-menu')
    .text((ctx) => ctx.t('menu-add-shift'), async (ctx) => {
        await ctx.conversation.enter('addShiftConversation');
    }).row()
    .submenu((ctx) => ctx.t('menu-upcoming-appts'), 'upcoming-appointments-menu', async (ctx) => {
        if (ctx.session) ctx.session.upcomingPage = 0;
        await ctx.editMessageText('📋 <b>Предстоящие записи:</b>', { parse_mode: "HTML" });
    }).row()
    .submenu((ctx) => ctx.t('menu-completed-appts'), 'completed-appointments-menu', async (ctx) => {
        if (ctx.session) ctx.session.completedPage = 0;
        await ctx.editMessageText('✅ <b>Выполненные записи:</b>', { parse_mode: "HTML" });
    }).row()
    .submenu((ctx) => ctx.t('menu-calendar-appointments'), 'view-appointments-menu', async (ctx) => {
        if (ctx.session) ctx.session.shiftsPage = 0;
        await ctx.editMessageText(ctx.t('menu-calendar-desc'), { parse_mode: "HTML" });
    }).row()
    .submenu((ctx) => ctx.t('menu-my-services'), 'services-list-menu', async (ctx) => {
        await ctx.editMessageText(ctx.t('menu-services-desc'), { parse_mode: "HTML" });
    }).row()
    .text((ctx) => ctx.t('menu-close'), (ctx) => ctx.deleteMessage());

adminMenu.register(servicesListMenu);
adminMenu.register(viewAppointmentsMenu);
adminMenu.register(upcomingAppointmentsMenu);
adminMenu.register(completedAppointmentsMenu);
