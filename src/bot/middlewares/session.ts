// src/bot/middlewares/session.ts
import type { Context, SessionData } from '#root/bot/context.js'
import type { Middleware, SessionOptions } from 'grammy'
import { session as createSession } from 'grammy'

// Добавляем 'initial' в список разрешенных свойств
type Options = Pick<SessionOptions<SessionData, Context>, 'getSessionKey' | 'storage' | 'initial'>

export function session(options: Options): Middleware<Context> {
  return createSession({
    getSessionKey: options.getSessionKey,
    storage: options.storage,
    // Теперь используем тот initial, который передадим при создании бота
    initial: options.initial,
  })
}
