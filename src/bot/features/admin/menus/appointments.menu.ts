import { Menu } from '@grammyjs/menu'
import dayjs from 'dayjs'
import type { Context } from '#root/bot/context.js'
import { AppointmentService } from '#root/services/appointments.service.js'
import { renderAdminDayReport, renderAppointmentDetails } from '#root/bot/helpers/admin-ui.js'

export const bindServiceSelectMenu = new Menu<Context>('bind-service-select-menu')
    .dynamic(async (ctx, range) => {
        const date = ctx.session?.viewedDate;
        const time = ctx.session?.slotToBind;
        if (!date || !time) return;

        const services = await AppointmentService.getServices(true); // Только активные

        range.text((ctx) => ctx.t('menu-bind-any-service'), async (ctx) => {
            await AppointmentService.bindServiceToSlot(date, time, null);
            await ctx.answerCallbackQuery({ text: ctx.t('bind-removed'), show_alert: true });
            const text = await renderAdminDayReport(date, ctx.t.bind(ctx));
            await ctx.editMessageText(text, { parse_mode: "HTML" });
            ctx.menu.nav('day-details-menu');
        }).row();

        services.forEach(s => {
            range.text((ctx) => ctx.t('menu-bind-specific-service', { name: s.name }), async (ctx) => {
                await AppointmentService.bindServiceToSlot(date, time, s.id);
                await ctx.answerCallbackQuery({ text: ctx.t('bind-added'), show_alert: true });
                const text = await renderAdminDayReport(date, ctx.t.bind(ctx));
                await ctx.editMessageText(text, { parse_mode: "HTML" });
                ctx.menu.nav('day-details-menu');
            }).row();
        });
    })
    .back((ctx) => ctx.t('menu-back-time-select'), (ctx) => ctx.menu.nav('bind-time-select-menu'));

export const bindTimeSelectMenu = new Menu<Context>('bind-time-select-menu')
    .dynamic(async (ctx, range) => {
        const date = ctx.session?.viewedDate;
        if (!date) return;
        const slots = await AppointmentService.getDaySlots(date);
        
        if (slots.length === 0) {
            range.text((ctx) => ctx.t('menu-no-slots')).row();
        } else {
            let btnCount = 0;
            slots.forEach(slot => {
                range.text(`🕒 ${slot}`, async (ctx) => {
                    if (ctx.session) ctx.session.slotToBind = slot;
                    await ctx.editMessageText(ctx.t('menu-bind-time-desc', { date: dayjs(date).format('DD.MM.YY'), time: slot }), { parse_mode: "HTML" });
                    ctx.menu.nav('bind-service-select-menu');
                });
                btnCount++;
                if (btnCount % 3 === 0) range.row();
            });
            if (btnCount % 3 !== 0) range.row();
        }
    })
    .back((ctx) => ctx.t('menu-back-report'), async (ctx) => {
        const text = await renderAdminDayReport(ctx.session?.viewedDate || '', ctx.t.bind(ctx));
        await ctx.editMessageText(text, { parse_mode: "HTML" });
    });

export const confirmDeleteMenu = new Menu<Context>('confirm-delete-menu')
    .text((ctx) => ctx.t('menu-confirm-delete'), async (ctx) => {
        const date = ctx.session?.viewedDate;
        const time = ctx.session?.timeToDelete;
        if (date && time) {
            await AppointmentService.removeTimeSlot(date, time);
            await ctx.answerCallbackQuery({ text: ctx.t('slot-deleted'), show_alert: true });
        }
        const text = await renderAdminDayReport(date || dayjs().format('YYYY-MM-DD'), ctx.t.bind(ctx));
        await ctx.editMessageText(text, { parse_mode: "HTML" });
        ctx.menu.nav('day-details-menu');
    })
    .text((ctx) => ctx.t('menu-cancel'), async (ctx) => {
        ctx.menu.nav('delete-time-menu');
    });

export const deleteTimeMenu = new Menu<Context>('delete-time-menu')
    .dynamic(async (ctx, range) => {
        const date = ctx.session?.viewedDate;
        if (!date) return;
        const slots = await AppointmentService.getDaySlots(date);
        slots.forEach(slot => {
            range.text(`❌ ${slot}`, async (ctx) => {
                if (ctx.session) ctx.session.timeToDelete = slot;
                await ctx.editMessageText(ctx.t('menu-delete-time-confirm', { time: slot }), { parse_mode: "HTML" });
                ctx.menu.nav('confirm-delete-menu');
            });
        });
    })
    .back((ctx) => ctx.t('menu-back-report'), async (ctx) => {
        const text = await renderAdminDayReport(ctx.session?.viewedDate || '', ctx.t.bind(ctx));
        await ctx.editMessageText(text, { parse_mode: "HTML" });
    });

export const dayAppointmentDetailsMenu = new Menu<Context>('day-appointment-details-menu')
    .text((ctx) => ctx.t('menu-mark-completed'), async (ctx) => {
        const id = ctx.session?.selectedAppointmentId;
        if (id) await AppointmentService.markAsCompleted(id);
        const date = ctx.session?.viewedDate;
        const text = await renderAdminDayReport(date || '', ctx.t.bind(ctx));
        await ctx.editMessageText(text, { parse_mode: "HTML" });
        ctx.menu.nav('day-details-menu');
    }).row()
    .text((ctx) => ctx.t('menu-cancel-appointment'), async (ctx) => {
        const id = ctx.session?.selectedAppointmentId;
        if (id) await AppointmentService.cancelByAdmin(id);
        const date = ctx.session?.viewedDate;
        const text = await renderAdminDayReport(date || '', ctx.t.bind(ctx));
        await ctx.editMessageText(text, { parse_mode: "HTML" });
        ctx.menu.nav('day-details-menu');
    }).row()
    .back((ctx) => ctx.t('menu-back-appointments'), async (ctx) => {
        const date = ctx.session?.viewedDate;
        const text = await renderAdminDayReport(date || '', ctx.t.bind(ctx));
        await ctx.editMessageText(text, { parse_mode: "HTML" });
    });

export const dayDetailsMenu = new Menu<Context>('day-details-menu')
    .dynamic(async (ctx, range) => {
        const date = ctx.session?.viewedDate;
        if (!date) return;
        const appts = await AppointmentService.getAppointmentsByDate(date);
        appts.forEach((a: any) => {
            range.text(`👤 ${a.time_slot} — ${a.client_name}`, async (ctx) => {
                if (ctx.session) ctx.session.selectedAppointmentId = Number(a.id);
                const fullAppt = await AppointmentService.getAppointmentById(Number(a.id));
                await ctx.editMessageText(renderAppointmentDetails(fullAppt, ctx.t.bind(ctx)), { parse_mode: 'HTML' });
                ctx.menu.nav('day-appointment-details-menu');
            }).row();
        });
    })
    .submenu((ctx) => ctx.t('menu-bind-service-time'), 'bind-time-select-menu', async (ctx) => {
        await ctx.editMessageText(ctx.t('menu-bind-service-desc'), { parse_mode: "HTML" });
    }).row()
    .submenu((ctx) => ctx.t('menu-delete-free-time'), 'delete-time-menu', async (ctx) => {
        await ctx.editMessageText(ctx.t('menu-delete-free-time-desc'));
    }).row()
    .back((ctx) => ctx.t('menu-back-shifts'), async (ctx) => {
        await ctx.editMessageText(ctx.t('menu-calendar-desc'), { parse_mode: "HTML" });
    });

export const viewAppointmentsMenu = new Menu<Context>('view-appointments-menu')
    .dynamic(async (ctx, range) => {
        const days = await AppointmentService.getWorkingDays(); 
        if (days.length === 0) return range.text((ctx) => ctx.t('menu-no-active-shifts')).row();
        
        const page = ctx.session?.shiftsPage || 0;
        const limit = 6; 
        const totalPages = Math.ceil(days.length / limit);
        const currentDays = days.slice(page * limit, (page + 1) * limit);

        currentDays.forEach((dayStr, index) => {
            range.text(`📅 ${dayjs(dayStr).format('DD.MM.YY')}`, async (ctx) => {
                if (ctx.session) ctx.session.viewedDate = dayStr;
                const text = await renderAdminDayReport(dayStr, ctx.t.bind(ctx));
                await ctx.editMessageText(text, { parse_mode: "HTML" });
                ctx.menu.nav('day-details-menu');
            });
            if (index % 2 !== 0) range.row();
        });
        if (currentDays.length % 2 !== 0) range.row();

        if (totalPages > 1) {
            range.text(page > 0 ? '⬅️' : ' ', async (ctx) => { 
                if (page > 0 && ctx.session) { ctx.session.shiftsPage = page - 1; ctx.menu.update(); }
            });
            range.text(`${page + 1} / ${totalPages}`, (ctx) => {});
            range.text(page < totalPages - 1 ? '➡️' : ' ', async (ctx) => { 
                if (page < totalPages - 1 && ctx.session) { ctx.session.shiftsPage = page + 1; ctx.menu.update(); }
            });
            range.row();
        }
    })
    .back((ctx) => ctx.t('menu-back-main'), async (ctx) => {
        await ctx.editMessageText(ctx.t('admin-panel-title'), { parse_mode: "HTML" });
    });

export const upcomingAppointmentDetailsMenu = new Menu<Context>('upcoming-appointment-details-menu')
    .text((ctx) => ctx.t('menu-mark-completed'), async (ctx) => {
        const id = ctx.session?.selectedAppointmentId;
        if (id) await AppointmentService.markAsCompleted(id);
        await ctx.editMessageText('📋 <b>Предстоящие записи:</b>', { parse_mode: "HTML" });
        ctx.menu.nav('upcoming-appointments-menu');
    }).row()
    .text((ctx) => ctx.t('menu-cancel-appointment'), async (ctx) => {
        const id = ctx.session?.selectedAppointmentId;
        if (id) await AppointmentService.cancelByAdmin(id);
        await ctx.editMessageText('📋 <b>Предстоящие записи:</b>', { parse_mode: "HTML" });
        ctx.menu.nav('upcoming-appointments-menu');
    }).row()
    .back((ctx) => ctx.t('menu-back-appointments'), async (ctx) => {
        await ctx.editMessageText('📋 <b>Предстоящие записи:</b>', { parse_mode: "HTML" });
    });

export const completedAppointmentDetailsMenu = new Menu<Context>('completed-appointment-details-menu')
    .back((ctx) => ctx.t('menu-back-appointments'), async (ctx) => {
        await ctx.editMessageText('✅ <b>Выполненные записи:</b>', { parse_mode: "HTML" });
    });

export const completedAppointmentsMenu = new Menu<Context>('completed-appointments-menu')
    .dynamic(async (ctx, range) => {
        const page = ctx.session?.completedPage || 0;
        const limit = 8;
        const { data: appts, count } = await AppointmentService.getCompletedAppointments(page, limit);
        if (count === 0) {
            range.text((ctx) => ctx.t('menu-completed-empty')).row();
        } else {
            appts.forEach((a: any) => {
                const dateStr = dayjs(a.work_date).format('DD.MM');
                range.text(`✅ ${dateStr} ${a.time_slot} — ${a.client_name}`, async (ctx) => {
                    if (ctx.session) ctx.session.selectedAppointmentId = Number(a.id);
                    const fullAppt = await AppointmentService.getAppointmentById(Number(a.id));
                    await ctx.editMessageText(renderAppointmentDetails(fullAppt, ctx.t.bind(ctx)), { parse_mode: 'HTML' });
                    ctx.menu.nav('completed-appointment-details-menu');
                }).row();
            });
            const totalPages = Math.ceil(count / limit);
            if (totalPages > 1) {
                range.text(page > 0 ? '⬅️' : ' ', (ctx) => {
                    if (page > 0 && ctx.session) { ctx.session.completedPage = page - 1; ctx.menu.update(); }
                });
                range.text(`${page + 1} / ${totalPages}`, () => {});
                range.text(page < totalPages - 1 ? '➡️' : ' ', (ctx) => {
                    if (page < totalPages - 1 && ctx.session) { ctx.session.completedPage = page + 1; ctx.menu.update(); }
                });
                range.row();
            }
        }
    })
    .back((ctx) => ctx.t('menu-back-main'), async (ctx) => {
        await ctx.editMessageText(ctx.t('admin-panel-title'), { parse_mode: "HTML" });
    });

export const upcomingAppointmentsMenu = new Menu<Context>('upcoming-appointments-menu')
    .dynamic(async (ctx, range) => {
        const page = ctx.session?.upcomingPage || 0;
        const limit = 8;
        const { data: appts, count } = await AppointmentService.getAllUpcomingAppointments(page, limit);
        if (count === 0) {
            range.text((ctx) => ctx.t('menu-upcoming-empty')).row();
        } else {
            appts.forEach((a: any) => {
                const dateStr = dayjs(a.work_date).format('DD.MM');
                range.text(`🗓 ${dateStr} ${a.time_slot} — ${a.client_name}`, async (ctx) => {
                    if (ctx.session) ctx.session.selectedAppointmentId = Number(a.id);
                    const fullAppt = await AppointmentService.getAppointmentById(Number(a.id));
                    await ctx.editMessageText(renderAppointmentDetails(fullAppt, ctx.t.bind(ctx)), { parse_mode: 'HTML' });
                    ctx.menu.nav('upcoming-appointment-details-menu');
                }).row();
            });
            const totalPages = Math.ceil(count / limit);
            if (totalPages > 1) {
                range.text(page > 0 ? '⬅️' : ' ', (ctx) => {
                    if (page > 0 && ctx.session) { ctx.session.upcomingPage = page - 1; ctx.menu.update(); }
                });
                range.text(`${page + 1} / ${totalPages}`, () => {});
                range.text(page < totalPages - 1 ? '➡️' : ' ', (ctx) => {
                    if (page < totalPages - 1 && ctx.session) { ctx.session.upcomingPage = page + 1; ctx.menu.update(); }
                });
                range.row();
            }
        }
    })
    .back((ctx) => ctx.t('menu-back-main'), async (ctx) => {
        await ctx.editMessageText(ctx.t('admin-panel-title'), { parse_mode: "HTML" });
    });

upcomingAppointmentsMenu.register(upcomingAppointmentDetailsMenu);
completedAppointmentsMenu.register(completedAppointmentDetailsMenu);
dayDetailsMenu.register(dayAppointmentDetailsMenu);
viewAppointmentsMenu.register(dayDetailsMenu);
dayDetailsMenu.register(deleteTimeMenu);
deleteTimeMenu.register(confirmDeleteMenu);
dayDetailsMenu.register(bindTimeSelectMenu);
bindTimeSelectMenu.register(bindServiceSelectMenu);
