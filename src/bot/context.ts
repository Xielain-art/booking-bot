import type { Config } from '#root/config.js'
import type { Logger } from '#root/logger.js'
import type { AutoChatActionFlavor } from '@grammyjs/auto-chat-action'
import type { ConversationFlavor } from '@grammyjs/conversations'
import type { HydrateFlavor } from '@grammyjs/hydrate'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { ParseModeFlavor } from '@grammyjs/parse-mode'
import type { Context as DefaultContext, SessionFlavor } from 'grammy'

export interface SessionData {
  viewedDate: string
  selectedDate: string | null
  timeToDelete?: string | null
  shiftMenuStartDate?: string | null
  newShiftDate?: string | null
  shiftsPage?: number
  upcomingPage?: number
  completedPage?: number
  selectedServiceId?: number | null;
  selectedAppointmentId?: number | null;
  slotToBind?: string | null;
}

interface ExtendedContextFlavor {
  logger: Logger
  config: Config
}

type CoreContext = DefaultContext &
  ExtendedContextFlavor &
  SessionFlavor<SessionData> &
  I18nFlavor &
  AutoChatActionFlavor

export type Context = ParseModeFlavor<
  HydrateFlavor<
    ConversationFlavor<CoreContext>
  >
>
