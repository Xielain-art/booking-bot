import dayjs from 'dayjs'

export const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function parseDate(rawDate: string): string | null {
    if (!/^\d{1,2}\.\d{1,2}$/.test(rawDate)) return null
    const [day, month] = rawDate.split('.')
    return dayjs(`${dayjs().year()}-${month}-${day}`).format('YYYY-MM-DD')
}

export function getWeekDays(startDateStr: string) {
    const start = dayjs(startDateStr)
    const days = []
    
    for (let i = 0; i < 7; i++) {
        const currentDay = start.add(i, 'day')
        days.push({
            dateStr: currentDay.format('YYYY-MM-DD'),
            display: `${WEEKDAYS[currentDay.day()]} ${currentDay.format('DD.MM.YY')}`, // Формат с коротким годом (26)
            isToday: currentDay.isSame(dayjs(), 'day')
        })
    }
    return days
}