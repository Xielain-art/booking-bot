import { Menu } from '@grammyjs/menu'
import type { Context } from '#root/bot/context.js'
import { AppointmentService } from '#root/services/appointments.service.js'

export const pendingServiceEdit = new Map<number, number>();

export const serviceEditMenu = new Menu<Context>('service-edit-menu')
    .dynamic(async (ctx, range) => {
        const serviceId = ctx.session?.selectedServiceId;
        if (!serviceId) return;
        const services = await AppointmentService.getServices(false);
        const s = services.find(x => Number(x.id) === Number(serviceId));
        if (!s) return;

        range.text(s.is_active ? ctx.t('menu-desc-active-service') : ctx.t('menu-desc-inactive-service'), async (ctx) => {
            await AppointmentService.updateService(s.id, s.name, s.duration_minutes, s.price, !s.is_active);
            ctx.menu.update(); 
        }).row();

        range.text(ctx.t('menu-change-price', { price: s.price }), async (ctx) => {
            if (ctx.from?.id) pendingServiceEdit.set(ctx.from.id, Number(s.id));
            await ctx.deleteMessage(); // Удаляем меню, чтобы не зависло
            await ctx.conversation.enter('editServicePriceConversation');
        }).row();
    })
    .back((ctx) => ctx.t('menu-back-services'), async (ctx) => {
        await ctx.editMessageText(ctx.t('menu-services-desc'), { parse_mode: "HTML" });
    });

export const servicesListMenu = new Menu<Context>('services-list-menu')
    .dynamic(async (ctx, range) => {
        try {
            const services = await AppointmentService.getServices(false);
            if (services.length === 0) {
                range.text(ctx.t('menu-no-services')).row();
            } else {
                services.forEach(s => {
                    const statusIcon = s.is_active ? '🟢' : '🔴';
                    range.text(`${statusIcon} ${s.name} — ${s.price}₽`, async (ctx) => {
                        if (ctx.session) ctx.session.selectedServiceId = s.id;
                        await ctx.editMessageText(ctx.t('menu-edit-service-desc', { name: s.name, price: s.price, duration: s.duration_minutes }), { parse_mode: "HTML" });
                        ctx.menu.nav('service-edit-menu');
                    }).row();
                });
            }
        } catch (e) {}
    })
    .text((ctx) => ctx.t('menu-add-new-service'), async (ctx) => {
        await ctx.deleteMessage();
        await ctx.conversation.enter('addServiceConversation');
    }).row()
    .back((ctx) => ctx.t('menu-back-main'), async (ctx) => {
        await ctx.editMessageText(ctx.t('admin-panel-title'), { parse_mode: "HTML" });
    });

servicesListMenu.register(serviceEditMenu);
