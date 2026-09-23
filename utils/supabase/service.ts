import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getSupabaseUrl } from '@/utils/publicEnv'

export function createServiceClient() {
    const supabaseUrl = getSupabaseUrl()
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        const missing = [
            supabaseUrl ? null : 'NEXT_PUBLIC_SUPABASE_URL',
            serviceRoleKey ? null : 'SUPABASE_SERVICE_ROLE_KEY',
        ].filter(Boolean).join(', ')

        throw new Error(`Missing Supabase service-role configuration: ${missing}.`)
    }

    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
