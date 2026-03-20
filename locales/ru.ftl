## Commands
start =
    .description = Запустить бота
language =
    .description = Сменить язык
setcommands =
    .description = Обновить команды бота

## Welcome Feature
welcome = Добро пожаловать!

## Language Feature
language-select = Пожалуйста, выберите язык
language-changed = Язык успешно изменен!

## Admin Feature
admin-commands-updated = Команды обновлены.
admin-no-rights = ⚠️ Нет прав.
admin-panel-title = 🛠 <b>Админ-панель:</b>

## Admin Menus
menu-add-shift = ➕ Добавить время (смену)
menu-calendar-appointments = 📅 Календарь и записи
menu-calendar-desc = 📅 <b>Список открытых смен:</b>
    <i>Выберите день для просмотра:</i>
menu-my-services = ✂️ Мои услуги
menu-services-desc = ✂️ <b>Управление услугами:</b>
    <i>Здесь вы можете настроить прайс-лист</i>
menu-upcoming-appts = 📋 Предстоящие записи
menu-completed-appts = ✅ Выполненные записи
menu-close = ❌ Закрыть
menu-no-services = Услуг пока нет
menu-add-new-service = ➕ Добавить новую услугу
menu-back-main = 🔙 В главное меню
menu-desc-active-service = ✅ Услуга АКТИВНА (Выключить)
menu-desc-inactive-service = ❌ Услуга ВЫКЛЮЧЕНА (Включить)
menu-change-price = 💰 Изменить цену ({$price}₽)
menu-back-services = 🔙 Назад к списку услуг
menu-edit-service-desc = ⚙️ <b>Редактирование услуги:</b>
    Название: {$name}
    Цена: {$price}₽
    Длительность: {$duration} мин.
menu-bind-any-service = 🌍 Доступна любая услуга (Снять привязку)
bind-removed = Привязка снята!
menu-bind-specific-service = 💅 Только: {$name}
bind-added = Услуга привязана!
menu-back-time-select = 🔙 Назад к выбору времени
menu-no-slots = Слотов нет
menu-bind-time-desc = Выберите услугу, которая будет доступна <b>{$date} в {$time}</b>:
menu-back-report = 🔙 Назад к отчету
menu-confirm-delete = ✅ Да, удалить
slot-deleted = Слот удален!
menu-cancel = ❌ Отмена
menu-delete-time-confirm = ❓ Точно удалить время <b>{$time}</b>?
menu-bind-service-time = 🔗 Привязать услугу к времени
menu-bind-service-desc = Выберите время для настройки услуги:
menu-delete-free-time = ➖ Удалить свободное время
menu-delete-free-time-desc = Выберите время для удаления:
menu-back-shifts = 🔙 К списку смен
menu-no-active-shifts = 📭 Нет активных смен
menu-upcoming-empty = 📭 Нет предстоящих записей
menu-completed-empty = 📭 Нет выполненных записей
menu-cancel-appointment = ❌ Отменить запись
menu-mark-completed = ✅ Запись выполнена
menu-back-appointments = 🔙 Назад к списку записей

## Admin Conversations
add-shift-btn-prev = ⬅️ Ранее
add-shift-btn-next = Позже ➡️
btn-cancel = 🔙 Отмена
add-shift-select-date = 📅 <b>Выберите дату:</b>
    <i>(Новое время добавится к уже существующему)</i>
add-shift-enter-time = 🗓 Выбрана дата: <b>{$date}</b>
    
    ⏰ Напишите доступное время через пробел
    <i>Пример: 10:00 12:00</i>:
add-shift-no-time-entered = ❌ Вы не ввели ни одного времени.
btn-back-to-admin = 🔙 В админку
add-shift-success = ✅ Смена на <b>{$date}</b> успешно обновлена!
    Добавлены слоты: {$slots}
add-shift-db-error = 🔥 Ошибка БД при сохранении смены.

add-service-enter-name = 📝 <b>Введите название новой услуги:</b>
default-service-name = Без названия
add-service-enter-price = 💰 <b>Введите стоимость (только цифры):</b>
add-service-enter-duration = ⏳ <b>Введите длительность в минутах:</b>
add-service-success = ✅ Услуга <b>"{$name}"</b> добавлена!
generic-error = ❌ Ошибка.

edit-service-not-found = ❌ Ошибка: Услуга не найдена во временной памяти.
edit-service-enter-price = 💰 <b>Введите новую стоимость услуги (только цифры):</b>
    <i>Например: 2500</i>
edit-service-invalid-number = ❌ Ошибка: Введите корректное число.
edit-service-success = ✅ Цена успешно изменена на {$price}₽!
edit-service-db-error = ❌ Ошибка обновления цены.

## Admin UI Helper
admin-report-title = 📅 <b>Отчет на {$date}:</b>

admin-report-appts-count = 📋 <b>Текущие записи (нажмите для деталей):</b>
admin-report-slots-title = 🕒 <b>Свободные слоты:</b>
admin-report-slot-specific =    • {$time} <i>(Только: {$service})</i>
admin-report-slot-any =    • {$time} <i>(Любая услуга)</i>
admin-report-no-slots = 📭 <i>Доступных слотов больше нет.</i>

admin-appointment-details = 📋 <b>Сведения о записи:</b>
    
    👤 <b>Клиент:</b> {$name}
    📞 <b>Телефон:</b> {$phone}
    💬 <b>Telegram:</b> {$username}
    
    📅 <b>Дата:</b> {$date}
    🕒 <b>Время:</b> {$time}
    💅 <b>Услуга:</b> {$service}
    💰 <b>Стоимость:</b> {$price}₽
    ⏳ <b>Длительность:</b> {$duration} мин.

## Unhandled Feature
unhandled = Команда не распознана. Попробуйте /start
