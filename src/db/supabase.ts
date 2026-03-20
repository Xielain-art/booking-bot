import type { Database } from '#root/db/database.types.js'
import { config } from '#root/config.js'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = config.supabaseUrl
const supabaseKey = config.supabaseSecretKey

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Отсутствуют SUPABASE_URL или SUPABASE_KEY в .env')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
